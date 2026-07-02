use axum::{
    extract::{Query, State},
    http::StatusCode,
    response::Redirect,
};
use sqlx::PgPool;
use std::env;

// Importamos el modelo y el servicio que hemos separado
use crate::models::google_fit::TokenCallbackQuery;
use crate::services;

pub async fn login_google() -> Redirect {
    let client_id = env::var("GOOGLE_CLIENT_ID").unwrap_or_default();
    let redirect_uri = env::var("GOOGLE_REDIRECT_URI").unwrap_or_default();
    
    // Aquí pedimos los 2 permisos clave: Sueño y Pasos (Activity)
    let url = format!(
        "https://accounts.google.com/o/oauth2/v2/auth?client_id={}&redirect_uri={}&response_type=code&scope=https://www.googleapis.com/auth/fitness.sleep.read%20https://www.googleapis.com/auth/fitness.activity.read&access_type=offline&prompt=consent",
        client_id, redirect_uri
    );
    
    Redirect::temporary(&url)
}

pub async fn oauth_callback(
    State(pool): State<PgPool>,
    Query(query): Query<TokenCallbackQuery>,
) -> Result<Redirect, (StatusCode, String)> {
    
    // 1. Delegamos al servicio el intercambio del código por el token
    services::google_fit::exchange_code_and_save(&pool, &query.code)
        .await
        .map_err(|e| (StatusCode::INTERNAL_SERVER_ERROR, e))?;

    // 2. Delegamos al servicio la descarga de los datos exactos
    services::google_fit::sync_data(&pool)
        .await
        .map_err(|e| (StatusCode::INTERNAL_SERVER_ERROR, e))?;

    // 3. Volvemos al frontend
    Ok(Redirect::temporary("http://localhost:5173/"))
}