use axum::{
    extract::DefaultBodyLimit,
    routing::{get, put, post, delete, patch},
    Router,
};
use sqlx::PgPool;

// Importamos todos nuestros Handlers
use crate::handlers::{pesos, sueno, pasos, google_fit, ajustes, regla, medicion, usuario, ejercicio, rutina, medicamento};

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
        .route("/api/ejercicios/:id/reactivar", patch(ejercicio::reactivate_ejercicio))
        // GRUPO MUSCULAR
        .route("/api/grupos-musculares", get(ejercicio::get_grupos_musculares).post(ejercicio::create_grupo_muscular))
        .route("/api/grupos-musculares/:id", put(ejercicio::update_grupo_muscular).delete(ejercicio::delete_grupo_muscular))
        //EQUIPAMIENTO
        .route("/api/equipamiento", get(ejercicio::get_equipamientos).post(ejercicio::create_equipamiento))
        .route("/api/equipamiento/:id", delete(ejercicio::delete_equipamiento))
        // REALIZACIONES
        .route("/api/realizaciones", get(ejercicio::get_realizaciones).post(ejercicio::create_realizacion))
        .route("/api/realizaciones/:id", put(ejercicio::update_realizacion).delete(ejercicio::delete_realizacion))
        .route("/api/realizaciones/:id/reactivar", patch(ejercicio::reactivate_realizacion))
        // --- RUTINAS Y PLANIFICACIÓN ---
        .route("/api/rutinas", get(rutina::get_rutinas).post(rutina::create_rutina))
        .route("/api/rutinas/:id", put(rutina::update_rutina).delete(rutina::delete_rutina))
        // PLanificacion
        .route("/api/rutinas/:id/realizaciones", get(rutina::get_rutina_realizaciones))
        .route("/api/rutina-realizacion", post(rutina::add_realizacion_rutina))
        .route("/api/rutina-realizacion/:id", put(rutina::update_realizacion_rutina).delete(rutina::delete_realizacion_rutina))
        // --- HISTORIAL DE ENTRENAMIENTO ---
        .route("/api/historial-rutinas", post(rutina::finalizar_entrenamiento))
        .route("/api/estadisticas/historial", get(rutina::get_estadisticas_historial))
        // TIPO ENTRENAMIENTO
        .route("/api/tipos-entrenamiento", get(ejercicio::get_tipos_entrenamiento).post(ejercicio::create_tipo_entrenamiento))
        .route("/api/tipos-entrenamiento/:id", delete(ejercicio::delete_tipo_entrenamiento))

        // --- CATEGORÍAS MEDICAMENTOS ---
        .route("/api/categorias-medicamentos", get(medicamento::get_categorias).post(medicamento::create_categoria))
        .route("/api/categorias-medicamentos/:id", delete(medicamento::delete_categoria))

        // --- MEDICAMENTOS ---
        .route("/api/medicamentos", get(medicamento::get_medicamentos).post(medicamento::create_medicamento))
        .route("/api/medicamentos/:id", put(medicamento::update_medicamento).delete(medicamento::delete_medicamento))

        // --- MEDICACIÓN ACTIVA ---
        .route("/api/medicaciones-activas", get(medicamento::get_medicaciones_activas).post(medicamento::create_medicacion_activa))
        .route("/api/medicaciones-activas/:id", put(medicamento::update_medicacion_activa).delete(medicamento::delete_medicacion_activa))
        .route("/api/medicaciones-activas/:id/toggle", patch(medicamento::toggle_medicacion_activa))

        // --- HISTORIAL DE TOMAS ---
        .route("/api/historial-medicacion", post(medicamento::add_historial_medicacion))

        .layer(DefaultBodyLimit::max(15 * 1024 * 1024))

        // Inyectamos la conexión de base de datos a todas las rutas
        .with_state(pool)
}