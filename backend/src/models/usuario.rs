use serde::{Deserialize, Serialize};

#[derive(Debug, Serialize, Deserialize, sqlx::FromRow)]
pub struct UsuarioDatoEntity {
    pub clave: String,
    pub valor: String,
}
