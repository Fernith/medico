use serde::{Deserialize, Serialize};

#[derive(Debug, Serialize, Deserialize)]
pub struct AjusteEntity {
    pub clave: String,
    pub valor: String,
}