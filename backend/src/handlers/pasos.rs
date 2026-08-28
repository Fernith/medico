use axum::{extract::{Path, State}, http::StatusCode, Json};
use sqlx::PgPool;
use uuid::Uuid;
use crate::models::pasos::{PasosDashboardResponse, PasoDB, PasoPayload};

// ... (Tu función listar_pasos se queda exactamente igual aquí arriba) ...

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

// ==========================================
// NUEVO: HISTORIAL COMPLETO (CRUD)
// ==========================================
pub async fn get_historial(State(pool): State<PgPool>) -> Result<Json<Vec<PasoDB>>, String> {
    let pasos = sqlx::query_as!(PasoDB, "SELECT id, fecha, cantidad, creado_en FROM pasos ORDER BY fecha DESC")
        .fetch_all(&pool).await.map_err(|e| e.to_string())?;
    Ok(Json(pasos))
}

pub async fn create_paso(State(pool): State<PgPool>, Json(payload): Json<PasoPayload>) -> Result<Json<()>, String> {
    sqlx::query!(
        "INSERT INTO pasos (fecha, cantidad) VALUES ($1, $2) ON CONFLICT (fecha) DO UPDATE SET cantidad = $2",
        payload.fecha, payload.cantidad
    ).execute(&pool).await.map_err(|e| e.to_string())?;
    Ok(Json(()))
}

pub async fn update_paso(Path(id): Path<Uuid>, State(pool): State<PgPool>, Json(payload): Json<PasoPayload>) -> Result<Json<()>, String> {
    sqlx::query!("UPDATE pasos SET fecha=$1, cantidad=$2 WHERE id=$3", payload.fecha, payload.cantidad, id)
        .execute(&pool).await.map_err(|e| e.to_string())?;
    Ok(Json(()))
}

pub async fn delete_paso(Path(id): Path<Uuid>, State(pool): State<PgPool>) -> Result<Json<()>, String> {
    sqlx::query!("DELETE FROM pasos WHERE id=$1", id).execute(&pool).await.map_err(|e| e.to_string())?;
    Ok(Json(()))
}