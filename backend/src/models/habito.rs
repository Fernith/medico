use serde::{Deserialize, Serialize};
use sqlx::FromRow;
use uuid::Uuid;

#[derive(Debug, Serialize, Deserialize, FromRow, Clone)]
pub struct HabitoToxico {
    pub id: Uuid,
    pub clave: String,
    pub nombre: String,
    pub categoria: String,
    pub estado: String,
    pub frecuencia: Option<String>,
    pub cantidad: Option<String>,
    pub notas: Option<String>,
}

#[derive(Debug, Deserialize)]
pub struct ItemHabitoPayload {
    pub clave: String,
    pub nombre: String,
    pub categoria: String,
    pub estado: String,
    pub frecuencia: Option<String>,
    pub cantidad: Option<String>,
    pub notas: Option<String>,
}

