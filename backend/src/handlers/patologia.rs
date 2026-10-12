use crate::error::AppError;
use crate::models::patologia::{Patologia, PatologiaPayload};
use axum::{
    extract::{Path, State},
    Json,
};
use sqlx::PgPool;
use uuid::Uuid;

pub async fn get_patologias(State(pool): State<PgPool>) -> Result<Json<Vec<Patologia>>, AppError> {
    let registros = sqlx::query_as::<_, Patologia>(
        r#"
        SELECT id, nombre, categoria::text as categoria, estado::text as estado,
               fecha_diagnostico, tratamiento_actual, notas
        FROM patologias
        ORDER BY nombre ASC
        "#,
    )
    .fetch_all(&pool)
    .await?;

    Ok(Json(registros))
}

pub async fn create_patologia(
    State(pool): State<PgPool>,
    Json(payload): Json<PatologiaPayload>,
) -> Result<Json<Patologia>, AppError> {
    let registro = sqlx::query_as::<_, Patologia>(
        r#"
        INSERT INTO patologias (nombre, categoria, estado, fecha_diagnostico, tratamiento_actual, notas)
        VALUES ($1, $2::categoria_patologia_enum, $3::estado_patologia_enum, $4, $5, $6)
        RETURNING id, nombre, categoria::text as categoria, estado::text as estado,
                  fecha_diagnostico, tratamiento_actual, notas
        "#,
    )
    .bind(payload.nombre)
    .bind(payload.categoria)
    .bind(payload.estado)
    .bind(payload.fecha_diagnostico)
    .bind(payload.tratamiento_actual)
    .bind(payload.notas)
    .fetch_one(&pool)
    .await?;

    Ok(Json(registro))
}

pub async fn update_patologia(
    Path(id): Path<Uuid>,
    State(pool): State<PgPool>,
    Json(payload): Json<PatologiaPayload>,
) -> Result<Json<Patologia>, AppError> {
    let registro = sqlx::query_as::<_, Patologia>(
        r#"
        UPDATE patologias
        SET nombre = $1,
            categoria = $2::categoria_patologia_enum,
            estado = $3::estado_patologia_enum,
            fecha_diagnostico = $4,
            tratamiento_actual = $5,
            notas = $6,
            updated_at = now()
        WHERE id = $7
        RETURNING id, nombre, categoria::text as categoria, estado::text as estado,
                  fecha_diagnostico, tratamiento_actual, notas
        "#,
    )
    .bind(payload.nombre)
    .bind(payload.categoria)
    .bind(payload.estado)
    .bind(payload.fecha_diagnostico)
    .bind(payload.tratamiento_actual)
    .bind(payload.notas)
    .bind(id)
    .fetch_one(&pool)
    .await?;

    Ok(Json(registro))
}

pub async fn delete_patologia(
    Path(id): Path<Uuid>,
    State(pool): State<PgPool>,
) -> Result<Json<()>, AppError> {
    sqlx::query("DELETE FROM patologias WHERE id = $1")
        .bind(id)
        .execute(&pool)
        .await?;

    Ok(Json(()))
}

