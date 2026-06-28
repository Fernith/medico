use sqlx::postgres::PgPoolOptions;
use sqlx::PgPool;
use std::env;
use tower_http::cors::{Any, CorsLayer};

pub struct AppConfig {
    pub database_pool: PgPool,
    pub cors_layer: CorsLayer,
}

impl AppConfig {
    pub async fn init() -> Self {
        dotenvy::dotenv().ok();
        
        let database_url = env::var("DATABASE_URL")
            .expect("DATABASE_URL debe estar configurada en las variables de entorno");

        let database_pool = PgPoolOptions::new()
            .max_connections(5)
            .connect(&database_url)
            .await
            .expect("No se pudo conectar a la base de datos Supabase");

        let cors_layer = CorsLayer::new()
            .allow_origin(Any)
            .allow_methods(Any)
            .allow_headers(Any);

        AppConfig { database_pool, cors_layer }
    }
}