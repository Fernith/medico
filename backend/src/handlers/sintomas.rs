use crate::error::AppError;
use crate::models::sintomas::Sintoma;
use axum::{extract::State, Json};
use sqlx::PgPool;

// 2. Obtener el catÃ¡logo maestro de sÃ­ntomas (para el combo final)
pub async fn get_sintomas(State(pool): State<PgPool>) -> Result<Json<Vec<Sintoma>>, AppError> {
    let result = sqlx::query_as::<_, Sintoma>(
        "SELECT id, nombre, categoria, regla_medicion FROM sintomas ORDER BY nombre ASC",
    )
    .fetch_all(&pool)
    .await;

    Ok(Json(result?))
}
