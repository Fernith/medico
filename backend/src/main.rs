use axum::Router;
use std::net::SocketAddr;
use tower_http::services::ServeDir;

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

    // Enrutador Principal
    let api_router = routes::construir_router(configuracion.database_pool);
    
    let app = Router::new()
        .merge(api_router)
        .fallback_service(ServeDir::new("dist"))
        .layer(configuracion.cors_layer);

    // Encendido del Servidor
    let direccion = SocketAddr::from(([0, 0, 0, 0], 3000));
    println!("Servidor Full Stack corriendo de forma segura en: http://{}", direccion);
    println!("👉 Puedes acceder desde tu navegador en: http://localhost:3000"); // Añadido para mayor claridad
    
    let oyente = tokio::net::TcpListener::bind(&direccion).await.unwrap();
    axum::serve(oyente, app).await.unwrap();
}