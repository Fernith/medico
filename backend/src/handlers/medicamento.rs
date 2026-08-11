use axum::{
    extract::{Path, State},
    Json,
};
use sqlx::PgPool;
use uuid::Uuid;

use crate::models::medicamento::{
    CategoriaMedicamento, CategoriaMedicamentoPayload, 
    Medicamento, MedicamentoPayload, 
    MedicacionActiva, MedicacionActivaPayload,
    HistorialMedicacionPayload
};

// ==========================================
// CATEGORÍAS
// ==========================================
pub async fn get_categorias(State(pool): State<PgPool>) -> Result<Json<Vec<CategoriaMedicamento>>, String> {
    let categorias = sqlx::query_as!(CategoriaMedicamento, "SELECT id, nombre FROM categoria_medicamento ORDER BY nombre")
        .fetch_all(&pool).await.map_err(|e| e.to_string())?;
    Ok(Json(categorias))
}

pub async fn create_categoria(State(pool): State<PgPool>, Json(payload): Json<CategoriaMedicamentoPayload>) -> Result<Json<CategoriaMedicamento>, String> {
    let registro = sqlx::query_as!(
        CategoriaMedicamento,
        "INSERT INTO categoria_medicamento (nombre) VALUES ($1) RETURNING id, nombre",
        payload.nombre
    ).fetch_one(&pool).await.map_err(|e| e.to_string())?;
    Ok(Json(registro))
}

pub async fn delete_categoria(Path(id): Path<Uuid>, State(pool): State<PgPool>) -> Result<Json<()>, String> {
    sqlx::query!("DELETE FROM categoria_medicamento WHERE id=$1", id).execute(&pool).await.map_err(|e| e.to_string())?;
    Ok(Json(()))
}

// ==========================================
// MEDICAMENTOS
// ==========================================
pub async fn get_medicamentos(State(pool): State<PgPool>) -> Result<Json<Vec<Medicamento>>, String> {
    let medicamentos = sqlx::query_as!(
        Medicamento,
        r#"
        SELECT 
            m.id, m.nombre, m.categoria_id, c.nombre as "categoria_nombre?",
            m.formato::text as "formato!", m.dosis::float8 as "dosis!", 
            m.unidad_dosis, m.notas
        FROM medicamento m
        LEFT JOIN categoria_medicamento c ON m.categoria_id = c.id
        ORDER BY m.nombre
        "#
    ).fetch_all(&pool).await.map_err(|e| e.to_string())?;
    Ok(Json(medicamentos))
}

pub async fn create_medicamento(State(pool): State<PgPool>, Json(payload): Json<MedicamentoPayload>) -> Result<Json<()>, String> {
    sqlx::query!(
        "INSERT INTO medicamento (nombre, categoria_id, formato, dosis, unidad_dosis, notas) VALUES ($1, $2, $3::text::formato_medicamento, $4::float8, $5, $6)",
        payload.nombre, payload.categoria_id, payload.formato, payload.dosis, payload.unidad_dosis, payload.notas
    ).execute(&pool).await.map_err(|e| e.to_string())?;
    Ok(Json(()))
}

pub async fn update_medicamento(Path(id): Path<Uuid>, State(pool): State<PgPool>, Json(payload): Json<MedicamentoPayload>) -> Result<Json<()>, String> {
    sqlx::query!(
        "UPDATE medicamento SET nombre=$1, categoria_id=$2, formato=$3::text::formato_medicamento, dosis=$4::float8, unidad_dosis=$5, notas=$6 WHERE id=$7",
        payload.nombre, payload.categoria_id, payload.formato, payload.dosis, payload.unidad_dosis, payload.notas, id
    ).execute(&pool).await.map_err(|e| e.to_string())?;
    Ok(Json(()))
}

