use axum::{extract::State, http::StatusCode, Json};
use sqlx::PgPool;
use std::collections::HashMap;
use crate::models::ajustes::AjusteEntity;

pub async fn listar_ajustes(
    State(pool): State<PgPool>,
) -> Result<Json<HashMap<String, String>>, (StatusCode, String)> {
    let registros = sqlx::query!("SELECT clave, valor FROM ajustes_usuario")
        .fetch_all(&pool).await
        .map_err(|e| (StatusCode::INTERNAL_SERVER_ERROR, e.to_string()))?;

    let mut ajustes = HashMap::new();
    for row in registros {
        ajustes.insert(row.clave, row.valor);
    }
    Ok(Json(ajustes))
}

pub async fn guardar_ajuste(
    State(pool): State<PgPool>,
    Json(payload): Json<AjusteEntity>,
) -> Result<StatusCode, (StatusCode, String)> {
    sqlx::query!(
        "INSERT INTO ajustes_usuario (clave, valor) VALUES ($1, $2) ON CONFLICT (clave) DO UPDATE SET valor = $2",
        payload.clave, payload.valor
    )
    .execute(&pool).await
    .map_err(|e| (StatusCode::INTERNAL_SERVER_ERROR, e.to_string()))?;

    Ok(StatusCode::OK)
}