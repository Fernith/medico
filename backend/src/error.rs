use axum::{
    http::StatusCode,
    response::{IntoResponse, Response},
    Json,
};
use serde_json::json;

#[derive(Debug)]
pub enum AppError {
    /// Error de base de datos genérico
    Database(sqlx::Error),
    /// Cuando se busca un recurso específico y no existe (404)
    NotFound(String),
    /// Cuando la validación de datos falla (400)
    BadRequest(String),
    /// Otros errores internos o de lógica de negocio (500)
    Internal(String),
}

// Para poder usar `?` automáticamente con errores de SQLx
impl From<sqlx::Error> for AppError {
    fn from(inner: sqlx::Error) -> Self {
        // Interceptamos el caso donde SQLx no encuentra la fila para devolver un 404 automáticamente
        match inner {
            sqlx::Error::RowNotFound => AppError::NotFound("Registro no encontrado".to_string()),
            _ => AppError::Database(inner),
        }
    }
}

// Cómo se convierte este error en una respuesta HTTP para el cliente (Frontend)
impl IntoResponse for AppError {
    fn into_response(self) -> Response {
        let (status, error_message) = match self {
            AppError::Database(e) => {
                eprintln!("🔥 Error de BD: {:?}", e);
                (
                    StatusCode::INTERNAL_SERVER_ERROR,
                    "Error interno de base de datos".to_string(),
                )
            }
            AppError::NotFound(msg) => (StatusCode::NOT_FOUND, msg),
            AppError::BadRequest(msg) => (StatusCode::BAD_REQUEST, msg),
            AppError::Internal(msg) => {
                eprintln!("💥 Error interno: {}", msg);
                (
                    StatusCode::INTERNAL_SERVER_ERROR,
                    "Error interno del servidor".to_string(),
                )
            }
        };

        let body = Json(json!({
            "error": error_message,
        }));

        (status, body).into_response()
    }
}

impl From<String> for AppError {
    fn from(err: String) -> Self {
        AppError::Internal(err)
    }
}
