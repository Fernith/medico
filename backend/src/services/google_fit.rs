use sqlx::PgPool;
use chrono::{Utc, Duration, TimeZone};
use serde::{Deserialize, Serialize};
use std::env;
use serde_json::json;

#[derive(Serialize, Deserialize)]
struct GoogleTokenResponse {
    access_token: String,
    refresh_token: Option<String>,
    expires_in: i64,
}

// ============================================================================
// 1. OBTENCIÓN Y GUARDADO DEL TOKEN (LLAVE)
// ============================================================================
pub async fn exchange_code_and_save(pool: &PgPool, code: &str) -> Result<(), String> {
    let client_id = env::var("GOOGLE_CLIENT_ID").unwrap_or_default();
    let client_secret = env::var("GOOGLE_CLIENT_SECRET").unwrap_or_default();
    let redirect_uri = env::var("GOOGLE_REDIRECT_URI").unwrap_or_default();

    let client = reqwest::Client::new();
    let params = [
        ("code", code),
        ("client_id", client_id.as_str()),
        ("client_secret", client_secret.as_str()),
        ("redirect_uri", redirect_uri.as_str()),
        ("grant_type", "authorization_code"),
    ];

    let response = client.post("https://oauth2.googleapis.com/token")
        .form(&params).send().await.map_err(|e| e.to_string())?;

    if !response.status().is_success() {
        return Err(format!("Error Google OAuth: {}", response.text().await.unwrap_or_default()));
    }

    let res = response.json::<GoogleTokenResponse>().await.map_err(|e| e.to_string())?;
    let expiry = Utc::now() + Duration::seconds(res.expires_in);
    
    sqlx::query!("DELETE FROM configuracion").execute(pool).await.ok();
    
    // Guardamos el token en BBDD unificada (TEXT)
    sqlx::query!(
        "INSERT INTO configuracion (access_token, refresh_token, token_expiry) VALUES ($1, $2, $3)",
        res.access_token, res.refresh_token.unwrap_or_default(), expiry
    ).execute(pool).await.map_err(|e| e.to_string())?;

    Ok(())
}

