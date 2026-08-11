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

    // Iniciamos las tareas de fondo
    tasks::iniciar_tareas_de_fondo(configuracion.database_pool.clone()).await;

    // Enrutador Principal de la API
    let api_router = routes::construir_router(configuracion.database_pool);
    
    // --- BUSCADOR DE RUTAS A PRUEBA DE BALAS ---
    let mut ruta_estaticos = "frontend/dist"; // Ruta por defecto
    
    if std::path::Path::new("/app/frontend/dist").exists() {
        ruta_estaticos = "/app/frontend/dist"; // 1. Entorno de Producción (Docker en Render)
    } else if std::path::Path::new("../frontend/dist").exists() {
        ruta_estaticos = "../frontend/dist"; // 2. Entorno Local (ejecutando desde /backend)
    } else if std::path::Path::new("dist").exists() {
        ruta_estaticos = "dist"; // 3. Entorno Local Alternativo
    }

    println!("📂 Sirviendo el frontend desde: {}", ruta_estaticos);

    // Configurar el SPA: Sirve la carpeta detectada, y si no encuentra la ruta, devuelve index.html
    let frontend_service = ServeDir::new(ruta_estaticos)
        .not_found_service(ServeFile::new(format!("{}/index.html", ruta_estaticos)));

    let app = Router::new()
        .merge(api_router)
        .fallback_service(frontend_service)
        .layer(configuracion.cors_layer);

    // Leer el puerto que Render asigna, o usar 3000 en local
    let port = env::var("PORT").unwrap_or_else(|_| "3000".to_string());
    let addr = format!("0.0.0.0:{}", port);

    println!("🚀 Servidor Full Stack corriendo en: http://{}", addr);
    
    let oyente = tokio::net::TcpListener::bind(&addr).await.unwrap();
    axum::serve(oyente, app).await.unwrap();
}