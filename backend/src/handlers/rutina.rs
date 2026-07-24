use axum::{
    extract::{Path, State},
    Json,
};
use sqlx::PgPool;
use uuid::Uuid;

use crate::models::rutina::{
    Rutina, RutinaPayload, RutinaRealizacionDetalle, RutinaRealizacionPayload, HistorialRutinaPayload
};


// ==========================================
// RUTINAS (Cabecera)
// ==========================================
pub async fn get_rutinas(State(pool): State<PgPool>) -> Result<Json<Vec<Rutina>>, String> {
    let rutinas = sqlx::query_as!(Rutina, "SELECT id, nombre, descripcion, color FROM rutinas ORDER BY nombre")
        .fetch_all(&pool).await.map_err(|e| e.to_string())?;
    Ok(Json(rutinas))
}

pub async fn create_rutina(State(pool): State<PgPool>, Json(payload): Json<RutinaPayload>) -> Result<Json<Rutina>, String> {
    let registro = sqlx::query_as!(
        Rutina,
        "INSERT INTO rutinas (nombre, descripcion, color) VALUES ($1, $2, $3) RETURNING id, nombre, descripcion, color",
        payload.nombre, payload.descripcion, payload.color
    ).fetch_one(&pool).await.map_err(|e| e.to_string())?;
    Ok(Json(registro))
}

pub async fn update_rutina(Path(id): Path<Uuid>, State(pool): State<PgPool>, Json(payload): Json<RutinaPayload>) -> Result<Json<()>, String> {
    sqlx::query!("UPDATE rutinas SET nombre=$1, descripcion=$2, color=$3 WHERE id=$4", payload.nombre, payload.descripcion, payload.color, id)
        .execute(&pool).await.map_err(|e| e.to_string())?;
    Ok(Json(()))
}

pub async fn delete_rutina(Path(id): Path<Uuid>, State(pool): State<PgPool>) -> Result<Json<()>, String> {
    sqlx::query!("DELETE FROM rutinas WHERE id=$1", id).execute(&pool).await.map_err(|e| e.to_string())?;
    Ok(Json(()))
}

// ==========================================
// RUTINAS (Detalle de Ejercicios)
// ==========================================
pub async fn get_rutina_realizaciones(Path(rutina_id): Path<Uuid>, State(pool): State<PgPool>) -> Result<Json<Vec<RutinaRealizacionDetalle>>, String> {
    let detalles = sqlx::query_as!(
        RutinaRealizacionDetalle,
        r#"
        SELECT 
            rr.id, rr.rutina_id, rr.realizacion_id, re.ejercicio_id,
            rr.fase::text as "fase!", 
            rr.orden, rr.descanso_posterior,
            e.nombre as "ejercicio_nombre!", 
            e.imagen as "ejercicio_imagen!",
            eq.nombre as "equipamiento_nombre",
            re.series, re.reps_min, re.reps_max, re.carga_actual, re.unidad_carga, re.descanso
        FROM rutina_realizacion rr
        JOIN realizacion_ejercicio re ON rr.realizacion_id = re.id
        JOIN ejercicios e ON re.ejercicio_id = e.id
        LEFT JOIN equipamiento eq ON re.equipamiento_id = eq.id
        WHERE rr.rutina_id = $1
        ORDER BY 
            CASE rr.fase 
                WHEN 'Calentamiento'::fase_rutina THEN 1 
                WHEN 'Principal'::fase_rutina THEN 2 
                WHEN 'Postentreno'::fase_rutina THEN 3 
            END,
            rr.orden
        "#,
        rutina_id
    ).fetch_all(&pool).await.map_err(|e| e.to_string())?;
    
    Ok(Json(detalles))
}

pub async fn add_realizacion_rutina(State(pool): State<PgPool>, Json(payload): Json<RutinaRealizacionPayload>) -> Result<Json<()>, String> {
    // Usamos el ::text::fase_rutina para el ENUM igual que hicimos en grupos musculares
    sqlx::query!(
        "INSERT INTO rutina_realizacion (rutina_id, realizacion_id, fase, orden, descanso_posterior) VALUES ($1, $2, $3::text::fase_rutina, $4, $5)",
        payload.rutina_id, payload.realizacion_id, payload.fase, payload.orden, payload.descanso_posterior
    ).execute(&pool).await.map_err(|e| e.to_string())?;
    
    Ok(Json(()))
}

pub async fn update_realizacion_rutina(Path(id): Path<Uuid>, State(pool): State<PgPool>, Json(payload): Json<RutinaRealizacionPayload>) -> Result<Json<()>, String> {
    sqlx::query!(
        "UPDATE rutina_realizacion SET fase=$1::text::fase_rutina, orden=$2, descanso_posterior=$3 WHERE id=$4",
        payload.fase, payload.orden, payload.descanso_posterior, id
    ).execute(&pool).await.map_err(|e| e.to_string())?;
    
    Ok(Json(()))
}

pub async fn delete_realizacion_rutina(Path(id): Path<Uuid>, State(pool): State<PgPool>) -> Result<Json<()>, String> {
    sqlx::query!("DELETE FROM rutina_realizacion WHERE id=$1", id).execute(&pool).await.map_err(|e| e.to_string())?;
    Ok(Json(()))
}

// ==========================================
// NUEVO: GUARDAR ENTRENAMIENTO COMPLETADO
// ==========================================
pub async fn finalizar_entrenamiento(State(pool): State<PgPool>, Json(payload): Json<HistorialRutinaPayload>) -> Result<Json<()>, String> {
    // Iniciamos transacción para que no se guarde a medias si hay error
    let mut tx = pool.begin().await.map_err(|e| e.to_string())?;

    // 1. Crear el registro maestro de la sesión
    let registro_historial = sqlx::query!(
        "INSERT INTO historial_rutinas (rutina_id, nombre, fecha_inicio, fecha_fin, duracion_segundos) VALUES ($1, $2, $3, $4, $5) RETURNING id",
        payload.rutina_id, payload.nombre, payload.fecha_inicio, payload.fecha_fin, payload.duracion_segundos
    ).fetch_one(&mut *tx).await.map_err(|e| e.to_string())?;

    // 2. Iterar por todas las series y guardarlas vinculadas a esa sesión
    for serie in payload.series {
        sqlx::query!(
            r#"
            INSERT INTO historial_series 
            (historial_rutina_id, ejercicio_id, ejercicio_nombre, equipamiento_nombre, fase, orden_ejercicio, serie_numero, reps_completadas, carga_completada, unidad_carga) 
            VALUES ($1, $2, $3, $4, $5::text::fase_rutina, $6, $7, $8, $9, $10)
            "#,
            registro_historial.id, serie.ejercicio_id, serie.ejercicio_nombre, serie.equipamiento_nombre, 
            serie.fase, serie.orden_ejercicio, serie.serie_numero, serie.reps_completadas, serie.carga_completada, serie.unidad_carga
        ).execute(&mut *tx).await.map_err(|e| e.to_string())?;
    }

    // Si todo ha ido bien, confirmamos (Commit) los cambios en la BBDD
    tx.commit().await.map_err(|e| e.to_string())?;
    Ok(Json(()))
}