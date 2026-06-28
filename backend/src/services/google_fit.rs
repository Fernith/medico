use sqlx::PgPool;
use chrono::{Utc, DateTime, Duration};
use serde::{Deserialize, Serialize};
use std::env;

#[derive(Serialize, Deserialize)]
struct GoogleTokenResponse {
    access_token: String,
    refresh_token: Option<String>,
    expires_in: i64,
}

#[derive(Deserialize, Debug)]
struct FitSessionResponse {
    // Si Google envía el JSON vacío sin la clave "session", Rust creará un array vacío en lugar de crashear
    #[serde(default)] 
    session: Vec<FitSession>,
}

#[derive(Deserialize, Debug)]
#[allow(non_snake_case)] // Evita que Rust se queje de las variables en camelCase
struct FitSession {
    #[serde(default)]
    id: String,
    #[serde(default)]
    startTimeMillis: String,
    #[serde(default)]
    endTimeMillis: String,
    #[serde(default)]
    activityType: i32, 
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
        .form(&params)
        .send()
        .await
        .map_err(|e| e.to_string())?;

    // Si Google devuelve un error de permisos, lo capturamos como texto puro
    if !response.status().is_success() {
        let error_text = response.text().await.unwrap_or_default();
        return Err(format!("Error de Google OAuth: {}", error_text));
    }

    let res = response.json::<GoogleTokenResponse>().await.map_err(|e| e.to_string())?;

    let expiry = Utc::now() + Duration::seconds(res.expires_in);
    let refresh = res.refresh_token.unwrap_or_default();

    sqlx::query!("DELETE FROM configuracion").execute(pool).await.ok();

    sqlx::query!(
        "INSERT INTO configuracion (access_token, refresh_token, token_expiry) VALUES ($1, $2, $3)",
        res.access_token, refresh, expiry
    ).execute(pool).await.map_err(|e| e.to_string())?;

    Ok(())
}

pub async fn sync_sleep_data(pool: &PgPool) -> Result<(), String> {
    let config_record = sqlx::query!("SELECT access_token, refresh_token, token_expiry FROM configuracion LIMIT 1")
        .fetch_optional(pool)
        .await
        .map_err(|e| e.to_string())?;

    let config = match config_record {
        Some(c) => c,
        None => return Err("No hay configuraciones u autorizaciones OAuth2 guardadas".to_string()),
    };

    let mut access_token = config.access_token;

    if Utc::now() >= config.token_expiry {
        let client_id = env::var("GOOGLE_CLIENT_ID").unwrap_or_default();
        let client_secret = env::var("GOOGLE_CLIENT_SECRET").unwrap_or_default();

        let client = reqwest::Client::new();
        let params = [
            ("client_id", client_id.as_str()),
            ("client_secret", client_secret.as_str()),
            ("refresh_token", config.refresh_token.as_str()),
            ("grant_type", "refresh_token"),
        ];

        let response = client.post("https://oauth2.googleapis.com/token")
            .form(&params)
            .send()
            .await
            .map_err(|e| e.to_string())?;

        if response.status().is_success() {
            let res = response.json::<GoogleTokenResponse>().await.map_err(|e| e.to_string())?;
            access_token = res.access_token;
            let new_expiry = Utc::now() + Duration::seconds(res.expires_in);

            sqlx::query!(
                "UPDATE configuracion SET access_token = $1, token_expiry = $2, updated_at = NOW()",
                access_token, new_expiry
            ).execute(pool).await.map_err(|e| e.to_string())?;
        }
    }

    let end_time = Utc::now();
    let start_time = end_time - Duration::days(7);
    
    // Formateamos con 'Z' al final para evitar que el símbolo '+' se convierta en espacio en la URL
    let url = format!(
        "https://www.googleapis.com/fitness/v1/users/me/sessions?startTime={}&endTime={}",
        start_time.format("%Y-%m-%dT%H:%M:%SZ"), 
        end_time.format("%Y-%m-%dT%H:%M:%SZ")
    );

    let client = reqwest::Client::new();
    let response = client.get(&url)
        .bearer_auth(access_token)
        .send()
        .await
        .map_err(|e| e.to_string())?;

    // Manejo robusto de errores de la API de Fit
    if !response.status().is_success() {
        let error_text = response.text().await.unwrap_or_default();
        return Err(format!("Google Fit API respondió con error: {}", error_text));
    }

    

    let fit_res = response.json::<FitSessionResponse>()
        .await
        .map_err(|e| format!("Error decodificando el JSON de Google Fit: {}", e))?;

    for session in fit_res.session {
        println!("Respuesta: {:?}", session);
        if session.activityType == 72 { 
            let start_ms = session.startTimeMillis.parse::<i64>().unwrap_or(0);
            let end_ms = session.endTimeMillis.parse::<i64>().unwrap_or(0);
            
            if start_ms > 0 && end_ms > 0 {
                //let duracion_horas = (end_ms - start_ms) as f64 / 3600000.0;
                let elapsed_ms = end_ms - start_ms;
                let total_minutes = (elapsed_ms / 1000) / 60;
    
                // Separamos horas y minutos
                let hours = total_minutes / 60;
                let minutes = total_minutes % 60;
                
                // Construimos el decimal literal (ej. 7.0 + 0.44 = 7.44)
                let valor_db = (hours as f64) + (minutes as f64 / 100.0);
                
                // Redondeamos a 2 decimales para evitar problemas de precisión del f64 
                // antes de enviarlo a PostgreSQL (ej. que envíe 7.4399999999)
                (valor_db * 100.0).round() / 100.0;

                
                let fecha_sesion = DateTime::from_timestamp(start_ms / 1000, 0)
                    .unwrap_or_default()
                    .naive_utc()
                    .date();

                sqlx::query!(
                    "INSERT INTO sueno (fecha, horas_sueno, google_fit_session_id)
                     VALUES ($1, $2::FLOAT8, $3)
                     ON CONFLICT (google_fit_session_id) DO NOTHING",
                    fecha_sesion, valor_db, session.id
                ).execute(pool).await.ok();
            }
        }
    }

    Ok(())
}