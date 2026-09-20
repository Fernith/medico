use axum::{
    extract::State,
    http::StatusCode,
    Json,
};
use sqlx::PgPool;
use crate::models::sintomas::{Sintoma};

// 2. Obtener el catálogo maestro de síntomas (para el combo final)
pub async fn get_sintomas(
    State(pool): State<PgPool>,
) -> Result<Json<Vec<Sintoma>>, (StatusCode, String)> {
    let result = sqlx::query_as::<_, Sintoma>(
        "SELECT id, nombre, categoria, regla_medicion FROM sintomas ORDER BY nombre ASC"
    )
    .fetch_all(&pool)
    .await;

    match result {
        Ok(sintomas) => Ok(Json(sintomas)),
        Err(e) => {
            eprintln!("Error fetching sintomas: {}", e);
            Err((StatusCode::INTERNAL_SERVER_ERROR, "Error interno del servidor".to_string()))
        }
    }
}