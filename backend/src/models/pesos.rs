use serde::{Deserialize, Serialize};
use uuid::Uuid;
use chrono::NaiveDate; // Usando NaiveDate como cambiamos recientemente

#[derive(Debug, Serialize, Deserialize, sqlx::FromRow)]
pub struct PesoEntity {
    pub id: Uuid,
    pub fecha: NaiveDate,
    pub peso: f64,
    pub en_ayunas: bool,
    pub promedio: Option<f64>,
}

#[derive(Debug, Deserialize)]
pub struct CreatePesoDto {
    pub fecha: NaiveDate,
    pub peso: f64,
    pub en_ayunas: bool
}