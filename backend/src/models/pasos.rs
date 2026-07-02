//use chrono::NaiveDate;
use serde::{Deserialize, Serialize};

/*#[derive(Debug, Serialize, Deserialize)]
pub struct PasosEntity {
    pub fecha: NaiveDate,
    pub cantidad: i32,
}*/

#[derive(Debug, Serialize, Deserialize)]
pub struct PasosDashboardResponse {
    pub hoy: i32,
    pub total_mes: i32,
}