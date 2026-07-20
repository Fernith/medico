use axum::{
    extract::DefaultBodyLimit,
    routing::{get, put, delete},
    Router,
};
use sqlx::PgPool;

// Importamos todos nuestros Handlers
use crate::handlers::{pesos, sueno, pasos, google_fit, ajustes, regla, medicion, usuario, ejercicio};

pub fn construir_router(pool: PgPool) -> Router {
    Router::new()
        // PESO
        .route("/api/pesos", get(pesos::listar_pesos).post(pesos::crear_peso))
        .route("/api/pesos/:id", put(pesos::modificar_peso).delete(pesos::borrar_peso))
        // SUEÑO
        .route("/api/sueno", get(sueno::listar_sueno))
        //PASOS
        .route("/api/pasos", get(pasos::listar_pasos))
        // RUTAS DE AUTENTICACIÓN (Google Fit)
        .route("/api/auth/google/login", get(google_fit::login_google))
        .route("/api/auth/google/callback", get(google_fit::oauth_callback))
        // AJUSTES
        .route("/api/ajustes", get(ajustes::listar_ajustes).post(ajustes::guardar_ajuste))
        // REGLA
        .route("/api/ciclos", get(regla::get_ciclos).post(regla::create_ciclo))
        .route("/api/ciclos/:id", put(regla::update_ciclo).delete(regla::delete_ciclo))
        // MEDICION
        .route("/api/mediciones", get(medicion::listar_mediciones).post(medicion::crear_medicion))
        .route("/api/mediciones/:id", put(medicion::modificar_medicion).delete(medicion::borrar_medicion))
        //USUARIO
        .route("/api/usuario", get(usuario::obtener_usuario).put(usuario::modificar_usuario))
        // ENTRENAMIENTO (Ejercicios, Grupos y Equipamientos)
        .route("/api/ejercicios", get(ejercicio::get_ejercicios).post(ejercicio::create_ejercicio))
        .route("/api/ejercicios/:id", put(ejercicio::update_ejercicio).delete(ejercicio::delete_ejercicio))
        
        .route("/api/grupos-musculares", get(ejercicio::get_grupos_musculares).post(ejercicio::create_grupo_muscular))
        .route("/api/grupos-musculares/:id", put(ejercicio::update_grupo_muscular).delete(ejercicio::delete_grupo_muscular))
        
        .route("/api/equipamiento", get(ejercicio::get_equipamientos).post(ejercicio::create_equipamiento))
        .route("/api/equipamiento/:id", delete(ejercicio::delete_equipamiento))
        // REALIZACIONES
        .route("/api/realizaciones", get(ejercicio::get_realizaciones).post(ejercicio::create_realizacion))
        .route("/api/realizaciones/:id", put(ejercicio::update_realizacion).delete(ejercicio::delete_realizacion))

        .layer(DefaultBodyLimit::max(15 * 1024 * 1024))

        // Inyectamos la conexión de base de datos a todas las rutas
        .with_state(pool)
}