// ============================================================================
// 2. SINCRONIZACIÓN DE DATOS (PASOS Y SUEÑO EXACTO)
// ============================================================================
pub async fn sync_data(pool: &PgPool) -> Result<(), String> {
    let config = sqlx::query!("SELECT access_token, refresh_token, token_expiry FROM configuracion LIMIT 1")
        .fetch_optional(pool).await.map_err(|e| e.to_string())?.ok_or("No hay token guardado")?;

    let mut access_token = config.access_token;
    let refresh_token = config.refresh_token;

    if Utc::now() >= config.token_expiry {
        let client_id = env::var("GOOGLE_CLIENT_ID").unwrap_or_default();
        let client_secret = env::var("GOOGLE_CLIENT_SECRET").unwrap_or_default();
        let client = reqwest::Client::new();
        let response = client.post("https://oauth2.googleapis.com/token")
            .form(&[("client_id", client_id.as_str()), ("client_secret", client_secret.as_str()), ("refresh_token", refresh_token.as_str()), ("grant_type", "refresh_token")])
            .send().await.map_err(|e| e.to_string())?;

        if response.status().is_success() {
            let res = response.json::<GoogleTokenResponse>().await.map_err(|e| e.to_string())?;
            access_token = res.access_token;
            let new_expiry = Utc::now() + Duration::seconds(res.expires_in);
            sqlx::query!("UPDATE configuracion SET access_token = $1, token_expiry = $2", access_token, new_expiry)
                .execute(pool).await.ok();
        }
    }

    // MAGIA TEMPORAL: Ajustamos el inicio exactamente a las 00:00:00 de España (UTC+2 actual)
    let offset_spain = Duration::hours(2); 
    let now_spain = Utc::now() + offset_spain;
    let medianoche_spain = now_spain.date_naive().and_hms_opt(0, 0, 0).unwrap();
    
    let start_time = (medianoche_spain - Duration::days(7)).and_utc().timestamp_millis() - offset_spain.num_milliseconds();
    let end_time = Utc::now().timestamp_millis();
    
    let client = reqwest::Client::new();

    // B) Descargar y procesar Pasos (Agregados por día)
    let body_pasos = json!({
        "aggregateBy": [{"dataTypeName": "com.google.step_count.delta"}],
        "bucketByTime": {"durationMillis": 86400000},
        "startTimeMillis": start_time,
        "endTimeMillis": end_time
    });

    let res_pasos = client.post("https://www.googleapis.com/fitness/v1/users/me/dataset:aggregate")
        .bearer_auth(&access_token).json(&body_pasos).send().await.map_err(|e| e.to_string())?;

    if res_pasos.status().is_success() {
        let texto_crudo = res_pasos.text().await.unwrap_or_default();
        
        // CHIVATO DE PASOS: Para depurar los valores de Zepp vs Google
        println!("=== DEBUG PASOS GOOGLE FIT ===\n{}\n=============================", texto_crudo);
        
        let json_data: serde_json::Value = serde_json::from_str(&texto_crudo).unwrap_or_default();
        if let Some(buckets) = json_data["bucket"].as_array() {
            for bucket in buckets {
                if let Some(start_ms) = bucket["startTimeMillis"].as_str().and_then(|s| s.parse::<i64>().ok()) {
                    // Usamos el offset de España para no fallar de día al convertir la fecha
                    let fecha = (Utc.timestamp_millis_opt(start_ms).unwrap() + offset_spain).naive_utc().date();
                    let mut total_pasos = 0;

                    if let Some(datasets) = bucket["dataset"].as_array() {
                        for dataset in datasets {
                            if let Some(points) = dataset["point"].as_array() {
                                for point in points {
                                    if let Some(values) = point["value"].as_array() {
                                        if let Some(val) = values.get(0).and_then(|v| v["intVal"].as_i64()) {
                                            total_pasos += val as i32;
                                        }
                                    }
                                }
                            }
                        }
                    }
                    if total_pasos > 0 {
                        sqlx::query!("INSERT INTO pasos (fecha, cantidad) VALUES ($1, $2) ON CONFLICT (fecha) DO UPDATE SET cantidad = $2", fecha, total_pasos)
                            .execute(pool).await.ok();
                    }
                }
            }
        }
    }

    // C) Descargar y procesar Sueño Exacto (Silencioso y limpio para Producción)
    let body_sueno = json!({
        "aggregateBy": [{"dataTypeName": "com.google.sleep.segment"}],
        "bucketBySession": {"minDurationMillis": 1200000},
        "startTimeMillis": start_time,
        "endTimeMillis": end_time
    });

    let res_sueno = client.post("https://www.googleapis.com/fitness/v1/users/me/dataset:aggregate")
        .bearer_auth(&access_token).json(&body_sueno).send().await.map_err(|e| e.to_string())?;

    if res_sueno.status().is_success() {
        let json_data: serde_json::Value = res_sueno.json().await.unwrap_or_default();
        let mut sueno_por_dia: std::collections::HashMap<chrono::NaiveDate, i32> = std::collections::HashMap::new();

        if let Some(buckets) = json_data["bucket"].as_array() {
            for bucket in buckets {
                if bucket["session"]["activityType"].as_i64() == Some(72) {
                    if let Some(end_ms) = bucket["session"]["endTimeMillis"].as_str().and_then(|s| s.parse::<i64>().ok()) {
                        let fecha_sesion = (Utc.timestamp_millis_opt(end_ms).unwrap() + offset_spain).naive_utc().date();
                        
                        let start_ms = bucket["session"]["startTimeMillis"].as_str().and_then(|s| s.parse::<i64>().ok()).unwrap_or(0);
                        let mut minutos_sesion = 0;
                        if start_ms > 0 && end_ms > start_ms {
                            minutos_sesion = ((end_ms - start_ms) / 60000) as i32;
                        }

                        let mut tiempo_dormido_nanos: i64 = 0;
                        if let Some(datasets) = bucket["dataset"].as_array() {
                            for dataset in datasets {
                                if let Some(points) = dataset["point"].as_array() {
                                    for point in points {
                                        let start_nano = point["startTimeNanos"].as_str().and_then(|s| s.parse::<i64>().ok()).unwrap_or(0);
                                        let end_nano = point["endTimeNanos"].as_str().and_then(|s| s.parse::<i64>().ok()).unwrap_or(0);
                                        if let Some(values) = point["value"].as_array() {
                                            if let Some(fase) = values.get(0).and_then(|v| v["intVal"].as_i64()) {
                                                if fase != 1 { tiempo_dormido_nanos += end_nano - start_nano; }
                                            }
                                        }
                                    }
                                }
                            }
                        }

                        let mut minutos_finales = minutos_sesion;
                        if tiempo_dormido_nanos > 0 {
                            minutos_finales = (tiempo_dormido_nanos / 60_000_000_000) as i32;
                        }

                        if minutos_finales > 0 {
                            *sueno_por_dia.entry(fecha_sesion).or_insert(0) += minutos_finales;
                        }
                    }
                }
            }
        }

        for (fecha, minutos_totales) in sueno_por_dia {
            sqlx::query!("INSERT INTO sueno (fecha, minutos_sueno) VALUES ($1, $2) ON CONFLICT (fecha) DO UPDATE SET minutos_sueno = $2", fecha, minutos_totales)
                .execute(pool).await.ok();
        }
    }

    Ok(())
}