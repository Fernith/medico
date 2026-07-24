use serde::{Deserialize, Serialize};
use sqlx::FromRow;
use uuid::Uuid;
use chrono::{DateTime, Utc};

// ==========================================
// MUDANZA: PLANTILLAS DE RUTINA
// ==========================================
#[derive(Debug, Serialize, FromRow)]
pub struct Rutina {
    pub id: Uuid,
    pub nombre: String,
    pub descripcion: Option<String>,
    pub color: Option<String>,
}

#[derive(Debug, Deserialize)]
pub struct RutinaPayload {
    pub nombre: String,
    pub descripcion: Option<String>,
    pub color: Option<String>,
}

#[derive(Debug, Serialize, FromRow)]
pub struct RutinaRealizacionDetalle {
    pub id: Uuid,
    pub rutina_id: Uuid,
    pub realizacion_id: Uuid,
    pub ejercicio_id: Uuid,
    pub fase: String, 
    pub orden: i32,
    pub descanso_posterior: Option<i32>,
    pub ejercicio_nombre: String,
    pub ejercicio_imagen: String,
    pub equipamiento_nombre: Option<String>,
    pub series: Option<i32>,
    pub reps_min: Option<i32>,
    pub reps_max: Option<i32>,
    pub carga_actual: Option<f64>,
    pub unidad_carga: Option<String>,
    pub descanso: Option<i32>,
}

#[derive(Debug, Deserialize)]
pub struct RutinaRealizacionPayload {
    pub rutina_id: Uuid,
    pub realizacion_id: Uuid,
    pub fase: String,
    pub orden: i32,
    pub descanso_posterior: Option<i32>,
}

// ==========================================
// NUEVO: HISTORIAL DE ENTRENAMIENTO
// ==========================================
#[derive(Debug, Deserialize)]
pub struct HistorialSeriePayload {
    pub ejercicio_id: Uuid,
    pub ejercicio_nombre: String,
    pub equipamiento_nombre: Option<String>,
    pub fase: String,
    pub orden_ejercicio: i32,
    pub serie_numero: i32,
    pub reps_completadas: Option<i32>,
    pub carga_completada: Option<f64>,
    pub unidad_carga: Option<String>,
}

#[derive(Debug, Deserialize)]
pub struct HistorialRutinaPayload {
    pub rutina_id: Option<Uuid>,
    pub nombre: String,
    pub fecha_inicio: DateTime<Utc>,
    pub fecha_fin: DateTime<Utc>,
    pub duracion_segundos: i32,
    pub series: Vec<HistorialSeriePayload>,
}