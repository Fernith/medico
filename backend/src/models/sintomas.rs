use serde::{Deserialize, Serialize};
use sqlx::FromRow;
use uuid::Uuid;
use chrono::{DateTime, Utc};

#[derive(Debug, Serialize, Deserialize, FromRow)]
pub struct Sintoma {
    pub id: Uuid,
    pub nombre: String,
    pub categoria: Option<String>,
    pub regla_medicion: String,
}

#[derive(Debug, Serialize, Deserialize, FromRow)]
pub struct OcurrenciaSintoma {
    pub id: Uuid,
    pub sintoma_id: Uuid,
    pub fecha_inicio: DateTime<Utc>,
    pub fecha_fin: Option<DateTime<Utc>>,
    pub valor_registro: Option<String>,
    pub notas: Option<String>,
    pub created_at: DateTime<Utc>,
}

#[derive(Debug, Serialize, Deserialize, FromRow)]
pub struct OcurrenciaLocalizacion {
    pub ocurrencia_id: Uuid,
    pub localizacion_id: Uuid,
    pub es_irradiado: bool,
    pub lado: Option<String>,
}