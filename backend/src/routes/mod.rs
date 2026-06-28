use axum::{routing::{get, post}, Router};
use sqlx::PgPool;
use crate::handlers::{pesos, sueno};

pub fn construir_router(pool: PgPool) -> Router {
    Router::new()
        .route("/api/pesos", get(pesos::listar_pesos).post(pesos::crear_peso))
        .route("/api/sueno", get(sueno::listar_sueno))
        .route("/api/sueno/sync", post(sueno::forzar_sincronizacion))
        .route("/api/auth/google/login", get(sueno::login_google))
        .route("/api/auth/google/callback", get(sueno::google_callback))
        .with_state(pool)
}