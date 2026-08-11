use sqlx::PgPool;
use chrono::{Utc, Duration, TimeZone, DateTime, NaiveDate};
use serde::{Deserialize, Serialize};
use std::env;
use std::collections::HashMap;
use serde_json::json;

#[derive(Serialize, Deserialize)]
struct GoogleTokenResponse {
    access_token: String,
    refresh_token: Option<String>,
    expires_in: i64,
}

#[derive(Debug, Clone)]
struct SleepSession {
    start_ms: i64,
    end_ms: i64,
    light_ms: i64,
    deep_ms: i64,
    rem_ms: i64,
    awake_ms: i64,
}

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
    
    sqlx::query!(
        "INSERT INTO configuracion (access_token, refresh_token, token_expiry) VALUES ($1, $2, $3)",
        res.access_token, res.refresh_token.unwrap_or_default(), expiry
    ).execute(pool).await.map_err(|e| e.to_string())?;

    Ok(())
}

pub async fn sync_data(pool: &PgPool) -> Result<(), String> {
    println!("\n🚀 --- INICIANDO SINCRONIZACIÓN CON GOOGLE FIT ---");
    let config = sqlx::query!("SELECT access_token, refresh_token, token_expiry FROM configuracion LIMIT 1")
        .fetch_optional(pool).await.map_err(|e| e.to_string())?.ok_or("No hay token guardado")?;

    let mut access_token = config.access_token;
    let refresh_token = config.refresh_token;

    if Utc::now() >= config.token_expiry {
        println!("🔄 El token ha caducado. Refrescando...");
        let client_id = env::var("GOOGLE_CLIENT_ID").unwrap_or_default();
        let client_secret = env::var("GOOGLE_CLIENT_SECRET").unwrap_or_default();
        let client = reqwest::Client::new();
        
        let response = client.post("https://oauth2.googleapis.com/token")
            .form(&[
                ("client_id", client_id.as_str()), 
                ("client_secret", client_secret.as_str()), 
                ("refresh_token", refresh_token.as_str()), 
                ("grant_type", "refresh_token")
            ])
            .send().await.map_err(|e| e.to_string())?;

        if response.status().is_success() {
            let res = response.json::<GoogleTokenResponse>().await.map_err(|e| e.to_string())?;
            access_token = res.access_token;
            let new_expiry = Utc::now() + Duration::seconds(res.expires_in);
            sqlx::query!("UPDATE configuracion SET access_token = $1, token_expiry = $2", access_token, new_expiry)
                .execute(pool).await.ok();
            println!("✅ Token refrescado con éxito.");
        } else {
            let err_txt = response.text().await.unwrap_or_default();
            eprintln!("❌ ERROR AL REFRESCAR EL TOKEN: {}", err_txt);
            return Err("Credenciales de Google caducadas.".to_string());
        }
    }

    let offset_spain = Duration::hours(2); 
    let now_spain = Utc::now() + offset_spain;
    let medianoche_spain = now_spain.date_naive().and_hms_opt(0, 0, 0).unwrap();
    
    let start_time = (medianoche_spain - Duration::days(31)).and_utc().timestamp_millis() - offset_spain.num_milliseconds();
    let end_time = Utc::now().timestamp_millis();
    
    println!("⏱️ Ventana de tiempo: de {} a {}", start_time, end_time);

    let client = reqwest::Client::new();

    // ==========================================
    // 1. PROCESADO DE SUEÑO
    // ==========================================
    println!("🔍 Solicitando datos de sueño a Google Fit...");
    let body_sueno = json!({
        "aggregateBy": [{"dataTypeName": "com.google.sleep.segment"}],
        "bucketBySession": {"minDurationMillis": 1200000},
        "startTimeMillis": start_time,
        "endTimeMillis": end_time
    });
    let res_sueno = client.post("https://www.googleapis.com/fitness/v1/users/me/dataset:aggregate")
        .bearer_auth(&access_token).json(&body_sueno).send().await.map_err(|e| e.to_string())?;

    println!("📡 Estado Petición Sesiones: {}", res_sueno.status());

    let start_nano = start_time as i64 * 1_000_000;
    let end_nano = end_time as i64 * 1_000_000;
    let url_fases = format!("https://www.googleapis.com/fitness/v1/users/me/dataSources/derived:com.google.sleep.segment:com.google.android.gms:merged/datasets/{}-{}", start_nano, end_nano);
    let res_fases = client.get(&url_fases).bearer_auth(&access_token).send().await.map_err(|e| e.to_string())?;
    
    println!("📡 Estado Petición Fases Crudas: {}", res_fases.status());

    let mut fases_points: Vec<serde_json::Value> = Vec::new();
    if res_fases.status().is_success() {
        let json_fases: serde_json::Value = res_fases.json().await.unwrap_or_default();
        if let Some(pts) = json_fases["point"].as_array() {
            fases_points = pts.clone();
            println!("📦 Extraídos {} micro-puntos de sueño.", fases_points.len());
        } else {
            println!("⚠️ La petición de fases fue exitosa pero no trajo el array 'point'.");
        }
    } else {
        eprintln!("⚠️ Fallo al obtener fases crudas: {:?}", res_fases.text().await);
    }

    if res_sueno.status().is_success() {
        let json_data: serde_json::Value = res_sueno.json().await.unwrap_or_default();
        let mut sleep_by_date: HashMap<NaiveDate, Vec<SleepSession>> = HashMap::new();

        if let Some(buckets) = json_data["bucket"].as_array() {
            println!("🪣 Se encontraron {} sesiones (buckets) en el rango.", buckets.len());
            for bucket in buckets {
                let act_type = bucket["session"]["activityType"].as_i64();

                if act_type == Some(72) { 
                    let session_start_ms = bucket["session"]["startTimeMillis"].as_str().and_then(|s| s.parse::<i64>().ok()).unwrap_or(0);
                    let session_end_ms = bucket["session"]["endTimeMillis"].as_str().and_then(|s| s.parse::<i64>().ok()).unwrap_or(0);
                    
                    if session_start_ms > 0 && session_end_ms > session_start_ms {
                        let mut session = SleepSession { start_ms: session_start_ms, end_ms: session_end_ms, light_ms: 0, deep_ms: 0, rem_ms: 0, awake_ms: 0 };
                        let mut tiene_fases = false;

                        if !fases_points.is_empty() {
                            for point in &fases_points {
                                let s_nano = point["startTimeNanos"].as_str().and_then(|s| s.parse::<i64>().ok()).unwrap_or(0);
                                let e_nano = point["endTimeNanos"].as_str().and_then(|s| s.parse::<i64>().ok()).unwrap_or(0);
                                let pt_start_ms = s_nano / 1_000_000;
                                let pt_end_ms = e_nano / 1_000_000;
                                
                                let overlap_start = pt_start_ms.max(session_start_ms);
                                let overlap_end = pt_end_ms.min(session_end_ms);
                                
                                if overlap_start < overlap_end { 
                                    let dur_ms = overlap_end - overlap_start;
                                    if let Some(values) = point["value"].as_array() {
                                        if let Some(fase) = values.get(0).and_then(|v| v["intVal"].as_i64()) {
                                            tiene_fases = true;
                                            match fase {
                                                1 | 3 => session.awake_ms += dur_ms, 
                                                2 | 4 => session.light_ms += dur_ms, 
                                                5 => session.deep_ms += dur_ms,      
                                                6 => session.rem_ms += dur_ms,       
                                                _ => session.light_ms += dur_ms,
                                            }
                                        }
                                    }
                                }
                            }
                        }

                        if !tiene_fases {
                            session.light_ms = session_end_ms - session_start_ms;
                        }

                        let fecha_sesion = (Utc.timestamp_millis_opt(session_end_ms).unwrap() + offset_spain).naive_utc().date();
                        sleep_by_date.entry(fecha_sesion).or_default().push(session);
                    }
                }
            }
        }

        for (fecha, mut sessions) in sleep_by_date {
            sessions.sort_by_key(|s| -(s.end_ms - s.start_ms));
            let main_sleep = &sessions[0];
            
            let mut siesta_total_ms = 0;
            let mut siesta_start: Option<DateTime<Utc>> = None;
            let mut siesta_end: Option<DateTime<Utc>> = None;

            if sessions.len() > 1 {
                let siesta_principal = &sessions[1];
                siesta_start = Some(Utc.timestamp_millis_opt(siesta_principal.start_ms).unwrap());
                siesta_end = Some(Utc.timestamp_millis_opt(siesta_principal.end_ms).unwrap());

                for nap in &sessions[1..] {
                    siesta_total_ms += nap.light_ms + nap.deep_ms + nap.rem_ms;
                }
            }

            let main_start_dt = Utc.timestamp_millis_opt(main_sleep.start_ms).unwrap();
            let main_end_dt = Utc.timestamp_millis_opt(main_sleep.end_ms).unwrap();
            
            let min_ligero = (main_sleep.light_ms / 60000) as i32;
            let min_profundo = (main_sleep.deep_ms / 60000) as i32;
            let min_rem = (main_sleep.rem_ms / 60000) as i32;
            let min_despierto = (main_sleep.awake_ms / 60000) as i32;
            let min_siesta = (siesta_total_ms / 60000) as i32;
            
            let total_dormido = min_ligero + min_profundo + min_rem;

            if total_dormido > 0 || min_siesta > 0 {
                match sqlx::query!(
                    r#"
                    INSERT INTO sueno (
                        fecha, minutos_sueno, 
                        hora_inicio, hora_fin, 
                        minutos_ligero, minutos_profundo, minutos_rem, minutos_despierto,
                        minutos_siesta, siesta_hora_inicio, siesta_hora_fin
                    ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
                    ON CONFLICT (fecha) DO UPDATE SET 
                        minutos_sueno = $2, 
                        hora_inicio = $3, hora_fin = $4,
                        minutos_ligero = $5, minutos_profundo = $6, minutos_rem = $7, minutos_despierto = $8,
                        minutos_siesta = $9, siesta_hora_inicio = $10, siesta_hora_fin = $11
                    "#,
                    fecha, total_dormido, 
                    main_start_dt, main_end_dt, 
                    min_ligero, min_profundo, min_rem, min_despierto,
                    min_siesta, siesta_start, siesta_end
                ).execute(pool).await {
                    Ok(_) => println!("   ✅ BD: Sueño guardado para el {}.", fecha),
                    Err(e) => eprintln!("   ❌ BD ERROR: Fallo al guardar el sueño: {}", e),
                }
            }
        }
    } else {
        eprintln!("❌ ERROR API SUEÑO (Sesiones): {:?}", res_sueno.text().await);
    }

    // ==========================================
    // 2. PROCESADO DE PASOS
    // ==========================================
    println!("🚶 Solicitando datos de pasos a Google Fit...");
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
        let json_data: serde_json::Value = serde_json::from_str(&texto_crudo).unwrap_or_default();
        
        if let Some(buckets) = json_data["bucket"].as_array() {
            println!("🪣 Se encontraron {} buckets de pasos en el rango.", buckets.len());
            for bucket in buckets {
                if let Some(start_ms) = bucket["startTimeMillis"].as_str().and_then(|s| s.parse::<i64>().ok()) {
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
                        match sqlx::query!("INSERT INTO pasos (fecha, cantidad) VALUES ($1, $2) ON CONFLICT (fecha) DO UPDATE SET cantidad = $2", fecha, total_pasos)
                            .execute(pool).await {
                                Ok(_) => println!("   ✅ BD: Pasos guardados para el {}: {} pasos", fecha, total_pasos),
                                Err(e) => eprintln!("   ❌ BD ERROR: No se pudieron guardar los pasos del {}: {}", fecha, e),
                            }
                    }
                }
            }
        }
    } else {
        eprintln!("❌ ERROR API PASOS: {:?}", res_pasos.text().await);
    }

    println!("🏁 --- SINCRONIZACIÓN FINALIZADA ---\n");
    Ok(())
}