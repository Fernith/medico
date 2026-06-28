use axum::{extract::{State, Query}, http::StatusCode, Json};
use sqlx::PgPool;
use crate::models::sueno::{SuenoEntity, TokenCallbackQuery};
use crate::services::google_fit;
use axum::response::Redirect;
use std::env;

pub async fn listar_sueno(
    State(pool): State<PgPool>,
) -> Result<Json<Vec<SuenoEntity>>, (StatusCode, String)> {
    let registros = sqlx::query_as!(
        SuenoEntity,
        r#"SELECT id, fecha, horas_sueno::FLOAT8 as "horas_sueno!", google_fit_session_id FROM sueno ORDER BY fecha DESC"#
    )
    .fetch_all(&pool)
    .await
    .map_err(|e| (StatusCode::INTERNAL_SERVER_ERROR, e.to_string()))?;

    Ok(Json(registros))
}

pub async fn google_callback(
    State(pool): State<PgPool>,
    params: Query<TokenCallbackQuery>,
) -> Result<StatusCode, (StatusCode, String)> {
    google_fit::exchange_code_and_save(&pool, &params.code)
        .await
        .map_err(|e| (StatusCode::BAD_REQUEST, e))?;

    let _ = google_fit::sync_sleep_data(&pool).await;

    Ok(StatusCode::OK)
}

pub async fn forzar_sincronizacion(
    State(pool): State<PgPool>,
) -> Result<StatusCode, (StatusCode, String)> {
    google_fit::sync_sleep_data(&pool)
        .await
        .map_err(|e| (StatusCode::INTERNAL_SERVER_ERROR, e))?;
    Ok(StatusCode::OK)
}

pub async fn login_google() -> Redirect {
    let client_id = env::var("GOOGLE_CLIENT_ID").expect("Falta GOOGLE_CLIENT_ID");
    let redirect_uri = env::var("GOOGLE_REDIRECT_URI").expect("Falta GOOGLE_REDIRECT_URI");
    
    // El scope exacto que permite leer el sueño en Google Fit
    let scope = "https://www.googleapis.com/auth/fitness.sleep.read";

    // access_type=offline y prompt=consent son OBLIGATORIOS para forzar 
    // a Google a que nos devuelva el refresh_token
    let auth_url = format!(
        "https://accounts.google.com/o/oauth2/v2/auth?client_id={}&redirect_uri={}&response_type=code&scope={}&access_type=offline&prompt=consent",
        client_id, redirect_uri, scope
    );

    Redirect::temporary(&auth_url)
}