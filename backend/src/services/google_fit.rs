use chrono::{DateTime, Duration, NaiveDate, TimeZone, Timelike, Utc};
use serde::{Deserialize, Serialize};
use serde_json::json;
use sqlx::PgPool;
use std::collections::HashMap;
use std::env;

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

    let response = client
        .post("https://oauth2.googleapis.com/token")
        .form(&params)
        .send()
        .await
        .map_err(|e| e.to_string())?;

    if !response.status().is_success() {
        return Err(format!(
            "Error Google OAuth: {}",
            response.text().await.unwrap_or_default()
        ));
    }

    let res = response
        .json::<GoogleTokenResponse>()
        .await
        .map_err(|e| e.to_string())?;
    let expiry = Utc::now() + Duration::seconds(res.expires_in);

    sqlx::query!("DELETE FROM configuracion")
        .execute(pool)
        .await
        .ok();

    sqlx::query!(
        "INSERT INTO configuracion (access_token, refresh_token, token_expiry) VALUES ($1, $2, $3)",
        res.access_token,
        res.refresh_token.unwrap_or_default(),
        expiry
    )
    .execute(pool)
    .await
    .map_err(|e| e.to_string())?;

    Ok(())
}

async fn obtener_o_refrescar_token(pool: &PgPool) -> Result<String, String> {
    let config =
        sqlx::query!("SELECT access_token, refresh_token, token_expiry FROM configuracion LIMIT 1")
            .fetch_optional(pool)
            .await
            .map_err(|e| e.to_string())?
            .ok_or_else(|| "No hay token guardado".to_string())?;

    let mut access_token = config.access_token;
    let refresh_token = config.refresh_token;

    if Utc::now() >= config.token_expiry {
        println!("🔄 El token ha caducado. Refrescando...");
        let client_id = env::var("GOOGLE_CLIENT_ID").unwrap_or_default();
        let client_secret = env::var("GOOGLE_CLIENT_SECRET").unwrap_or_default();
        let client = reqwest::Client::new();

        let response = client
            .post("https://oauth2.googleapis.com/token")
            .form(&[
                ("client_id", client_id.as_str()),
                ("client_secret", client_secret.as_str()),
                ("refresh_token", refresh_token.as_str()),
                ("grant_type", "refresh_token"),
            ])
            .send()
            .await
            .map_err(|e| e.to_string())?;

        if response.status().is_success() {
            let res = response
                .json::<GoogleTokenResponse>()
                .await
                .map_err(|e| e.to_string())?;
            access_token = res.access_token;
            let new_expiry = Utc::now() + Duration::seconds(res.expires_in);
            sqlx::query!(
                "UPDATE configuracion SET access_token = $1, token_expiry = $2",
                access_token,
                new_expiry
            )
            .execute(pool)
            .await
            .ok();
            println!("✅ Token refrescado con éxito.");
        } else {
            let err_txt = response.text().await.unwrap_or_default();
            eprintln!("❌ ERROR AL REFRESCAR EL TOKEN: {}", err_txt);
            return Err("Credenciales de Google caducadas.".to_string());
        }
    }else{
        println!("✅ Token funcionando correctamente")
    }

    Ok(access_token)
}

