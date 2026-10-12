use chrono::NaiveDate;
use serde::{Deserialize, Serialize};
use sqlx::FromRow;
use uuid::Uuid;

#[derive(Debug, Serialize, Deserialize, FromRow)]
pub struct Alergia {
    pub id: Uuid,
    pub sustancia: String,
    pub tipo: String,
    pub categoria: String,
    pub reaccion: String,
    pub gravedad: String,
    pub fecha_diagnostico: Option<NaiveDate>,
    pub notas: Option<String>,
}

#[derive(Debug, Deserialize)]
pub struct AlergiaPayload {
    pub sustancia: String,
    pub tipo: String,
    pub categoria: String,
    pub reaccion: String,
    pub gravedad: String,
    pub fecha_diagnostico: Option<NaiveDate>,
    pub notas: Option<String>,
}

