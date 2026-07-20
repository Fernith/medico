use axum::{
    extract::{Path, State},
    Json,
};
use sqlx::PgPool;
use uuid::Uuid;

use crate::models::ejercicio::{
    Ejercicio, EjercicioPayload, Equipamiento, EquipamientoPayload, 
    GrupoMuscular, GrupoMuscularPayload, RealizacionEjercicio, RealizacionPayload,
    Rutina, RutinaPayload, RutinaRealizacionDetalle, RutinaRealizacionPayload
};

// ==========================================
// DATOS MAESTROS (Grupos y Equipos)
// ==========================================
pub async fn get_grupos_musculares(State(pool): State<PgPool>) -> Result<Json<Vec<GrupoMuscular>>, String> {
    let grupos = sqlx::query_as!(GrupoMuscular, "SELECT id, nombre, categoria::text FROM grupos_musculares ORDER BY categoria DESC, nombre")
        .fetch_all(&pool).await.map_err(|e| e.to_string())?;
    Ok(Json(grupos))
}

pub async fn create_grupo_muscular(State(pool): State<PgPool>, Json(payload): Json<GrupoMuscularPayload>) -> Result<Json<GrupoMuscular>, String> {
    let registro = sqlx::query_as!(GrupoMuscular, 
        r#"INSERT INTO grupos_musculares (nombre, categoria) VALUES ($1, $2::text::categoria_grupo) RETURNING id, nombre, categoria::text as "categoria""#,
        payload.nombre, payload.categoria
    ).fetch_one(&pool).await.map_err(|e| e.to_string())?;
    Ok(Json(registro))
}

pub async fn update_grupo_muscular(Path(id): Path<Uuid>, State(pool): State<PgPool>, Json(payload): Json<GrupoMuscularPayload>) -> Result<Json<()>, String> {
    sqlx::query!("UPDATE grupos_musculares SET nombre = $1, categoria = $2::text::categoria_grupo WHERE id = $3", payload.nombre, payload.categoria, id)
        .execute(&pool).await.map_err(|e| e.to_string())?;
    Ok(Json(()))
}

pub async fn delete_grupo_muscular(Path(id): Path<Uuid>, State(pool): State<PgPool>) -> Result<Json<()>, String> {
    sqlx::query!("DELETE FROM grupos_musculares WHERE id = $1", id).execute(&pool).await.map_err(|e| e.to_string())?;
    Ok(Json(()))
}

pub async fn get_equipamientos(State(pool): State<PgPool>) -> Result<Json<Vec<Equipamiento>>, String> {
    let equipos = sqlx::query_as!(Equipamiento, "SELECT id, nombre FROM equipamiento ORDER BY nombre")
        .fetch_all(&pool).await.map_err(|e| e.to_string())?;
    Ok(Json(equipos))
}

pub async fn create_equipamiento(State(pool): State<PgPool>, Json(payload): Json<EquipamientoPayload>) -> Result<Json<Equipamiento>, String> {
    let registro = sqlx::query_as!(Equipamiento, "INSERT INTO equipamiento (nombre) VALUES ($1) RETURNING id, nombre", payload.nombre)
        .fetch_one(&pool).await.map_err(|e| e.to_string())?;
    Ok(Json(registro))
}

pub async fn delete_equipamiento(Path(id): Path<Uuid>, State(pool): State<PgPool>) -> Result<Json<()>, String> {
    sqlx::query!("DELETE FROM equipamiento WHERE id = $1", id).execute(&pool).await.map_err(|e| e.to_string())?;
    Ok(Json(()))
}


// ==========================================
// CATÁLOGO DE EJERCICIOS
// ==========================================
pub async fn get_ejercicios(State(pool): State<PgPool>) -> Result<Json<Vec<Ejercicio>>, String> {
    let ejercicios = sqlx::query_as!(
        Ejercicio,
        r#"
        SELECT 
            e.id, e.nombre, e.descripcion, e.imagen,
            ARRAY(SELECT grupo_id FROM ejercicio_grupos WHERE ejercicio_id = e.id) as "grupos_ids",
            ARRAY(SELECT g.nombre FROM ejercicio_grupos eg JOIN grupos_musculares g ON eg.grupo_id = g.id WHERE eg.ejercicio_id = e.id) as "grupos_nombres"
        FROM ejercicios e
        ORDER BY e.nombre
        "#
    ).fetch_all(&pool).await.map_err(|e| e.to_string())?;
    Ok(Json(ejercicios))
}

pub async fn create_ejercicio(State(pool): State<PgPool>, Json(payload): Json<EjercicioPayload>) -> Result<Json<Ejercicio>, String> {
    let mut tx = pool.begin().await.map_err(|e| e.to_string())?;

    let registro = sqlx::query!(
        "INSERT INTO ejercicios (nombre, descripcion, imagen) VALUES ($1, $2, $3) RETURNING id",
        payload.nombre, payload.descripcion, payload.imagen
    ).fetch_one(&mut *tx).await.map_err(|e| e.to_string())?;

    for id in &payload.grupos_ids {
        sqlx::query!("INSERT INTO ejercicio_grupos (ejercicio_id, grupo_id) VALUES ($1, $2)", registro.id, id)
            .execute(&mut *tx).await.map_err(|e| e.to_string())?;
    }

    tx.commit().await.map_err(|e| e.to_string())?;

    Ok(Json(Ejercicio {
        id: registro.id, nombre: payload.nombre, descripcion: payload.descripcion, imagen: payload.imagen,
        grupos_ids: Some(payload.grupos_ids), grupos_nombres: Some(vec![]),
    }))
}

