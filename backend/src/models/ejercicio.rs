use serde::{Deserialize, Serialize};
use sqlx::FromRow;
use uuid::Uuid;

// ==========================================
// DATOS MAESTROS
// ==========================================
#[derive(Debug, Serialize, Deserialize, FromRow)]
pub struct TipoEntrenamiento {
    pub id: Uuid,
    pub nombre: String,
}

#[derive(Debug, Deserialize)]
pub struct TipoEntrenamientoPayload {
    pub nombre: String,
}

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
    pub imagen: Option<String>,
    pub tipo_entrenamiento_id: Option<Uuid>,
    pub tipo_entrenamiento_nombre: Option<String>,
    pub grupos_ids: Option<Vec<Uuid>>, 
    pub grupos_nombres: Option<Vec<String>>,
}

#[derive(Debug, Deserialize)]
pub struct EjercicioPayload {
    pub nombre: String,
    pub descripcion: Option<String>,
    pub imagen: Option<String>,
    pub tipo_entrenamiento_id: Option<Uuid>,
    pub grupos_ids: Vec<Uuid>,
}

// ==========================================
// REALIZACIÓN DE EJERCICIOS
// (Mantén el resto exactamente igual...)
// ==========================================
#[derive(Debug, Serialize, FromRow)]
pub struct RealizacionEjercicio {
    pub id: Uuid,
    pub ejercicio_id: Uuid,
    pub ejercicio_nombre: String,
    pub ejercicio_imagen: Option<String>,
    pub equipamiento_id: Option<Uuid>,
    pub equipamiento_nombre: Option<String>,
    pub carga_actual: Option<f64>,
    pub unidad_carga: Option<String>,
    pub series: Option<i32>,
    pub reps_min: Option<i32>,
    pub reps_max: Option<i32>,
    pub descanso: Option<i32>, 
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