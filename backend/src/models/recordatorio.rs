use serde::{Deserialize, Serialize};

#[derive(Serialize, Deserialize)]
pub struct Recordatorio {
    pub clave: String,
    pub nombre: String,
    pub descripcion: Option<String>,
    pub dias: i32,
    pub entidad: String,
    pub alerta: Option<bool>,
    pub dias_transcurridos: Option<i32>,
}