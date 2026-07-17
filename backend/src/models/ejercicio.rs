use serde::{Deserialize, Serialize};
use sqlx::FromRow;
use uuid::Uuid;

#[derive(Debug, Serialize, Deserialize, FromRow)]
pub struct GrupoMuscular {
    pub id: Uuid,
    pub nombre: String,
    // Lo traemos como texto para evitar complicaciones con las macros de SQLx y el ENUM
    pub categoria: Option<String>, 
}

#[derive(Debug, Serialize, Deserialize, FromRow)]
pub struct Equipamiento {
    pub id: Uuid,
    pub nombre: String,
}

#[derive(Debug, Serialize, FromRow)]
pub struct Ejercicio {
    pub id: Uuid,
    pub nombre: String,
    pub descripcion: Option<String>,
    pub imagen: String,
    pub carga_actual: Option<f64>,
    pub unidad_carga: Option<String>,
    pub grupos_ids: Option<Vec<Uuid>>, 
    pub grupos_nombres: Option<Vec<String>>,
    pub equipamientos_ids: Option<Vec<Uuid>>, 
    pub equipamientos_nombres: Option<Vec<String>>,
}

#[derive(Debug, Deserialize)]
pub struct EjercicioPayload {
    pub nombre: String,
    pub descripcion: Option<String>,
    pub imagen: String,
    pub carga_actual: Option<f64>,
    pub unidad_carga: Option<String>,
    pub grupos_ids: Vec<Uuid>,
    pub equipamientos_ids: Vec<Uuid>,
}

// --- Payloads para la Administración (Nuevos) ---

#[derive(Debug, Deserialize)]
pub struct GrupoMuscularPayload {
    pub nombre: String,
    pub categoria: String,
}

#[derive(Debug, Deserialize)]
pub struct EquipamientoPayload {
    pub nombre: String,
}