pub async fn procesar_sueno(
    client: &reqwest::Client,
    access_token: &str,
    pool: &PgPool,
    start_time: i64,
    end_time: i64,
    offset_spain: Duration,
) -> Result<(), String> {
    println!("🔍 Solicitando datos de sueño a Google Fit...");
    let body_sueno = json!({
        "aggregateBy": [{"dataTypeName": "com.google.sleep.segment"}],
        "bucketBySession": {"minDurationMillis": 1200000},
        "startTimeMillis": start_time,
        "endTimeMillis": end_time
    });
    let res_sueno = client
        .post("https://www.googleapis.com/fitness/v1/users/me/dataset:aggregate")
        .bearer_auth(access_token)
        .json(&body_sueno)
        .send()
        .await
        .map_err(|e| e.to_string())?;

    println!("📡 Estado Petición Sesiones Sueño: {}", res_sueno.status());

    let start_nano = start_time * 1_000_000;
    let end_nano = end_time * 1_000_000;
    let url_fases = format!(
        "https://www.googleapis.com/fitness/v1/users/me/dataSources/derived:com.google.sleep.segment:com.google.android.gms:merged/datasets/{}-{}",
        start_nano, end_nano
    );
    let res_fases = client
        .get(&url_fases)
        .bearer_auth(access_token)
        .send()
        .await
        .map_err(|e| e.to_string())?;

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
        eprintln!(
            "⚠️ Fallo al obtener fases crudas: {:?}",
            res_fases.text().await
        );
    }

    if res_sueno.status().is_success() {
        let json_data: serde_json::Value = res_sueno.json().await.unwrap_or_default();
        let mut sleep_by_date: HashMap<NaiveDate, Vec<SleepSession>> = HashMap::new();

        if let Some(buckets) = json_data["bucket"].as_array() {
            println!(
                "🪣 Se encontraron {} sesiones (buckets) de sueño en el rango.",
                buckets.len()
            );
            for bucket in buckets {
                let act_type = bucket["session"]["activityType"].as_i64();

                if act_type == Some(72) {
                    let session_start_ms = bucket["session"]["startTimeMillis"]
                        .as_str()
                        .and_then(|s| s.parse::<i64>().ok())
                        .unwrap_or(0);
                    let session_end_ms = bucket["session"]["endTimeMillis"]
                        .as_str()
                        .and_then(|s| s.parse::<i64>().ok())
                        .unwrap_or(0);

                    if session_start_ms > 0 && session_end_ms > session_start_ms {
                        let mut session = SleepSession {
                            start_ms: session_start_ms,
                            end_ms: session_end_ms,
                            light_ms: 0,
                            deep_ms: 0,
                            rem_ms: 0,
                            awake_ms: 0,
                        };
                        let mut tiene_fases = false;

                        if !fases_points.is_empty() {
                            for point in &fases_points {
                                let s_nano = point["startTimeNanos"]
                                    .as_str()
                                    .and_then(|s| s.parse::<i64>().ok())
                                    .unwrap_or(0);
                                let e_nano = point["endTimeNanos"]
                                    .as_str()
                                    .and_then(|s| s.parse::<i64>().ok())
                                    .unwrap_or(0);
                                let pt_start_ms = s_nano / 1_000_000;
                                let pt_end_ms = e_nano / 1_000_000;

                                let overlap_start = pt_start_ms.max(session_start_ms);
                                let overlap_end = pt_end_ms.min(session_end_ms);

                                if overlap_start < overlap_end {
                                    let dur_ms = overlap_end - overlap_start;
                                    if let Some(values) = point["value"].as_array() {
                                        if let Some(fase) =
                                            values.get(0).and_then(|v| v["intVal"].as_i64())
                                        {
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

                        if let Some(dt_end) = Utc.timestamp_millis_opt(session_end_ms).single() {
                            let fecha_sesion = (dt_end + offset_spain).naive_utc().date();
                            sleep_by_date.entry(fecha_sesion).or_default().push(session);
                        }
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
                siesta_start = Utc.timestamp_millis_opt(siesta_principal.start_ms).single();
                siesta_end = Utc.timestamp_millis_opt(siesta_principal.end_ms).single();

                for nap in &sessions[1..] {
                    siesta_total_ms += nap.light_ms + nap.deep_ms + nap.rem_ms;
                }
            }

            let Some(main_start_dt) = Utc.timestamp_millis_opt(main_sleep.start_ms).single() else {
                continue;
            };
            let Some(main_end_dt) = Utc.timestamp_millis_opt(main_sleep.end_ms).single() else {
                continue;
            };

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
        eprintln!(
            "❌ ERROR API SUEÑO (Sesiones): {:?}",
            res_sueno.text().await
        );
    }

    Ok(())
}

pub async fn procesar_pasos(
    client: &reqwest::Client,
    access_token: &str,
    pool: &PgPool,
    start_time: i64,
    end_time: i64,
    offset_spain: Duration,
) -> Result<(), String> {
    println!("🚶 Solicitando datos de pasos a Google Fit...");
    let body_pasos = json!({
        "aggregateBy": [{"dataTypeName": "com.google.step_count.delta"}],
        "bucketByTime": {"durationMillis": 86400000},
        "startTimeMillis": start_time,
        "endTimeMillis": end_time
    });

    let res_pasos = client
        .post("https://www.googleapis.com/fitness/v1/users/me/dataset:aggregate")
        .bearer_auth(access_token)
        .json(&body_pasos)
        .send()
        .await
        .map_err(|e| e.to_string())?;

    if res_pasos.status().is_success() {
        let texto_crudo = res_pasos.text().await.unwrap_or_default();
        let json_data: serde_json::Value = serde_json::from_str(&texto_crudo).unwrap_or_default();

        if let Some(buckets) = json_data["bucket"].as_array() {
            println!(
                "🪣 Se encontraron {} buckets de pasos en el rango.",
                buckets.len()
            );
            for bucket in buckets {
                if let Some(start_ms) = bucket["startTimeMillis"]
                    .as_str()
                    .and_then(|s| s.parse::<i64>().ok())
                {
                    let Some(dt_utc) = Utc.timestamp_millis_opt(start_ms).single() else {
                        continue;
                    };
                    let fecha = (dt_utc + offset_spain).naive_utc().date();
                    let mut total_pasos = 0;

                    if let Some(datasets) = bucket["dataset"].as_array() {
                        for dataset in datasets {
                            if let Some(points) = dataset["point"].as_array() {
                                for point in points {
                                    if let Some(values) = point["value"].as_array() {
                                        if let Some(val) =
                                            values.get(0).and_then(|v| v["intVal"].as_i64())
                                        {
                                            total_pasos += val as i32;
                                        }
                                    }
                                }
                            }
                        }
                    }
                    if total_pasos > 0 {
                        match sqlx::query!(
                            "INSERT INTO pasos (fecha, cantidad) VALUES ($1, $2) ON CONFLICT (fecha) DO UPDATE SET cantidad = $2",
                            fecha,
                            total_pasos
                        )
                        .execute(pool)
                        .await
                        {
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

    Ok(())
}

#[derive(Debug, Clone)]
struct RegistroPeso {
    timestamp_ms: i64,
    peso: f64,
    en_ayunas: bool,
    hora: u32,
    minuto: u32,
}

#[derive(Debug, Clone)]
struct RegistroGrasa {
    timestamp_ms: i64,
    grasa: f64,
}

pub async fn procesar_medidas_corporales(
    client: &reqwest::Client,
    access_token: &str,
    pool: &PgPool,
    offset_spain: Duration,
) -> Result<(), String> {
    println!("⚖️ Solicitando datos de medidas corporales (peso y grasa corporal) a Google Fit...");

    let now_spain = Utc::now() + offset_spain;
    let medianoche_spain = now_spain
        .date_naive()
        .and_hms_opt(0, 0, 0)
        .ok_or_else(|| "Error al calcular medianoche para medidas corporales".to_string())?;

    let start_time_15d = (medianoche_spain - Duration::days(15))
        .and_utc()
        .timestamp_millis()
        - offset_spain.num_milliseconds();
    let end_time = Utc::now().timestamp_millis();

    let start_nano = start_time_15d * 1_000_000;
    let end_nano = end_time * 1_000_000;

    println!(
        "⏱️ Rango de medidas corporales (últimos 15 días): de {} a {}",
        start_time_15d, end_time
    );

    // ==========================================
    // 1. LLAMADA AGREGADA (Formato idéntico a body_pasos / body_sueno)
    // ==========================================
    let body_medidas = json!({
        "aggregateBy": [
            {"dataTypeName": "com.google.weight"},
            {"dataTypeName": "com.google.body.fat.percentage"}
        ],
        "bucketByTime": {"durationMillis": 86400000},
        "startTimeMillis": start_time_15d,
        "endTimeMillis": end_time
    });

    let res_medidas = client
        .post("https://www.googleapis.com/fitness/v1/users/me/dataset:aggregate")
        .bearer_auth(access_token)
        .json(&body_medidas)
        .send()
        .await
        .map_err(|e| e.to_string())?;

    println!("📡 Estado Petición Agregado Medidas: {}", res_medidas.status());

    if !res_medidas.status().is_success() {
        let error_body = res_medidas.text().await.unwrap_or_default();
        eprintln!("❌ Detalle error Google Fit (Aggregate): {}", error_body);
        return Err(format!("Google Fit 403: {}", error_body));
    }

    // ==========================================
    // 2. PETICIONES CRUDAS (Para obtener hora exacta, en_ayunas y resolver duplicados)
    // ==========================================
    let url_peso = format!(
        "https://www.googleapis.com/fitness/v1/users/me/dataSources/derived:com.google.weight:com.google.android.gms:merge_weight/datasets/{}-{}",
        start_nano, end_nano
    );
    let res_peso = client
        .get(&url_peso)
        .bearer_auth(access_token)
        .send()
        .await
        .map_err(|e| e.to_string())?;

    println!("📡 Estado Petición Peso Crudo: {}", res_peso.status());

    let url_grasa = format!(
        "https://www.googleapis.com/fitness/v1/users/me/dataSources/derived:com.google.body.fat.percentage:com.google.android.gms:merged/datasets/{}-{}",
        start_nano, end_nano
    );
    let res_grasa = client
        .get(&url_grasa)
        .bearer_auth(access_token)
        .send()
        .await
        .map_err(|e| e.to_string())?;

    println!("📡 Estado Petición Grasa Cruda: {}", res_grasa.status());

    let mut puntos_peso: Vec<serde_json::Value> = Vec::new();
    if res_peso.status().is_success() {
        let json_peso: serde_json::Value = res_peso.json().await.unwrap_or_default();
        if let Some(pts) = json_peso["point"].as_array() {
            puntos_peso = pts.clone();
            println!("📦 Extraídos {} micro-puntos de peso.", puntos_peso.len());
        } else {
            println!("⚠️ La petición de peso fue exitosa pero no trajo el array 'point'.");
        }
    } else {
        eprintln!(
            "⚠️ Fallo al obtener peso crudo: {:?}",
            res_peso.text().await
        );
    }

    let mut puntos_grasa: Vec<serde_json::Value> = Vec::new();
    if res_grasa.status().is_success() {
        let json_grasa: serde_json::Value = res_grasa.json().await.unwrap_or_default();
        if let Some(pts) = json_grasa["point"].as_array() {
            puntos_grasa = pts.clone();
            println!("📦 Extraídos {} micro-puntos de grasa corporal.", puntos_grasa.len());
        } else {
            println!("⚠️ La petición de grasa fue exitosa pero no trajo el array 'point'.");
        }
    } else {
        eprintln!(
            "⚠️ Fallo al obtener grasa cruda: {:?}",
            res_grasa.text().await
        );
    }

    // ==========================================
    // 3. PROCESAMIENTO Y RESOLUCIÓN DE ENTRADAS DEL MISMO DÍA
    // ==========================================
    let mut pesos_por_dia: HashMap<NaiveDate, RegistroPeso> = HashMap::new();
    for point in &puntos_peso {
        let Some(peso_raw) = point["value"]
            .as_array()
            .and_then(|v| v.first())
            .and_then(|v| v["fpVal"].as_f64().or_else(|| v["intVal"].as_i64().map(|i| i as f64)))
        else {
            continue;
        };
        let peso = (peso_raw * 100.0).round() / 100.0;

        let s_nano = point["startTimeNanos"]
            .as_str()
            .and_then(|s| s.parse::<i64>().ok())
            .unwrap_or(0);
        let e_nano = point["endTimeNanos"]
            .as_str()
            .and_then(|s| s.parse::<i64>().ok())
            .unwrap_or(0);
        let nano = if e_nano > 0 { e_nano } else { s_nano };
        if nano == 0 {
            continue;
        }
        let ts_ms = nano / 1_000_000;

        let Some(dt_utc) = Utc.timestamp_millis_opt(ts_ms).single() else {
            continue;
        };
        let dt_local = dt_utc + offset_spain;
        let fecha = dt_local.date_naive();
        let hora = dt_local.time().hour();
        let minuto = dt_local.time().minute();
        let en_ayunas = hora < 12;

        println!(
            "   ⚖️ [Google Fit Crudo] Fecha: {}, Hora: {:02}:{:02}, Peso: {:.2} kg, Ayunas: {}",
            fecha, hora, minuto, peso, en_ayunas
        );

        match pesos_por_dia.get_mut(&fecha) {
            Some(existente) => {
                if ts_ms > existente.timestamp_ms {
                    println!(
                        "   🔄 Entrada más tardía encontrada para {}: reemplazando {:02}:{:02} ({:.2} kg) por {:02}:{:02} ({:.2} kg)",
                        fecha, existente.hora, existente.minuto, existente.peso, hora, minuto, peso
                    );
                    *existente = RegistroPeso {
                        timestamp_ms: ts_ms,
                        peso,
                        en_ayunas,
                        hora,
                        minuto,
                    };
                }
            }
            None => {
                pesos_por_dia.insert(
                    fecha,
                    RegistroPeso {
                        timestamp_ms: ts_ms,
                        peso,
                        en_ayunas,
                        hora,
                        minuto,
                    },
                );
            }
        }
    }

    let mut grasas_por_dia: HashMap<NaiveDate, RegistroGrasa> = HashMap::new();
    for point in &puntos_grasa {
        let Some(grasa_raw) = point["value"]
            .as_array()
            .and_then(|v| v.first())
            .and_then(|v| v["fpVal"].as_f64().or_else(|| v["intVal"].as_i64().map(|i| i as f64)))
        else {
            continue;
        };
        let grasa = (grasa_raw * 100.0).round() / 100.0;

        let s_nano = point["startTimeNanos"]
            .as_str()
            .and_then(|s| s.parse::<i64>().ok())
            .unwrap_or(0);
        let e_nano = point["endTimeNanos"]
            .as_str()
            .and_then(|s| s.parse::<i64>().ok())
            .unwrap_or(0);
        let nano = if e_nano > 0 { e_nano } else { s_nano };
        if nano == 0 {
            continue;
        }
        let ts_ms = nano / 1_000_000;

        let Some(dt_utc) = Utc.timestamp_millis_opt(ts_ms).single() else {
            continue;
        };
        let dt_local = dt_utc + offset_spain;
        let fecha = dt_local.date_naive();
        let hora = dt_local.time().hour();
        let minuto = dt_local.time().minute();

        println!(
            "   💧 [Google Fit Crudo] Fecha: {}, Hora: {:02}:{:02}, Grasa: {:.2}%",
            fecha, hora, minuto, grasa
        );

        match grasas_por_dia.get_mut(&fecha) {
            Some(existente) => {
                if ts_ms > existente.timestamp_ms {
                    *existente = RegistroGrasa {
                        timestamp_ms: ts_ms,
                        grasa,
                    };
                }
            }
            None => {
                grasas_por_dia.insert(
                    fecha,
                    RegistroGrasa {
                        timestamp_ms: ts_ms,
                        grasa,
                    },
                );
            }
        }
    }

    // 5. Guardar o actualizar en la BD
    let mut fechas: Vec<NaiveDate> = pesos_por_dia.keys().cloned().collect();
    fechas.sort();

    for fecha in fechas {
        if let Some(medida) = pesos_por_dia.get(&fecha) {
            let grasa_opt = grasas_por_dia.get(&fecha).map(|g| g.grasa);

            println!(
                "   📊 Procesando para BD -> Fecha: {}, Peso: {:.2} kg, Grasa: {:?}%, Ayunas: {} (hora: {:02}:{:02})",
                fecha, medida.peso, grasa_opt, medida.en_ayunas, medida.hora, medida.minuto
            );

            match sqlx::query!(
                r#"
                INSERT INTO pesos (fecha, peso, grasa_corporal, en_ayunas, creado_en)
                VALUES ($1, $2::FLOAT8, $3::FLOAT8, $4, NOW())
                ON CONFLICT (fecha) DO UPDATE SET
                    peso = EXCLUDED.peso,
                    grasa_corporal = COALESCE(EXCLUDED.grasa_corporal, pesos.grasa_corporal),
                    en_ayunas = EXCLUDED.en_ayunas,
                    creado_en = NOW()
                "#,
                fecha,
                medida.peso,
                grasa_opt,
                medida.en_ayunas
            )
            .execute(pool)
            .await
            {
                Ok(_) => println!(
                    "   ✅ BD: Medidas corporales guardadas/actualizadas para el {}: {:.2} kg (Grasa: {:?}%)",
                    fecha, medida.peso, grasa_opt
                ),
                Err(e) => eprintln!(
                    "   ❌ BD ERROR: Error guardando medidas corporales del {}: {}",
                    fecha, e
                ),
            }
        }
    }

    // Si hubiera algún día con grasa registrada pero sin nuevo peso, actualizar la fila existente
    for (fecha, reg_grasa) in &grasas_por_dia {
        if !pesos_por_dia.contains_key(fecha) {
            println!(
                "   💧 Grasa encontrada sin peso nuevo para el {} (Grasa: {:.2}%). Intentando actualizar registro existente...",
                fecha, reg_grasa.grasa
            );
            let res = sqlx::query!(
                r#"
                UPDATE pesos 
                SET grasa_corporal = $1::FLOAT8, creado_en = NOW() 
                WHERE fecha = $2 AND grasa_corporal IS DISTINCT FROM $1::FLOAT8
                "#,
                reg_grasa.grasa,
                fecha
            )
            .execute(pool)
            .await;

            if let Ok(filas) = res {
                if filas.rows_affected() > 0 {
                    println!(
                        "   ✅ BD: Grasa corporal actualizada para el registro existente del {}",
                        fecha
                    );
                }
            }
        }
    }

    Ok(())
}

pub async fn sync_data(pool: &PgPool) -> Result<(), String> {
    println!("\n🚀 --- INICIANDO SINCRONIZACIÓN CON GOOGLE FIT ---");
    let access_token = obtener_o_refrescar_token(pool).await?;

    let offset_spain = Duration::hours(2);
    let now_spain = Utc::now() + offset_spain;
    let medianoche_spain = now_spain
        .date_naive()
        .and_hms_opt(0, 0, 0)
        .ok_or_else(|| "Error calculando medianoche".to_string())?;

    let start_time_31d = (medianoche_spain - Duration::days(31))
        .and_utc()
        .timestamp_millis()
        - offset_spain.num_milliseconds();
    let end_time = Utc::now().timestamp_millis();

    println!("⏱️ Ventana de tiempo general (31 días): de {} a {}", start_time_31d, end_time);
    let client = reqwest::Client::new();

    // 1. Sueño
    if let Err(e) = procesar_sueno(&client, &access_token, pool, start_time_31d, end_time, offset_spain).await {
        eprintln!("❌ Error procesando sueño: {}", e);
    }

    // 2. Pasos
    if let Err(e) = procesar_pasos(&client, &access_token, pool, start_time_31d, end_time, offset_spain).await {
        eprintln!("❌ Error procesando pasos: {}", e);
    }

    // 3. Medidas corporales (peso y grasa corporal, últimos 15 días)
    if let Err(e) = procesar_medidas_corporales(&client, &access_token, pool, offset_spain).await {
        eprintln!("❌ Error procesando medidas corporales: {}", e);
    }

    println!("🏁 --- SINCRONIZACIÓN FINALIZADA ---\n");
    Ok(())
}
