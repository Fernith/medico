use axum::{extract::State, http::StatusCode, Json};
use sqlx::PgPool;
use crate::models::pesos::{CreatePesoDto, PesoEntity};

pub async fn listar_pesos(
    State(pool): State<PgPool>,
) -> Result<Json<Vec<PesoEntity>>, (StatusCode, String)> {
    let pesos = sqlx::query_as!(
        PesoEntity,
        // Usamos ::FLOAT8 para que SQLx lo mapee directamente a f64
        r#"SELECT id, fecha, peso_kg::FLOAT8 as "peso_kg!", comido_recientemente, momento_dia as "momento_dia: _" FROM pesos ORDER BY fecha DESC"#
    )
    .fetch_all(&pool)
    .await
    .map_err(|e| (StatusCode::INTERNAL_SERVER_ERROR, e.to_string()))?;

    Ok(Json(pesos))
}

pub async fn crear_peso(
    State(pool): State<PgPool>,
    Json(payload): Json<CreatePesoDto>,
) -> Result<StatusCode, (StatusCode, String)> {
    // Insertamos el f64 directamente, Postgres lo convierte a NUMERIC automáticamente
    sqlx::query!(
        // Fíjate en el $2::FLOAT8
        "INSERT INTO pesos (fecha, peso_kg, comido_recientemente, momento_dia) VALUES ($1, $2::FLOAT8, $3, $4)",
        payload.fecha, payload.peso_kg, payload.comido_recientemente, payload.momento_dia as _
    )
    .execute(&pool)
    .await
    .map_err(|e| (StatusCode::INTERNAL_SERVER_ERROR, e.to_string()))?;

    Ok(StatusCode::CREATED)
}