use serde::Deserialize;

#[derive(Debug, Deserialize)]
pub struct TokenCallbackQuery {
    pub code: String,
    #[allow(dead_code)] // Mantenemos el state por si Google lo envía, aunque no lo usemos
    pub state: Option<String>,
}