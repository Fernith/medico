use axum::{
    extract::{Path, State},
    Json,
};
use sqlx::PgPool;
use uuid::Uuid;

use crate::models::ejercicio::{
    Ejercicio, EjercicioPayload, Equipamiento, EquipamientoPayload, 
    GrupoMuscular, GrupoMuscularPayload, RealizacionEjercicio, RealizacionPayload,
    TipoEntrenamiento, TipoEntrenamientoPayload
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
            e.tipo_entrenamiento_id, 
            t.nombre as "tipo_entrenamiento_nombre?",
            ARRAY(SELECT grupo_id FROM ejercicio_grupos WHERE ejercicio_id = e.id) as "grupos_ids",
            ARRAY(SELECT g.nombre FROM ejercicio_grupos eg JOIN grupos_musculares g ON eg.grupo_id = g.id WHERE eg.ejercicio_id = e.id) as "grupos_nombres"
        FROM ejercicios e
        LEFT JOIN tipos_entrenamiento t ON e.tipo_entrenamiento_id = t.id
        ORDER BY e.nombre
        "#
    ).fetch_all(&pool).await.map_err(|e| e.to_string())?;
    Ok(Json(ejercicios))
}

pub async fn create_ejercicio(State(pool): State<PgPool>, Json(payload): Json<EjercicioPayload>) -> Result<Json<Ejercicio>, String> {
    let mut tx = pool.begin().await.map_err(|e| e.to_string())?;

    let registro = sqlx::query!(
        "INSERT INTO ejercicios (nombre, descripcion, imagen, tipo_entrenamiento_id) VALUES ($1, $2, $3, $4) RETURNING id",
        payload.nombre, payload.descripcion, payload.imagen, payload.tipo_entrenamiento_id
    ).fetch_one(&mut *tx).await.map_err(|e| e.to_string())?;

    for id in &payload.grupos_ids {
        sqlx::query!("INSERT INTO ejercicio_grupos (ejercicio_id, grupo_id) VALUES ($1, $2)", registro.id, id)
            .execute(&mut *tx).await.map_err(|e| e.to_string())?;
    }

    tx.commit().await.map_err(|e| e.to_string())?;

    Ok(Json(Ejercicio {
        id: registro.id, nombre: payload.nombre, descripcion: payload.descripcion, imagen: payload.imagen,
        tipo_entrenamiento_id: payload.tipo_entrenamiento_id, tipo_entrenamiento_nombre: None,
        grupos_ids: Some(payload.grupos_ids), grupos_nombres: Some(vec![]),
    }))
}

pub async fn update_ejercicio(Path(id): Path<Uuid>, State(pool): State<PgPool>, Json(payload): Json<EjercicioPayload>) -> Result<Json<()>, String> {
    let mut tx = pool.begin().await.map_err(|e| e.to_string())?;

    sqlx::query!("UPDATE ejercicios SET nombre=$1, descripcion=$2, imagen=$3, tipo_entrenamiento_id=$4 WHERE id=$5", 
        payload.nombre, payload.descripcion, payload.imagen, payload.tipo_entrenamiento_id, id)
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
    // Al hacer JOIN, e.imagen puede ser nulo, sqlx lo mapea a Option<String>
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
        // ANTES: ejercicio_imagen: "".to_string(),
        ejercicio_imagen: None, // AHORA: None para Option<String>
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

// -- TIPOS DE ENTRENAMIENTO --
pub async fn get_tipos_entrenamiento(State(pool): State<PgPool>) -> Result<Json<Vec<TipoEntrenamiento>>, String> {
    let tipos = sqlx::query_as!(TipoEntrenamiento, "SELECT id, nombre FROM tipos_entrenamiento ORDER BY nombre")
        .fetch_all(&pool).await.map_err(|e| e.to_string())?;
    Ok(Json(tipos))
}

pub async fn create_tipo_entrenamiento(State(pool): State<PgPool>, Json(payload): Json<TipoEntrenamientoPayload>) -> Result<Json<TipoEntrenamiento>, String> {
    let registro = sqlx::query_as!(TipoEntrenamiento, "INSERT INTO tipos_entrenamiento (nombre) VALUES ($1) RETURNING id, nombre", payload.nombre)
        .fetch_one(&pool).await.map_err(|e| e.to_string())?;
    Ok(Json(registro))
}

pub async fn delete_tipo_entrenamiento(Path(id): Path<Uuid>, State(pool): State<PgPool>) -> Result<Json<()>, String> {
    sqlx::query!("DELETE FROM tipos_entrenamiento WHERE id = $1", id).execute(&pool).await.map_err(|e| e.to_string())?;
    Ok(Json(()))
}