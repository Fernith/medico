use axum::{
    extract::{Path, State},
    Json,
};
use sqlx::PgPool;
use uuid::Uuid;

use crate::models::rutina::{
    Rutina, RutinaPayload, RutinaRealizacionDetalle, RutinaRealizacionPayload, HistorialRutinaPayload,
    EstadisticaSerieRow
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
            rr.fase::text as "fase!", rr.orden, rr.descanso_posterior,
            e.nombre as "ejercicio_nombre!", e.imagen as "ejercicio_imagen?",
            re.series, re.reps_min, re.reps_max, re.carga_actual, re.unidad_carga, re.descanso,
            re.activo as "realizacion_activa!",
            re.unidad_objetivo
        FROM rutina_realizacion rr
        JOIN realizacion_ejercicio re ON rr.realizacion_id = re.id
        JOIN ejercicios e ON re.ejercicio_id = e.id
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
    let mut tx = pool.begin().await.map_err(|e| e.to_string())?;

    let registro_historial = sqlx::query!(
        "INSERT INTO historial_rutinas (rutina_id, nombre, fecha_inicio, fecha_fin, duracion_segundos) VALUES ($1, $2, $3, $4, $5) RETURNING id",
        payload.rutina_id, payload.nombre, payload.fecha_inicio, payload.fecha_fin, payload.duracion_segundos
    ).fetch_one(&mut *tx).await.map_err(|e| e.to_string())?;

    for serie in payload.series {
        sqlx::query!(
            r#"
            INSERT INTO historial_series 
            (historial_rutina_id, ejercicio_id, ejercicio_nombre, fase, orden_ejercicio, serie_numero, reps_completadas, unidad_objetivo, carga_completada, unidad_carga) 
            VALUES ($1, $2, $3, $4::text::fase_rutina, $5, $6, $7, $8, $9, $10)
            "#, 
            registro_historial.id, serie.ejercicio_id, serie.ejercicio_nombre, 
            serie.fase, serie.orden_ejercicio, serie.serie_numero, 
            serie.reps_completadas, serie.unidad_objetivo,
            serie.carga_completada, serie.unidad_carga
        ).execute(&mut *tx).await.map_err(|e| e.to_string())?;
    }

    tx.commit().await.map_err(|e| e.to_string())?;
    Ok(Json(()))
}

// ==========================================
// NUEVO: ESTADÍSTICAS
// ==========================================
pub async fn get_estadisticas_historial(State(pool): State<PgPool>) -> Result<Json<Vec<EstadisticaSerieRow>>, String> {
    let stats = sqlx::query_as!(
        EstadisticaSerieRow,
        r#"
        SELECT 
            hr.id as "historial_rutina_id!",
            hr.nombre as "rutina_nombre!",
            hr.fecha_inicio as "fecha_inicio!",
            hs.ejercicio_id as "ejercicio_id!",
            hs.ejercicio_nombre as "ejercicio_nombre!",
            te.nombre as "tipo_entrenamiento_nombre?",
            COALESCE(array_agg(DISTINCT gm.nombre) FILTER (WHERE gm.nombre IS NOT NULL), ARRAY[]::text[]) as "grupos_musculares!",
            hs.serie_numero as "serie_numero!",
            hs.reps_completadas as "reps_completadas?",
            hs.unidad_objetivo as "unidad_objetivo?",
            hs.carga_completada as "carga_completada?",
            hs.unidad_carga as "unidad_carga?"
        FROM historial_series hs
        JOIN historial_rutinas hr ON hs.historial_rutina_id = hr.id
        JOIN ejercicios e ON hs.ejercicio_id = e.id
        LEFT JOIN tipos_entrenamiento te ON e.tipo_entrenamiento_id = te.id
        LEFT JOIN ejercicio_grupos egm ON e.id = egm.ejercicio_id
        LEFT JOIN grupos_musculares gm ON egm.grupo_id = gm.id
        GROUP BY 
            hr.id, hs.historial_rutina_id, hs.ejercicio_id, hs.ejercicio_nombre, 
            hs.fase, hs.orden_ejercicio, hs.serie_numero, hs.reps_completadas, 
            hs.unidad_objetivo, hs.carga_completada, hs.unidad_carga, te.id
        ORDER BY hr.fecha_inicio DESC, hs.orden_ejercicio ASC, hs.serie_numero ASC
        "#
    ).fetch_all(&pool).await.map_err(|e| e.to_string())?;

    Ok(Json(stats))
}