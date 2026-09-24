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
    #[sqlx(rename = "cualitativa_3")]
    #[serde(rename = "cualitativa_3")]
    Cualitativa3,
    #[sqlx(rename = "conteo_episodios")]
    #[serde(rename = "conteo_episodios")]
    ConteoEpisodios,
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

#[derive(Debug, Serialize, FromRow)]
pub struct OcurrenciaDetalleDTO {
    pub id: Uuid,
    pub sintoma_id: Uuid,
    pub sintoma_nombre: String,
    pub fecha_inicio: DateTime<Utc>,
    pub fecha_fin: Option<DateTime<Utc>>,
    pub valor_registro: Option<String>,
    pub notas: Option<String>,
    pub caracteristica: Option<CaracteristicaEnum>,
    pub frecuencia: Option<FrecuenciaEnum>,
    pub modificadores: sqlx::types::Json<Vec<ModificadorDTO>>,
    // Let's use jsonb for locations to map everything easily
    pub localizaciones: sqlx::types::Json<Vec<LocalizacionPayload>>,
    pub created_at: DateTime<Utc>,
}
