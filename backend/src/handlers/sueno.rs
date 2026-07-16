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
            minutos_sueno as "minutos_sueno!",
            creado_en as "creado_en!",
            hora_inicio,
            hora_fin,
            COALESCE(minutos_ligero, 0) as "minutos_ligero!",
            COALESCE(minutos_profundo, 0) as "minutos_profundo!",
            COALESCE(minutos_rem, 0) as "minutos_rem!",
            COALESCE(minutos_despierto, 0) as "minutos_despierto!",
            COALESCE(minutos_siesta, 0) as "minutos_siesta!",
            siesta_hora_inicio,
            siesta_hora_fin
        FROM sueno 
        ORDER BY fecha DESC 
        "#
    )
    .fetch_all(&pool)
    .await
    .map_err(|e| {
        eprintln!("Error en BD al listar sueño: {}", e);
        (StatusCode::INTERNAL_SERVER_ERROR, e.to_string())
    })?;

    Ok(Json(registros))
}