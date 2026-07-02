use axum::{
    routing::{get},
    Router,
};
use sqlx::PgPool;

// Importamos todos nuestros Handlers
use crate::handlers::{pesos, sueno, pasos, google_fit};

pub fn construir_router(pool: PgPool) -> Router {
    Router::new()
        // ==========================================
        // RUTAS DE LA APLICACIÓN (Datos locales BD)
        // ==========================================
        .route("/api/pesos", get(pesos::listar_pesos).post(pesos::crear_peso))
        .route("/api/sueno", get(sueno::listar_sueno))
        .route("/api/pasos", get(pasos::listar_pasos))
        
        // ==========================================
        // RUTAS DE AUTENTICACIÓN (Google Fit)
        // ==========================================
        .route("/api/auth/google/login", get(google_fit::login_google))
        .route("/api/auth/google/callback", get(google_fit::oauth_callback))
        
        // Inyectamos la conexión de base de datos a todas las rutas
        .with_state(pool)
}