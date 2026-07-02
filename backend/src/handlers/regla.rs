use axum::{extract::{Path, State}, http::StatusCode, Json};
use sqlx::PgPool;
use uuid::Uuid;
use crate::models::regla::{CicloMenstrual, CreateCicloMenstrual, UpdateCicloMenstrual};

// Obtener todos los ciclos ordenados del más reciente al más antiguo
pub async fn get_ciclos(State(pool): State<PgPool>) -> Result<Json<Vec<CicloMenstrual>>, StatusCode> {
    let ciclos = sqlx::query_as::<_, CicloMenstrual>(
        "SELECT id, fecha_inicio, fecha_fin, creado_en FROM ciclos_menstruales ORDER BY fecha_inicio DESC"
    )
    .fetch_all(&pool)
    .await
    .map_err(|_| StatusCode::INTERNAL_SERVER_ERROR)?;

    Ok(Json(ciclos))
}

// Crear un nuevo registro
pub async fn create_ciclo(
    State(pool): State<PgPool>,
    Json(payload): Json<CreateCicloMenstrual>,
) -> Result<(StatusCode, Json<CicloMenstrual>), StatusCode> {
    let nuevo_ciclo = sqlx::query_as::<_, CicloMenstrual>(
        r#"
        INSERT INTO ciclos_menstruales (fecha_inicio, fecha_fin)
        VALUES ($1, $2)
        RETURNING id, fecha_inicio, fecha_fin, creado_en
        "#
    )
    .bind(payload.fecha_inicio)
    .bind(payload.fecha_fin)
    .fetch_one(&pool)
    .await
    .map_err(|_| StatusCode::INTERNAL_SERVER_ERROR)?;

    Ok((StatusCode::CREATED, Json(nuevo_ciclo)))
}

// Actualizar un registro existente
pub async fn update_ciclo(
    State(pool): State<PgPool>,
    Path(id): Path<Uuid>,
    Json(payload): Json<UpdateCicloMenstrual>,
) -> Result<Json<CicloMenstrual>, StatusCode> {
    let ciclo_actualizado = sqlx::query_as::<_, CicloMenstrual>(
        r#"
        UPDATE ciclos_menstruales
        SET fecha_inicio = $1, fecha_fin = $2
        WHERE id = $3
        RETURNING id, fecha_inicio, fecha_fin, creado_en
        "#
    )
    .bind(payload.fecha_inicio)
    .bind(payload.fecha_fin)
    .bind(id)
    .fetch_one(&pool)
    .await
    .map_err(|_| StatusCode::NOT_FOUND)?;

    Ok(Json(ciclo_actualizado))
}

// Borrado FÍSICO
pub async fn delete_ciclo(
    State(pool): State<PgPool>,
    Path(id): Path<Uuid>,
) -> Result<StatusCode, StatusCode> {
    let result = sqlx::query!("DELETE FROM ciclos_menstruales WHERE id = $1", id)
        .execute(&pool)
        .await
        .map_err(|_| StatusCode::INTERNAL_SERVER_ERROR)?;

    if result.rows_affected() == 0 {
        return Err(StatusCode::NOT_FOUND);
    }

    Ok(StatusCode::NO_CONTENT)
}