use chrono::{DateTime, NaiveDate, Utc};
use serde::{Deserialize, Serialize};
use uuid::Uuid;

#[derive(Debug, Serialize, Deserialize)]
pub struct PasosDashboardResponse {
    pub hoy: i32,
    pub total_mes: i32,
    pub ultima_fecha: Option<NaiveDate>,
}

// NUEVOS STRUCTS PARA EL HISTORIAL
#[derive(Debug, Serialize, Deserialize)]
pub struct PasoDB {
    pub id: Uuid,
    pub fecha: NaiveDate,
    pub cantidad: i32,
    pub creado_en: Option<DateTime<Utc>>,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct PasoPayload {
    pub fecha: NaiveDate,
    pub cantidad: i32,
}