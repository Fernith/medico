use axum::Router;
use tower_http::services::{ServeDir, ServeFile};
use std::env;

mod config;
mod routes;
mod handlers;
mod services;
mod models;
mod tasks; 

#[tokio::main]
async fn main() {
    let configuracion = config::AppConfig::init().await;

    // 2. Iniciamos el cron y el disparador delegándolo al nuevo archivo
    tasks::iniciar_tareas_de_fondo(configuracion.database_pool.clone()).await;

    // Enrutador Principal de la API
    let api_router = routes::construir_router(configuracion.database_pool);
    
    // Configurar el SPA: Sirve la carpeta dist, y si no encuentra la ruta, devuelve index.html
    let frontend_service = ServeDir::new("frontend/dist")
        .not_found_service(ServeFile::new("frontend/dist/index.html"));

    let app = Router::new()
        .merge(api_router)
        .fallback_service(frontend_service)
        .layer(configuracion.cors_layer);

    // Leer el puerto que Render asigna, o usar 3000 en local
    let port = env::var("PORT").unwrap_or_else(|_| "3000".to_string());
    let addr = format!("0.0.0.0:{}", port);

    // Encendido del Servidor
    println!("🚀 Servidor Full Stack corriendo en: http://{}", addr);
    
    let oyente = tokio::net::TcpListener::bind(&addr).await.unwrap();
    axum::serve(oyente, app).await.unwrap();
}