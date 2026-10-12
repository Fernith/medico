use chrono::NaiveDate;
use serde::{Deserialize, Serialize};
use sqlx::FromRow;
use uuid::Uuid;

#[derive(Debug, Serialize, Deserialize, FromRow)]
pub struct Patologia {
    pub id: Uuid,
    pub nombre: String,
    pub categoria: String,
    pub estado: String,
    pub fecha_diagnostico: Option<NaiveDate>,
    pub tratamiento_actual: Option<String>,
    pub notas: Option<String>,
}

#[derive(Debug, Deserialize)]
pub struct PatologiaPayload {
    pub nombre: String,
    pub categoria: String,
    pub estado: String,
    pub fecha_diagnostico: Option<NaiveDate>,
    pub tratamiento_actual: Option<String>,
    pub notas: Option<String>,
}

