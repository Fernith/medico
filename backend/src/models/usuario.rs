use serde::{Deserialize, Serialize};

// Esto le enseña a sqlx a transformar el Enum de Postgres al de Rust
#[derive(Debug, Serialize, Deserialize, sqlx::Type)]
#[sqlx(type_name = "sexo_enum", rename_all = "lowercase")]
pub enum Sexo {
    Masculino,
    Femenino,
}

#[derive(Debug, Serialize, Deserialize, sqlx::FromRow)]
pub struct UsuarioEntity {
    pub id: i32,
    pub altura: i32,
    pub sexo: Sexo,
}

#[derive(Debug, Deserialize)]
pub struct UpdateUsuarioDto {
    pub altura: i32,
    pub sexo: Sexo,
}