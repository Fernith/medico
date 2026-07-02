use chrono::NaiveDate;
use serde::{Deserialize, Serialize};

#[derive(Debug, Serialize, Deserialize)]
pub struct SuenoEntity {
    pub id: uuid::Uuid,
    pub fecha: NaiveDate,
    pub minutos_sueno: i32,
}