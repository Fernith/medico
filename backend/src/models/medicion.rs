use serde::{Deserialize, Serialize};
use uuid::Uuid;
use chrono::NaiveDate;

#[derive(Debug, Serialize, Deserialize, sqlx::FromRow)]
pub struct MedicionEntity {
    pub id: Uuid,
    pub fecha: NaiveDate,
    pub cm_cintura: Option<f64>,
    pub cm_cadera: Option<f64>,
}

#[derive(Debug, Deserialize)]
pub struct CreateMedicionDto {
    pub fecha: NaiveDate,
    pub cm_cintura: Option<f64>,
    pub cm_cadera: Option<f64>,
}