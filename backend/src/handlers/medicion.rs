use axum::{
    extract::{Path, State},
    http::StatusCode,
    Json,
};
use sqlx::PgPool;
use uuid::Uuid;
use crate::models::medicion::{CreateMedicionDto, MedicionEntity};

pub async fn listar_mediciones(
    State(pool): State<PgPool>,
) -> Result<Json<Vec<MedicionEntity>>, (StatusCode, String)> {
    let mediciones = sqlx::query_as!(
        MedicionEntity,
        r#"
        SELECT 
            id, 
            fecha,
            cm_cintura::FLOAT8, 
            cm_cadera::FLOAT8 
        FROM medicion 
        ORDER BY fecha DESC
        "#
    )
    .fetch_all(&pool)
    .await
    .map_err(|e| (StatusCode::INTERNAL_SERVER_ERROR, e.to_string()))?;

    Ok(Json(mediciones))
}

pub async fn crear_medicion(
    State(pool): State<PgPool>,
    Json(payload): Json<CreateMedicionDto>,
) -> Result<StatusCode, (StatusCode, String)> {
    sqlx::query!(
        "INSERT INTO medicion (fecha, cm_cintura, cm_cadera) VALUES ($1, $2::FLOAT8, $3::FLOAT8)",
        payload.fecha,
        payload.cm_cintura, 
        payload.cm_cadera
    )
    .execute(&pool)
    .await
    .map_err(|e| (StatusCode::INTERNAL_SERVER_ERROR, e.to_string()))?;

    Ok(StatusCode::CREATED)
}

pub async fn modificar_medicion(
    State(pool): State<PgPool>,
    Path(id): Path<Uuid>,
    Json(payload): Json<CreateMedicionDto>,
) -> Result<Json<MedicionEntity>, (StatusCode, String)> {
    let medicion_actualizada = sqlx::query_as!(
        MedicionEntity,
        r#"
        UPDATE medicion 
        SET fecha = $1, cm_cintura = $2::FLOAT8, cm_cadera = $3::FLOAT8 
        WHERE id = $4 
        RETURNING id, fecha, cm_cintura::FLOAT8, cm_cadera::FLOAT8
        "#,
        payload.fecha,
        payload.cm_cintura, 
        payload.cm_cadera, 
        id
    )
    .fetch_one(&pool)
    .await
    .map_err(|e| (StatusCode::INTERNAL_SERVER_ERROR, e.to_string()))?;

    Ok(Json(medicion_actualizada))
}

pub async fn borrar_medicion(
    State(pool): State<PgPool>,
    Path(id): Path<Uuid>,
) -> Result<StatusCode, (StatusCode, String)> {
    sqlx::query!("DELETE FROM medicion WHERE id = $1", id)
        .execute(&pool)
        .await
        .map_err(|e| (StatusCode::INTERNAL_SERVER_ERROR, e.to_string()))?;

    Ok(StatusCode::NO_CONTENT)
}