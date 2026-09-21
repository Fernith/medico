use crate::error::AppError;
use crate::models::ajustes::AjusteEntity;
use axum::{extract::State, http::StatusCode, Json};
use sqlx::PgPool;
use std::collections::HashMap;

pub async fn listar_ajustes(
    State(pool): State<PgPool>,
) -> Result<Json<HashMap<String, String>>, AppError> {
    let registros = sqlx::query!("SELECT clave, valor FROM ajustes_usuario")
        .fetch_all(&pool)
        .await?;

    let mut ajustes = HashMap::new();
    for row in registros {
        ajustes.insert(row.clave, row.valor);
    }
    Ok(Json(ajustes))
}

pub async fn guardar_ajuste(
    State(pool): State<PgPool>,
    Json(payload): Json<AjusteEntity>,
) -> Result<StatusCode, AppError> {
    sqlx::query!(
        "INSERT INTO ajustes_usuario (clave, valor) VALUES ($1, $2) ON CONFLICT (clave) DO UPDATE SET valor = $2",
        payload.clave, payload.valor
    )
    .execute(&pool).await
    ?;

    Ok(StatusCode::OK)
}
