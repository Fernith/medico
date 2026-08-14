use serde::{Deserialize, Serialize};
use sqlx::FromRow;
use uuid::Uuid;
use chrono::{DateTime, Utc};

// ==========================================
// CATEGORÍA DE MEDICAMENTOS
// ==========================================
#[derive(Debug, Serialize, FromRow)]
pub struct CategoriaMedicamento {
    pub id: Uuid,
    pub nombre: String,
    pub color: String,
}

#[derive(Debug, Deserialize)]
pub struct CategoriaMedicamentoPayload {
    pub nombre: String,
    pub color: String,
}

// ==========================================
// MEDICAMENTOS (Catálogo)
// ==========================================
#[derive(Debug, Serialize, FromRow)]
pub struct Medicamento {
    pub id: Uuid,
    pub nombre: String,
    pub categoria_id: Option<Uuid>,
    pub categoria_nombre: Option<String>,
    pub formato: String,
    pub dosis: f64,
    pub unidad_dosis: String,
    pub notas: Option<String>,
}

#[derive(Debug, Deserialize)]
pub struct MedicamentoPayload {
    pub nombre: String,
    pub categoria_id: Option<Uuid>,
    pub formato: String,
    pub dosis: f64,
    pub unidad_dosis: String,
    pub notas: Option<String>,
}

// ==========================================
// MEDICACIÓN ACTIVA (Planificación)
// ==========================================
#[derive(Debug, Serialize, FromRow)]
pub struct MedicacionActiva {
    pub id: Uuid,
    pub medicamento_id: Uuid,
    pub medicamento_nombre: String,
    pub formato: String,
    pub unidad_dosis: String,
    pub frecuencia: String,
    pub cantidad: f64,
    pub fecha_inicio: DateTime<Utc>,
    pub fecha_fin: Option<DateTime<Utc>>,
    pub anotaciones: Option<String>,
    pub activo: bool,
}

#[derive(Debug, Deserialize)]
pub struct MedicacionActivaPayload {
    pub medicamento_id: Uuid,
    pub frecuencia: String,
    pub cantidad: f64,
    pub fecha_inicio: DateTime<Utc>,
    pub fecha_fin: Option<DateTime<Utc>>,
    pub anotaciones: Option<String>,
}

// ==========================================
// HISTORIAL DE TOMAS
// ==========================================
#[derive(Debug, Serialize, FromRow)]
pub struct HistorialMedicacion {
    pub id: Uuid,
    pub medicamento_id: Uuid,
    pub medicamento_nombre: String,
    pub formato: String,
    pub dosis_base: f64,
    pub unidad_dosis: String,
    pub fecha_hora: DateTime<Utc>,
    pub cantidad_tomada: f64,
    pub pendiente: bool,
}

#[derive(Debug, Deserialize)]
pub struct HistorialMedicacionPayload {
    pub medicamento_id: Uuid,
    pub fecha_hora: DateTime<Utc>,
    pub cantidad_tomada: f64,
    pub pendiente: bool,
}

// ==========================================
// UNIDADES DE DOSIS (Diccionario)
// ==========================================
#[derive(Debug, Serialize, FromRow)]
pub struct UnidadDosis {
    pub id: Uuid,
    pub nombre: String,
    pub abreviatura: String,
}

#[derive(Debug, Deserialize)]
pub struct UnidadDosisPayload {
    pub nombre: String,
    pub abreviatura: String,
}

// ==========================================
// CONSULTAS DINÁMICAS (Query Params)
// ==========================================
#[derive(Debug, Deserialize)]
pub struct RangoFechasQuery {
    pub start: DateTime<Utc>,
    pub end: DateTime<Utc>,
}