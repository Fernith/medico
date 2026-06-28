use serde::{Deserialize, Serialize};
use uuid::Uuid;
use chrono::NaiveDate;

#[derive(Debug, Serialize, Deserialize, sqlx::FromRow)]
pub struct SuenoEntity {
    pub id: Uuid,
    pub fecha: NaiveDate,
    pub horas_sueno: f64, // ¡Cambiado a f64!
    pub google_fit_session_id: String,
}

#[derive(Debug, Deserialize)]
pub struct TokenCallbackQuery {
    pub code: String,
    #[allow(dead_code)]
    pub state: Option<String>,
}