use chrono::{NaiveDate, DateTime, Utc};
use serde::{Serialize, Deserialize};
use uuid::Uuid;

#[derive(Debug, Serialize, Deserialize)]
pub struct SuenoEntity {
    pub id: Uuid,
    pub fecha: NaiveDate,
    pub minutos_sueno: i32,
    pub creado_en: DateTime<Utc>,
    pub hora_inicio: Option<DateTime<Utc>>,
    pub hora_fin: Option<DateTime<Utc>>,
    pub minutos_ligero: i32,
    pub minutos_profundo: i32,
    pub minutos_rem: i32,
    pub minutos_despierto: i32,
    pub minutos_siesta: i32,
    
    pub siesta_hora_inicio: Option<DateTime<Utc>>,
    pub siesta_hora_fin: Option<DateTime<Utc>>,
}