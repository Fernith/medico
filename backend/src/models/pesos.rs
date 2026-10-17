use chrono::NaiveDate;
use serde::{Deserialize, Serialize};
use uuid::Uuid; // Usando NaiveDate como cambiamos recientemente

#[derive(Debug, Serialize, Deserialize, sqlx::FromRow)]
#[serde(rename_all = "snake_case")]
pub struct PesoEntity {
    pub id: Uuid,
    pub fecha: NaiveDate,
    pub peso: f64,
    pub en_ayunas: bool,
    pub promedio: Option<f64>,
    pub grasa_corporal: Option<f64>,
}

#[derive(Debug, Deserialize)]
#[serde(rename_all = "snake_case")]
pub struct CreatePesoDto {
    pub fecha: NaiveDate,
    pub peso: f64,
    pub en_ayunas: bool,
    #[serde(default)]
    pub grasa_corporal: Option<f64>,
}
