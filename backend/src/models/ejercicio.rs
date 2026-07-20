use serde::{Deserialize, Serialize};
use sqlx::FromRow;
use uuid::Uuid;

// ==========================================
// DATOS MAESTROS
// ==========================================
#[derive(Debug, Serialize, Deserialize, FromRow)]
pub struct GrupoMuscular {
    pub id: Uuid,
    pub nombre: String,
    pub categoria: Option<String>, 
}

#[derive(Debug, Serialize, Deserialize, FromRow)]
pub struct Equipamiento {
    pub id: Uuid,
    pub nombre: String,
}

#[derive(Debug, Deserialize)]
pub struct GrupoMuscularPayload {
    pub nombre: String,
    pub categoria: String,
}

#[derive(Debug, Deserialize)]
pub struct EquipamientoPayload {
    pub nombre: String,
}

// ==========================================
// CATÁLOGO DE EJERCICIOS
// ==========================================
#[derive(Debug, Serialize, FromRow)]
pub struct Ejercicio {
    pub id: Uuid,
    pub nombre: String,
    pub descripcion: Option<String>,
    pub imagen: String,
    pub grupos_ids: Option<Vec<Uuid>>, 
    pub grupos_nombres: Option<Vec<String>>,
}

#[derive(Debug, Deserialize)]
pub struct EjercicioPayload {
    pub nombre: String,
    pub descripcion: Option<String>,
    pub imagen: String,
    pub grupos_ids: Vec<Uuid>,
}

// ==========================================
// RUTINAS
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

// ==========================================
// REALIZACIÓN DE EJERCICIOS
// ==========================================
#[derive(Debug, Serialize, FromRow)]
pub struct RealizacionEjercicio {
    pub id: Uuid,
    pub ejercicio_id: Uuid,
    pub ejercicio_nombre: String,
    pub ejercicio_imagen: String,
    pub equipamiento_id: Option<Uuid>,
    pub equipamiento_nombre: Option<String>,
    pub carga_actual: Option<f64>,
    pub unidad_carga: Option<String>,
    pub series: Option<i32>,
    pub reps_min: Option<i32>,
    pub reps_max: Option<i32>,
    pub descanso: Option<i32>, // En segundos
}

#[derive(Debug, Deserialize)]
pub struct RealizacionPayload {
    pub ejercicio_id: Uuid,
    pub equipamiento_id: Option<Uuid>,
    pub carga_actual: Option<f64>,
    pub unidad_carga: Option<String>,
    pub series: Option<i32>,
    pub reps_min: Option<i32>,
    pub reps_max: Option<i32>,
    pub descanso: Option<i32>,
}

// ==========================================
// RUTINAS - REALIZACIÓN (El detalle interno)
// ==========================================
#[derive(Debug, Serialize, FromRow)]
pub struct RutinaRealizacionDetalle {
    pub id: Uuid,
    pub rutina_id: Uuid,
    pub realizacion_id: Uuid,
    pub fase: String,
    pub orden: i32,
    pub descanso_posterior: Option<i32>,
    // Información extraída con un JOIN para que el frontend la pinte fácil
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