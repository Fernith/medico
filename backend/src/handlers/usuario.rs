use crate::error::AppError;
use crate::models::usuario::UsuarioDatoEntity;
use axum::{extract::State, http::StatusCode, Json};
use sqlx::PgPool;
use std::collections::HashMap;

pub async fn listar_usuario(
    State(pool): State<PgPool>,
) -> Result<Json<HashMap<String, String>>, AppError> {
    let registros = sqlx::query_as::<_, crate::models::usuario::UsuarioDatoEntity>("SELECT clave, valor FROM usuario")
        .fetch_all(&pool)
        .await?;

    let mut datos = HashMap::new();
    for row in registros {
        datos.insert(row.clave, row.valor);
    }
    Ok(Json(datos))
}

pub async fn guardar_usuario(
    State(pool): State<PgPool>,
    Json(payload): Json<HashMap<String, String>>,
) -> Result<StatusCode, AppError> {
    let mut tx = pool.begin().await?;

    for (clave, valor) in payload {
        sqlx::query(
            "INSERT INTO usuario (clave, valor) VALUES ($1, $2) ON CONFLICT (clave) DO UPDATE SET valor = $2"
        )
        .bind(clave)
        .bind(valor)
        .execute(&mut *tx).await?;
    }

    tx.commit().await?;

    Ok(StatusCode::OK)
}
