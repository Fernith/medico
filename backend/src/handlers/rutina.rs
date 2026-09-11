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
use chrono::{Datelike, Local, NaiveDate};
use std::collections::HashSet;
use serde_json::json;


// ==========================================
// RUTINAS (Cabecera)
// ==========================================
pub async fn get_rutinas(State(pool): State<PgPool>) -> Result<Json<Vec<Rutina>>, String> {
    // CORRECCIÓN: COALESCE asegura que nunca sea nulo, y el '!' calma al compilador de SQLx
    let rutinas = sqlx::query_as!(
        Rutina, 
        r#"SELECT id, nombre, descripcion, color, COALESCE(activo, true) as "activo!" FROM rutinas ORDER BY nombre"#
    )
        .fetch_all(&pool).await.map_err(|e| e.to_string())?;
    Ok(Json(rutinas))
}

pub async fn create_rutina(State(pool): State<PgPool>, Json(payload): Json<RutinaPayload>) -> Result<Json<Rutina>, String> {
    // CORRECCIÓN: Aplicado también en el RETURNING
    let registro = sqlx::query_as!(
        Rutina,
        r#"INSERT INTO rutinas (nombre, descripcion, color) VALUES ($1, $2, $3) RETURNING id, nombre, descripcion, color, COALESCE(activo, true) as "activo!""#,
        payload.nombre, payload.descripcion, payload.color
    ).fetch_one(&pool).await.map_err(|e| e.to_string())?;
    Ok(Json(registro))
}

pub async fn update_rutina(Path(id): Path<Uuid>, State(pool): State<PgPool>, Json(payload): Json<RutinaPayload>) -> Result<Json<()>, String> {
    sqlx::query!("UPDATE rutinas SET nombre=$1, descripcion=$2, color=$3 WHERE id=$4", payload.nombre, payload.descripcion, payload.color, id)
        .execute(&pool).await.map_err(|e| e.to_string())?;
    Ok(Json(()))
}

// BORRADO FÍSICO DEFINITIVO (Emulando ON DELETE SET NULL)
pub async fn delete_rutina_fisico(Path(id): Path<Uuid>, State(pool): State<PgPool>) -> Result<Json<()>, String> {
    let mut tx = pool.begin().await.map_err(|e| e.to_string())?;

    // 1. Desvinculamos el historial (ON DELETE SET NULL manual)
    sqlx::query!("UPDATE historial_rutinas SET rutina_id = NULL WHERE rutina_id = $1", id)
        .execute(&mut *tx).await.map_err(|e| e.to_string())?;

    // 2. Borramos la rutina físicamente
    sqlx::query!("DELETE FROM rutinas WHERE id=$1", id)
        .execute(&mut *tx).await.map_err(|e| e.to_string())?;

    tx.commit().await.map_err(|e| e.to_string())?;
    Ok(Json(()))
}

// MODIFICAR ESTADO (Archivar / Restaurar)
pub async fn cambiar_estado_rutina(
    Path(id): Path<Uuid>, 
    State(pool): State<PgPool>, 
    Json(payload): Json<crate::models::rutina::EstadoPayload>
) -> Result<Json<()>, String> {
    sqlx::query!("UPDATE rutinas SET activo = $1 WHERE id=$2", payload.activo, id)
        .execute(&pool).await.map_err(|e| e.to_string())?;
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
            r.color as "rutina_color?",
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
        LEFT JOIN rutinas r ON hr.rutina_id = r.id /* <-- NUEVO */
        JOIN ejercicios e ON hs.ejercicio_id = e.id
        LEFT JOIN tipos_entrenamiento te ON e.tipo_entrenamiento_id = te.id
        LEFT JOIN ejercicio_grupos egm ON e.id = egm.ejercicio_id
        LEFT JOIN grupos_musculares gm ON egm.grupo_id = gm.id
        GROUP BY 
            hr.id, r.color, hs.historial_rutina_id, hs.ejercicio_id, hs.ejercicio_nombre,
            hs.fase, hs.orden_ejercicio, hs.serie_numero, hs.reps_completadas, 
            hs.unidad_objetivo, hs.carga_completada, hs.unidad_carga, te.id
        ORDER BY hr.fecha_inicio DESC, hs.orden_ejercicio ASC, hs.serie_numero ASC
        "#
    ).fetch_all(&pool).await.map_err(|e| e.to_string())?;

    Ok(Json(stats))
}

