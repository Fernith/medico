use axum::{extract::State, http::StatusCode, Json};
use sqlx::PgPool;
use crate::models::sueno::SuenoEntity;

pub async fn listar_sueno(
    State(pool): State<PgPool>,
) -> Result<Json<Vec<SuenoEntity>>, (StatusCode, String)> {
    let registros = sqlx::query_as!(
        SuenoEntity,
        r#"
        SELECT 
            id as "id!", 
            fecha as "fecha!", 
            minutos_sueno as "minutos_sueno!"
        FROM sueno 
        ORDER BY fecha DESC 
        LIMIT 7
        "#
    )
    .fetch_all(&pool)
    .await
    .map_err(|e| (StatusCode::INTERNAL_SERVER_ERROR, e.to_string()))?;

    Ok(Json(registros))
}