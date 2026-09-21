use chrono::NaiveDate;
use serde::{Deserialize, Serialize};

#[derive(Serialize, Deserialize)]
pub struct Recordatorio {
    pub clave: String,
    pub nombre: String,
    pub descripcion: Option<String>,
    pub dias: i32,
    pub entidad: String,
    pub proxima_fecha: Option<NaiveDate>,
    pub alerta: Option<bool>,
    pub dias_extra: Option<i32>,
}