pub async fn update_ejercicio(Path(id): Path<Uuid>, State(pool): State<PgPool>, Json(payload): Json<EjercicioPayload>) -> Result<Json<()>, String> {
    let mut tx = pool.begin().await.map_err(|e| e.to_string())?;

    sqlx::query!("UPDATE ejercicios SET nombre=$1, descripcion=$2, imagen=$3 WHERE id=$4", payload.nombre, payload.descripcion, payload.imagen, id)
        .execute(&mut *tx).await.map_err(|e| e.to_string())?;

    sqlx::query!("DELETE FROM ejercicio_grupos WHERE ejercicio_id = $1", id).execute(&mut *tx).await.map_err(|e| e.to_string())?;
    for g_id in payload.grupos_ids {
        sqlx::query!("INSERT INTO ejercicio_grupos (ejercicio_id, grupo_id) VALUES ($1, $2)", id, g_id).execute(&mut *tx).await.map_err(|e| e.to_string())?;
    }

    tx.commit().await.map_err(|e| e.to_string())?;
    Ok(Json(()))
}

pub async fn delete_ejercicio(Path(id): Path<Uuid>, State(pool): State<PgPool>) -> Result<Json<()>, String> {
    sqlx::query!("DELETE FROM ejercicios WHERE id = $1", id).execute(&pool).await.map_err(|e| e.to_string())?;
    Ok(Json(()))
}


// ==========================================
// REALIZACIÓN DE EJERCICIOS
// ==========================================
pub async fn get_realizaciones(State(pool): State<PgPool>) -> Result<Json<Vec<RealizacionEjercicio>>, String> {
    let realizaciones = sqlx::query_as!(
        RealizacionEjercicio,
        r#"
        SELECT 
            r.id, 
            r.ejercicio_id, e.nombre as "ejercicio_nombre", e.imagen as "ejercicio_imagen",
            r.equipamiento_id, eq.nombre as "equipamiento_nombre",
            r.carga_actual, r.unidad_carga, r.series, r.reps_min, r.reps_max, r.descanso
        FROM realizacion_ejercicio r
        JOIN ejercicios e ON r.ejercicio_id = e.id
        LEFT JOIN equipamiento eq ON r.equipamiento_id = eq.id
        ORDER BY e.nombre
        "#
    ).fetch_all(&pool).await.map_err(|e| e.to_string())?;
    Ok(Json(realizaciones))
}

pub async fn create_realizacion(State(pool): State<PgPool>, Json(payload): Json<RealizacionPayload>) -> Result<Json<RealizacionEjercicio>, String> {
    let registro = sqlx::query!(
        r#"
        INSERT INTO realizacion_ejercicio (ejercicio_id, equipamiento_id, carga_actual, unidad_carga, series, reps_min, reps_max, descanso)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
        RETURNING id
        "#,
        payload.ejercicio_id, payload.equipamiento_id, payload.carga_actual, payload.unidad_carga, 
        payload.series, payload.reps_min, payload.reps_max, payload.descanso
    ).fetch_one(&pool).await.map_err(|e| e.to_string())?;

    Ok(Json(RealizacionEjercicio {
        id: registro.id, ejercicio_id: payload.ejercicio_id, ejercicio_nombre: "".to_string(),
        ejercicio_imagen: "".to_string(), // Lo dejamos vacío, el front recargará los datos
        equipamiento_id: payload.equipamiento_id, equipamiento_nombre: None, carga_actual: payload.carga_actual,
        unidad_carga: payload.unidad_carga, series: payload.series, reps_min: payload.reps_min, 
        reps_max: payload.reps_max, descanso: payload.descanso,
    }))
}

pub async fn update_realizacion(Path(id): Path<Uuid>, State(pool): State<PgPool>, Json(payload): Json<RealizacionPayload>) -> Result<Json<()>, String> {
    sqlx::query!(
        r#"
        UPDATE realizacion_ejercicio 
        SET ejercicio_id=$1, equipamiento_id=$2, carga_actual=$3, unidad_carga=$4, series=$5, reps_min=$6, reps_max=$7, descanso=$8
        WHERE id=$9
        "#,
        payload.ejercicio_id, payload.equipamiento_id, payload.carga_actual, payload.unidad_carga,
        payload.series, payload.reps_min, payload.reps_max, payload.descanso, id
    ).execute(&pool).await.map_err(|e| e.to_string())?;
    
    Ok(Json(()))
}

pub async fn delete_realizacion(Path(id): Path<Uuid>, State(pool): State<PgPool>) -> Result<Json<()>, String> {
    sqlx::query!("DELETE FROM realizacion_ejercicio WHERE id = $1", id).execute(&pool).await.map_err(|e| e.to_string())?;
    Ok(Json(()))
}

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
            rr.id, rr.rutina_id, rr.realizacion_id, 
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