use serde::{Deserialize, Serialize};
use sqlx::types::chrono::NaiveDate;
use uuid::Uuid;

#[derive(Debug, Serialize, Deserialize, sqlx::FromRow)]
pub struct CicloMenstrual {
    pub id: Uuid,
    pub fecha_inicio: NaiveDate,
    pub fecha_fin: Option<NaiveDate>,
    pub estado_animo: Option<i16>,
    pub sensacion: Option<String>,
    pub creado_en: chrono::DateTime<chrono::Utc>,
}

#[derive(Debug, Deserialize)]
pub struct CreateCicloMenstrual {
    pub fecha_inicio: NaiveDate,
    pub fecha_fin: Option<NaiveDate>,
    pub estado_animo: Option<i16>,
    pub sensacion: Option<String>,
}

#[derive(Debug, Deserialize)]
pub struct UpdateCicloMenstrual {
    pub fecha_inicio: NaiveDate,
    pub fecha_fin: Option<NaiveDate>,
    pub estado_animo: Option<i16>,
    pub sensacion: Option<String>,
}