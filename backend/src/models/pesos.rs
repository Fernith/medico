use serde::{Deserialize, Serialize};
use uuid::Uuid;
use chrono::{DateTime, Utc};
use sqlx::Type;

#[derive(Debug, Serialize, Deserialize, Type)]
#[sqlx(type_name = "momento_dia", rename_all = "lowercase")]
pub enum MomentoDia {
    Día,
    Noche,
}

// Modifica solo el PesoEntity, quita la referencia a sqlx::types
#[derive(Debug, Serialize, Deserialize, sqlx::FromRow)]
pub struct PesoEntity {
    pub id: Uuid,
    pub fecha: DateTime<Utc>,
    pub peso_kg: f64, // ¡Cambiado a f64!
    pub comido_recientemente: bool,
    pub momento_dia: MomentoDia,
}

#[derive(Debug, Deserialize)]
pub struct CreatePesoDto {
    pub fecha: DateTime<Utc>,
    pub peso_kg: f64,
    pub comido_recientemente: bool,
    pub momento_dia: MomentoDia,
}