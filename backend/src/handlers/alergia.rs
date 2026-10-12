use crate::error::AppError;
use crate::models::alergia::{Alergia, AlergiaPayload};
use axum::{
    extract::{Path, State},
    Json,
};
use sqlx::PgPool;
use uuid::Uuid;

pub async fn get_alergias(State(pool): State<PgPool>) -> Result<Json<Vec<Alergia>>, AppError> {
    let registros = sqlx::query_as::<_, Alergia>(
        r#"
        SELECT id, sustancia, tipo::text as tipo, categoria::text as categoria,
               reaccion::text as reaccion, gravedad::text as gravedad,
               fecha_diagnostico, notas
        FROM alergias
        ORDER BY sustancia ASC
        "#,
    )
    .fetch_all(&pool)
    .await?;

    Ok(Json(registros))
}

pub async fn create_alergia(
    State(pool): State<PgPool>,
    Json(payload): Json<AlergiaPayload>,
) -> Result<Json<Alergia>, AppError> {
    let registro = sqlx::query_as::<_, Alergia>(
        r#"
        INSERT INTO alergias (sustancia, tipo, categoria, reaccion, gravedad, fecha_diagnostico, notas)
        VALUES ($1, $2::tipo_condicion_alergia_enum, $3::categoria_alergeno_enum, $4::tipo_reaccion_alergia_enum, $5::gravedad_alergia_enum, $6, $7)
        RETURNING id, sustancia, tipo::text as tipo, categoria::text as categoria,
                  reaccion::text as reaccion, gravedad::text as gravedad,
                  fecha_diagnostico, notas
        "#,
    )
    .bind(payload.sustancia)
    .bind(payload.tipo)
    .bind(payload.categoria)
    .bind(payload.reaccion)
    .bind(payload.gravedad)
    .bind(payload.fecha_diagnostico)
    .bind(payload.notas)
    .fetch_one(&pool)
    .await?;

    Ok(Json(registro))
}

pub async fn update_alergia(
    Path(id): Path<Uuid>,
    State(pool): State<PgPool>,
    Json(payload): Json<AlergiaPayload>,
) -> Result<Json<Alergia>, AppError> {
    let registro = sqlx::query_as::<_, Alergia>(
        r#"
        UPDATE alergias
        SET sustancia = $1,
            tipo = $2::tipo_condicion_alergia_enum,
            categoria = $3::categoria_alergeno_enum,
            reaccion = $4::tipo_reaccion_alergia_enum,
            gravedad = $5::gravedad_alergia_enum,
            fecha_diagnostico = $6,
            notas = $7,
            updated_at = now()
        WHERE id = $8
        RETURNING id, sustancia, tipo::text as tipo, categoria::text as categoria,
                  reaccion::text as reaccion, gravedad::text as gravedad,
                  fecha_diagnostico, notas
        "#,
    )
    .bind(payload.sustancia)
    .bind(payload.tipo)
    .bind(payload.categoria)
    .bind(payload.reaccion)
    .bind(payload.gravedad)
    .bind(payload.fecha_diagnostico)
    .bind(payload.notas)
    .bind(id)
    .fetch_one(&pool)
    .await?;

    Ok(Json(registro))
}

pub async fn delete_alergia(
    Path(id): Path<Uuid>,
    State(pool): State<PgPool>,
) -> Result<Json<()>, AppError> {
    sqlx::query("DELETE FROM alergias WHERE id = $1")
        .bind(id)
        .execute(&pool)
        .await?;

    Ok(Json(()))
}

