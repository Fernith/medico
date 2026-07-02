use axum::{extract::State, http::StatusCode, Json};
use sqlx::PgPool;
use crate::models::pasos::PasosDashboardResponse;

pub async fn listar_pasos(
    State(pool): State<PgPool>,
) -> Result<Json<PasosDashboardResponse>, (StatusCode, String)> {
    
    // 1. Rescatamos el último día registrado (cantidad Y fecha)
    let ultimo_registro = sqlx::query!(
        r#"SELECT cantidad as "cantidad!", fecha as "fecha!" FROM pasos ORDER BY fecha DESC LIMIT 1"#
    )
    .fetch_optional(&pool)
    .await
    .map_err(|e| (StatusCode::INTERNAL_SERVER_ERROR, e.to_string()))?;

    let hoy = ultimo_registro.as_ref().map(|r| r.cantidad).unwrap_or(0);
    let ultima_fecha = ultimo_registro.map(|r| r.fecha);

    // 2. Sumamos todo el mes en curso
    let suma_mes = sqlx::query!(
        r#"
        SELECT COALESCE(SUM(cantidad), 0) as "total!" 
        FROM pasos 
        WHERE date_trunc('month', fecha) = date_trunc('month', CURRENT_DATE)
        "#
    )
    .fetch_one(&pool)
    .await
    .map_err(|e| (StatusCode::INTERNAL_SERVER_ERROR, e.to_string()))?;

    Ok(Json(PasosDashboardResponse {
        hoy,
        total_mes: suma_mes.total as i32,
        ultima_fecha,
    }))
}