pub async fn delete_medicamento(Path(id): Path<Uuid>, State(pool): State<PgPool>) -> Result<Json<()>, String> {
    sqlx::query!("DELETE FROM medicamento WHERE id=$1", id).execute(&pool).await.map_err(|e| e.to_string())?;
    Ok(Json(()))
}

// ==========================================
// MEDICACIÓN ACTIVA
// ==========================================
pub async fn get_medicaciones_activas(State(pool): State<PgPool>) -> Result<Json<Vec<MedicacionActiva>>, String> {
    let activas = sqlx::query_as!(
        MedicacionActiva,
        r#"
        SELECT 
            ma.id, ma.medicamento_id, m.nombre as "medicamento_nombre!",
            m.formato::text as "formato!", m.unidad_dosis as "unidad_dosis!",
            ma.frecuencia::text as "frecuencia!", ma.cantidad::float8 as "cantidad!",
            ma.fecha_inicio, ma.fecha_fin, ma.anotaciones, ma.activo
        FROM medicacion_activa ma
        JOIN medicamento m ON ma.medicamento_id = m.id
        ORDER BY ma.activo DESC, ma.fecha_inicio DESC
        "#
    ).fetch_all(&pool).await.map_err(|e| e.to_string())?;
    Ok(Json(activas))
}

pub async fn create_medicacion_activa(State(pool): State<PgPool>, Json(payload): Json<MedicacionActivaPayload>) -> Result<Json<()>, String> {
    sqlx::query!(
        "INSERT INTO medicacion_activa (medicamento_id, frecuencia, cantidad, fecha_inicio, fecha_fin, anotaciones) VALUES ($1, $2::text::frecuencia_medicacion, $3::float8, $4, $5, $6)",
        payload.medicamento_id, payload.frecuencia, payload.cantidad, payload.fecha_inicio, payload.fecha_fin, payload.anotaciones
    ).execute(&pool).await.map_err(|e| e.to_string())?;
    Ok(Json(()))
}

pub async fn update_medicacion_activa(Path(id): Path<Uuid>, State(pool): State<PgPool>, Json(payload): Json<MedicacionActivaPayload>) -> Result<Json<()>, String> {
    sqlx::query!(
        "UPDATE medicacion_activa SET medicamento_id=$1, frecuencia=$2::text::frecuencia_medicacion, cantidad=$3::float8, fecha_inicio=$4, fecha_fin=$5, anotaciones=$6 WHERE id=$7",
        payload.medicamento_id, payload.frecuencia, payload.cantidad, payload.fecha_inicio, payload.fecha_fin, payload.anotaciones, id
    ).execute(&pool).await.map_err(|e| e.to_string())?;
    Ok(Json(()))
}

pub async fn toggle_medicacion_activa(Path(id): Path<Uuid>, State(pool): State<PgPool>) -> Result<Json<()>, String> {
    sqlx::query!("UPDATE medicacion_activa SET activo = NOT activo WHERE id=$1", id)
        .execute(&pool).await.map_err(|e| e.to_string())?;
    Ok(Json(()))
}

pub async fn delete_medicacion_activa(Path(id): Path<Uuid>, State(pool): State<PgPool>) -> Result<Json<()>, String> {
    sqlx::query!("DELETE FROM medicacion_activa WHERE id=$1", id).execute(&pool).await.map_err(|e| e.to_string())?;
    Ok(Json(()))
}

// ==========================================
// HISTORIAL DE TOMAS
// ==========================================
pub async fn add_historial_medicacion(State(pool): State<PgPool>, Json(payload): Json<HistorialMedicacionPayload>) -> Result<Json<()>, String> {
    sqlx::query!(
        "INSERT INTO historial_medicacion (medicamento_id, fecha_hora, cantidad_tomada) VALUES ($1, $2, $3::float8)",
        payload.medicamento_id, payload.fecha_hora, payload.cantidad_tomada
    ).execute(&pool).await.map_err(|e| e.to_string())?;
    Ok(Json(()))
}