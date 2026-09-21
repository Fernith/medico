use crate::error::AppError;
use crate::models::pesos::{CreatePesoDto, PesoEntity};
use axum::{
    extract::{Path, State},
    http::StatusCode,
    Json,
};
use sqlx::PgPool;
use uuid::Uuid;

pub async fn listar_pesos(State(pool): State<PgPool>) -> Result<Json<Vec<PesoEntity>>, AppError> {
    let pesos = sqlx::query_as!(
        PesoEntity,
        r#"
        SELECT 
            id, 
            fecha, 
            peso::FLOAT8 as "peso!", 
            en_ayunas,
            AVG(peso) OVER (
                ORDER BY fecha ASC 
                ROWS BETWEEN 3 PRECEDING AND CURRENT ROW
            )::FLOAT8 as promedio
        FROM pesos 
        ORDER BY fecha DESC
        "#
    )
    .fetch_all(&pool)
    .await?;

    Ok(Json(pesos))
}

pub async fn crear_peso(
    State(pool): State<PgPool>,
    Json(payload): Json<CreatePesoDto>,
) -> Result<StatusCode, AppError> {
    sqlx::query!(
        "INSERT INTO pesos (fecha, peso, en_ayunas) VALUES ($1, $2::FLOAT8, $3)",
        payload.fecha,
        payload.peso,
        payload.en_ayunas
    )
    .execute(&pool)
    .await?;

    Ok(StatusCode::CREATED)
}

pub async fn modificar_peso(
    State(pool): State<PgPool>,
    Path(id): Path<Uuid>,
    Json(payload): Json<CreatePesoDto>,
) -> Result<Json<PesoEntity>, AppError> {
    let peso_actualizado = sqlx::query_as!(
        PesoEntity,
        r#"
        UPDATE pesos 
        SET fecha = $1, peso = $2::FLOAT8, en_ayunas = $3 
        WHERE id = $4 
        RETURNING 
            id, 
            fecha, 
            peso::FLOAT8 as "peso!", 
            en_ayunas,
            NULL::FLOAT8 as promedio -- Le pasamos NULL para satisfacer al struct de Rust
        "#,
        payload.fecha,
        payload.peso,
        payload.en_ayunas,
        id
    )
    .fetch_one(&pool)
    .await?;

    Ok(Json(peso_actualizado))
}

pub async fn borrar_peso(
    State(pool): State<PgPool>,
    Path(id): Path<Uuid>,
) -> Result<StatusCode, AppError> {
    sqlx::query!("DELETE FROM pesos WHERE id = $1", id)
        .execute(&pool)
        .await?;

    Ok(StatusCode::NO_CONTENT)
}
