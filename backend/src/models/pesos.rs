use serde::{Deserialize, Serialize};
use uuid::Uuid;
use sqlx::types::chrono::NaiveDate;

// Modifica solo el PesoEntity, quita la referencia a sqlx::types
#[derive(Debug, Serialize, Deserialize, sqlx::FromRow)]
pub struct PesoEntity {
    pub id: Uuid,
    pub fecha: NaiveDate,
    pub peso: f64,
    pub en_ayunas: bool,
}

#[derive(Debug, Deserialize)]
pub struct CreatePesoDto {
    pub fecha: NaiveDate,
    pub peso: f64,
    pub en_ayunas: bool
}