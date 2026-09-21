use chrono::{DateTime, Utc};
use serde::{Deserialize, Serialize};
use sqlx::{FromRow, Type};
use uuid::Uuid;

#[derive(Debug, Serialize, Deserialize, Type, PartialEq, Clone)]
#[sqlx(type_name = "regla_medicion_enum", rename_all = "snake_case")]
#[serde(rename_all = "snake_case")]
pub enum ReglaMedicionEnum {
    #[sqlx(rename = "escala_1_10")]
    #[serde(rename = "escala_1_10")]
    Escala110,
    GradosCelsius,
    PresenciaBooleana,
    TextoLibre,
}

#[derive(Debug, Serialize, Deserialize, Type, PartialEq, Clone)]
#[sqlx(type_name = "caracteristica_enum", rename_all = "snake_case")]
#[serde(rename_all = "snake_case")]
pub enum CaracteristicaEnum {
    Punzante,
    Opresivo,
    UrenteArdor,
    Sordo,
    Colico,
    Electrico,
    Hormigueo,
    Pesadez,
    Otro,
}

#[derive(Debug, Serialize, Deserialize, Type, PartialEq, Clone)]
#[sqlx(type_name = "frecuencia_enum", rename_all = "snake_case")]
#[serde(rename_all = "snake_case")]
pub enum FrecuenciaEnum {
    UnicoEpisodio,
    Intermitente,
    Constante,
}

#[derive(Debug, Serialize, Deserialize, Type, PartialEq, Clone)]
#[sqlx(type_name = "lado_enum", rename_all = "snake_case")]
#[serde(rename_all = "snake_case")]
pub enum LadoEnum {
    Izquierdo,
    Derecho,
    Ambos,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
#[serde(rename_all = "snake_case")]
pub struct ModificadorDTO {
    pub factor: String,
    pub efecto: String,
}

#[derive(Debug, Serialize, Deserialize, FromRow)]
pub struct Sintoma {
    pub id: Uuid,
    pub nombre: String,
    pub categoria: Option<String>,
    pub regla_medicion: ReglaMedicionEnum,
}

#[derive(Debug, Serialize, Deserialize, FromRow)]
pub struct OcurrenciaSintoma {
    pub id: Uuid,
    pub sintoma_id: Uuid,
    pub fecha_inicio: DateTime<Utc>,
    pub fecha_fin: Option<DateTime<Utc>>,
    pub valor_registro: Option<String>,
    pub notas: Option<String>,
    pub caracteristica: Option<CaracteristicaEnum>,
    pub frecuencia: Option<FrecuenciaEnum>,
    pub modificadores: sqlx::types::Json<Vec<ModificadorDTO>>,
    pub created_at: DateTime<Utc>,
}

#[derive(Debug, Serialize, Deserialize, FromRow)]
pub struct OcurrenciaLocalizacion {
    pub ocurrencia_id: Uuid,
    pub localizacion_id: String,
    pub es_irradiado: bool,
    pub lado: Option<LadoEnum>,
}

// Request Payload DTO
#[derive(Debug, Serialize, Deserialize)]
pub struct LocalizacionPayload {
    pub localizacion_id: String,
    pub es_irradiado: bool,
    pub lado: Option<LadoEnum>,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct CrearOcurrenciaPayload {
    pub sintoma_id: Uuid,
    pub fecha_inicio: DateTime<Utc>,
    pub valor_registro: Option<String>,
    pub notas: Option<String>,
    pub caracteristica: Option<CaracteristicaEnum>,
    pub frecuencia: Option<FrecuenciaEnum>,
    pub modificadores: Vec<ModificadorDTO>,
    pub localizaciones: Vec<LocalizacionPayload>,
}
