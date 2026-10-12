use serde::{Deserialize, Serialize};
use sqlx::FromRow;
use uuid::Uuid;

#[derive(Debug, Serialize, Deserialize, FromRow)]
pub struct AntecedenteFamiliar {
    pub id: Uuid,
    pub enfermedad: String,
    pub parentesco: String,
    pub edad_diagnostico: Option<i32>,
    pub fallecido: bool,
    pub edad_fallecimiento: Option<i32>,
    pub detalles: Option<String>,
}

#[derive(Debug, Deserialize)]
pub struct AntecedenteFamiliarPayload {
    pub enfermedad: String,
    pub parentesco: String,
    pub edad_diagnostico: Option<i32>,
    pub fallecido: bool,
    pub edad_fallecimiento: Option<i32>,
    pub detalles: Option<String>,
}

