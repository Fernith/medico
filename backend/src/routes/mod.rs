use axum::{
    routing::{get},
    Router,
};
use sqlx::PgPool;

// Importamos todos nuestros Handlers
use crate::handlers::{pesos, sueno, pasos, google_fit, ajustes};

pub fn construir_router(pool: PgPool) -> Router {
    Router::new()
        // PESO
        .route("/api/pesos", get(pesos::listar_pesos).post(pesos::crear_peso))
        // SUEÑO
        .route("/api/sueno", get(sueno::listar_sueno))
        //PASOS
        .route("/api/pasos", get(pasos::listar_pasos))
        // RUTAS DE AUTENTICACIÓN (Google Fit)
        .route("/api/auth/google/login", get(google_fit::login_google))
        .route("/api/auth/google/callback", get(google_fit::oauth_callback))
        // AJUSTES
        .route("/api/ajustes", get(ajustes::listar_ajustes).post(ajustes::guardar_ajuste))
        
        // Inyectamos la conexión de base de datos a todas las rutas
        .with_state(pool)
}