pub async fn get_racha_entrenamientos(State(pool): State<PgPool>) -> Result<Json<serde_json::Value>, String> {
    let meta_dias = sqlx::query!("SELECT valor FROM ajustes_usuario WHERE clave = 'racha_entrenamiento'")
        .fetch_optional(&pool).await.unwrap_or(None)
        .and_then(|r| r.valor.parse::<i32>().ok()).unwrap_or(4);

    let rows = sqlx::query!("SELECT DISTINCT DATE(fecha_fin) as fecha FROM historial_rutinas ORDER BY fecha DESC")
        .fetch_all(&pool).await.map_err(|e| e.to_string())?;

    let mut trained_dates: HashSet<NaiveDate> = HashSet::new();
    for r in rows { if let Some(d) = r.fecha { trained_dates.insert(d); } }

    let today = Local::now().date_naive();
    let current_week_start = today - chrono::Duration::days(today.weekday().num_days_from_monday() as i64);

    let mut racha_count = 0;
    let mut racha_start = today;
    let mut check_week_start = current_week_start;

    // 1. Verificar si la semana actual AÚN puede ser válida matemáticamente
    let mut max_possible_this_week = 0;
    for i in 0..7 {
        let d = current_week_start + chrono::Duration::days(i);
        // Un día suma como "posible" si ya hemos entrenado OR si es hoy/futuro
        if trained_dates.contains(&d) || d >= today {
            max_possible_this_week += 1;
        }
    }
    
    let current_week_valid = max_possible_this_week >= meta_dias;

    // 2. Si la semana actual está matemáticamente rota, solo contamos los días consecutivos hacia atrás.
    if !current_week_valid {
        let mut curr = today;
        // Si hoy no se ha entrenado, evaluamos desde ayer para no truncar la racha visible
        if !trained_dates.contains(&curr) {
            curr -= chrono::Duration::days(1);
        }
        
        while trained_dates.contains(&curr) {
            racha_count += 1;
            racha_start = curr;
            curr -= chrono::Duration::days(1);
        }
        
        // Si no hay racha en absoluto, reseteamos la fecha a hoy
        if racha_count == 0 {
            racha_start = today; 
        }
        
        return Ok(Json(json!({ "dias": racha_count, "inicio": racha_start })));
    }

    // 3. La semana actual es válida. Contamos los días entrenados esta semana hasta hoy.
    let mut curr = today;
    while curr >= check_week_start {
        if trained_dates.contains(&curr) { 
            racha_count += 1; 
            racha_start = curr; 
        }
        curr -= chrono::Duration::days(1);
    }

    // 4. Analizamos semanas anteriores
    check_week_start -= chrono::Duration::days(7);
    let mut valid_weeks_chain = true;

    while valid_weeks_chain {
        let mut week_trained = 0;
        for i in 0..7 {
            let d = check_week_start + chrono::Duration::days(i);
            if trained_dates.contains(&d) { week_trained += 1; }
        }

        if week_trained >= meta_dias {
            // Semana válida: Sumamos todos los días entrenados de esa semana
            for i in (0..7).rev() {
                let d = check_week_start + chrono::Duration::days(i);
                if trained_dates.contains(&d) { 
                    racha_count += 1; 
                    racha_start = d; 
                }
            }
            check_week_start -= chrono::Duration::days(7);
        } else {
            // Cadena de semanas rota. Sumamos los días consecutivos que enganchen con la última semana válida
            valid_weeks_chain = false;
            let mut d = check_week_start + chrono::Duration::days(6);
            while trained_dates.contains(&d) {
                racha_count += 1;
                racha_start = d;
                d -= chrono::Duration::days(1);
            }
        }
    }

    Ok(Json(json!({ "dias": racha_count, "inicio": racha_start })))
}

pub async fn duplicar_rutina(Path(id): Path<Uuid>, State(pool): State<PgPool>, Json(payload): Json<crate::models::rutina::DuplicarPayload>) -> Result<Json<()>, String> {
    let mut tx = pool.begin().await.map_err(|e| e.to_string())?;
    
    // 1. Copiamos la rutina maestra
    let nueva_rutina = sqlx::query!(
        "INSERT INTO rutinas (nombre, descripcion, color, activo)
         SELECT $1, descripcion, color, activo FROM rutinas WHERE id = $2 RETURNING id",
        payload.nombre, id
    ).fetch_one(&mut *tx).await.map_err(|e| e.to_string())?;

    // 2. Copiamos todos los ejercicios asociados (apuntando a la nueva rutina)
    sqlx::query!(
        "INSERT INTO rutina_realizacion (rutina_id, realizacion_id, fase, orden, descanso_posterior)
         SELECT $1, realizacion_id, fase, orden, descanso_posterior FROM rutina_realizacion WHERE rutina_id = $2",
        nueva_rutina.id, id
    ).execute(&mut *tx).await.map_err(|e| e.to_string())?;

    tx.commit().await.map_err(|e| e.to_string())?;
    Ok(Json(()))
}