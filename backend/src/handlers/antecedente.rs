use crate::error::AppError;
use crate::models::antecedente::{AntecedenteFamiliar, AntecedenteFamiliarPayload};
use axum::{
    extract::{Path, State},
    Json,
};
use sqlx::PgPool;
use uuid::Uuid;

pub async fn get_antecedentes(
    State(pool): State<PgPool>,
) -> Result<Json<Vec<AntecedenteFamiliar>>, AppError> {
    let registros = sqlx::query_as::<_, AntecedenteFamiliar>(
        r#"
        SELECT id, enfermedad, parentesco::text as parentesco, edad_diagnostico,
               fallecido, edad_fallecimiento, detalles
        FROM antecedentes_familiares
        ORDER BY enfermedad ASC
        "#,
    )
    .fetch_all(&pool)
    .await?;

    Ok(Json(registros))
}

pub async fn create_antecedente(
    State(pool): State<PgPool>,
    Json(payload): Json<AntecedenteFamiliarPayload>,
) -> Result<Json<AntecedenteFamiliar>, AppError> {
    let registro = sqlx::query_as::<_, AntecedenteFamiliar>(
        r#"
        INSERT INTO antecedentes_familiares (enfermedad, parentesco, edad_diagnostico, fallecido, edad_fallecimiento, detalles)
        VALUES ($1, $2::parentesco_enum, $3, $4, $5, $6)
        RETURNING id, enfermedad, parentesco::text as parentesco, edad_diagnostico,
                  fallecido, edad_fallecimiento, detalles
        "#,
    )
    .bind(payload.enfermedad)
    .bind(payload.parentesco)
    .bind(payload.edad_diagnostico)
    .bind(payload.fallecido)
    .bind(payload.edad_fallecimiento)
    .bind(payload.detalles)
    .fetch_one(&pool)
    .await?;

    Ok(Json(registro))
}

pub async fn update_antecedente(
    Path(id): Path<Uuid>,
    State(pool): State<PgPool>,
    Json(payload): Json<AntecedenteFamiliarPayload>,
) -> Result<Json<AntecedenteFamiliar>, AppError> {
    let registro = sqlx::query_as::<_, AntecedenteFamiliar>(
        r#"
        UPDATE antecedentes_familiares
        SET enfermedad = $1,
            parentesco = $2::parentesco_enum,
            edad_diagnostico = $3,
            fallecido = $4,
            edad_fallecimiento = $5,
            detalles = $6,
            updated_at = now()
        WHERE id = $7
        RETURNING id, enfermedad, parentesco::text as parentesco, edad_diagnostico,
                  fallecido, edad_fallecimiento, detalles
        "#,
    )
    .bind(payload.enfermedad)
    .bind(payload.parentesco)
    .bind(payload.edad_diagnostico)
    .bind(payload.fallecido)
    .bind(payload.edad_fallecimiento)
    .bind(payload.detalles)
    .bind(id)
    .fetch_one(&pool)
    .await?;

    Ok(Json(registro))
}

pub async fn delete_antecedente(
    Path(id): Path<Uuid>,
    State(pool): State<PgPool>,
) -> Result<Json<()>, AppError> {
    sqlx::query("DELETE FROM antecedentes_familiares WHERE id = $1")
        .bind(id)
        .execute(&pool)
        .await?;

    Ok(Json(()))
}

