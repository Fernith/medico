use axum::{
    extract::{Path, State},
    Json,
};
use sqlx::PgPool;
use uuid::Uuid;

use crate::models::ejercicio::{Ejercicio, EjercicioPayload, Equipamiento, GrupoMuscular, GrupoMuscularPayload, EquipamientoPayload};

pub async fn get_grupos_musculares(
    State(pool): State<PgPool>,
) -> Result<Json<Vec<GrupoMuscular>>, String> {
    let grupos = sqlx::query_as!(
        GrupoMuscular,
        "SELECT id, nombre, categoria::text FROM grupos_musculares ORDER BY categoria DESC, nombre"
    )
    .fetch_all(&pool)
    .await
    .map_err(|e| e.to_string())?;

    Ok(Json(grupos))
}

pub async fn get_equipamientos(
    State(pool): State<PgPool>,
) -> Result<Json<Vec<Equipamiento>>, String> {
    let equipos = sqlx::query_as!(
        Equipamiento,
        "SELECT id, nombre FROM equipamiento ORDER BY nombre"
    )
    .fetch_all(&pool)
    .await
    .map_err(|e| e.to_string())?;

    Ok(Json(equipos))
}

pub async fn get_ejercicios(
    State(pool): State<PgPool>,
) -> Result<Json<Vec<Ejercicio>>, String> {
    let ejercicios = sqlx::query_as!(
        Ejercicio,
        r#"
        SELECT 
            e.id, e.nombre, e.descripcion, e.imagen, e.carga_actual, e.unidad_carga,
            ARRAY(SELECT grupo_id FROM ejercicio_grupos WHERE ejercicio_id = e.id) as "grupos_ids",
            ARRAY(SELECT g.nombre FROM ejercicio_grupos eg JOIN grupos_musculares g ON eg.grupo_id = g.id WHERE eg.ejercicio_id = e.id) as "grupos_nombres",
            ARRAY(SELECT equipamiento_id FROM ejercicio_equipamiento WHERE ejercicio_id = e.id) as "equipamientos_ids",
            ARRAY(SELECT eq.nombre FROM ejercicio_equipamiento ee JOIN equipamiento eq ON ee.equipamiento_id = eq.id WHERE ee.ejercicio_id = e.id) as "equipamientos_nombres"
        FROM ejercicios e
        ORDER BY e.nombre
        "#
    )
    .fetch_all(&pool)
    .await
    .map_err(|e| e.to_string())?;

    Ok(Json(ejercicios))
}

pub async fn create_ejercicio(
    State(pool): State<PgPool>,
    Json(payload): Json<EjercicioPayload>,
) -> Result<Json<Ejercicio>, String> {
    let mut tx = pool.begin().await.map_err(|e| e.to_string())?;

    let registro = sqlx::query!(
        "INSERT INTO ejercicios (nombre, descripcion, imagen, carga_actual, unidad_carga) VALUES ($1, $2, $3, $4, $5) RETURNING id",
        payload.nombre, payload.descripcion, payload.imagen, payload.carga_actual, payload.unidad_carga
    )
    .fetch_one(&mut *tx).await.map_err(|e| e.to_string())?;

    for id in &payload.grupos_ids {
        sqlx::query!("INSERT INTO ejercicio_grupos (ejercicio_id, grupo_id) VALUES ($1, $2)", registro.id, id)
            .execute(&mut *tx).await.map_err(|e| e.to_string())?;
    }

    for id in &payload.equipamientos_ids {
        sqlx::query!("INSERT INTO ejercicio_equipamiento (ejercicio_id, equipamiento_id) VALUES ($1, $2)", registro.id, id)
            .execute(&mut *tx).await.map_err(|e| e.to_string())?;
    }

    tx.commit().await.map_err(|e| e.to_string())?;

    Ok(Json(Ejercicio {
        id: registro.id,
        nombre: payload.nombre,
        descripcion: payload.descripcion,
        imagen: payload.imagen,
        carga_actual: payload.carga_actual,
        unidad_carga: payload.unidad_carga,
        grupos_ids: Some(payload.grupos_ids), grupos_nombres: Some(vec![]),
        equipamientos_ids: Some(payload.equipamientos_ids), equipamientos_nombres: Some(vec![]),
    }))
}

pub async fn update_ejercicio(
    Path(id): Path<Uuid>, State(pool): State<PgPool>, Json(payload): Json<EjercicioPayload>,
) -> Result<Json<()>, String> {
    let mut tx = pool.begin().await.map_err(|e| e.to_string())?;

    sqlx::query!(
        "UPDATE ejercicios SET nombre=$1, descripcion=$2, imagen=$3, carga_actual=$4, unidad_carga=$5 WHERE id=$6",
        payload.nombre, payload.descripcion, payload.imagen, payload.carga_actual, payload.unidad_carga, id
    ).execute(&mut *tx).await.map_err(|e| e.to_string())?;

    sqlx::query!("DELETE FROM ejercicio_grupos WHERE ejercicio_id = $1", id).execute(&mut *tx).await.map_err(|e| e.to_string())?;
    for g_id in payload.grupos_ids {
        sqlx::query!("INSERT INTO ejercicio_grupos (ejercicio_id, grupo_id) VALUES ($1, $2)", id, g_id).execute(&mut *tx).await.map_err(|e| e.to_string())?;
    }

    sqlx::query!("DELETE FROM ejercicio_equipamiento WHERE ejercicio_id = $1", id).execute(&mut *tx).await.map_err(|e| e.to_string())?;
    for eq_id in payload.equipamientos_ids {
        sqlx::query!("INSERT INTO ejercicio_equipamiento (ejercicio_id, equipamiento_id) VALUES ($1, $2)", id, eq_id).execute(&mut *tx).await.map_err(|e| e.to_string())?;
    }

    tx.commit().await.map_err(|e| e.to_string())?;
    Ok(Json(()))
}

pub async fn delete_ejercicio(
    Path(id): Path<Uuid>, State(pool): State<PgPool>,
) -> Result<Json<()>, String> {
    sqlx::query!("DELETE FROM ejercicios WHERE id = $1", id).execute(&pool).await.map_err(|e| e.to_string())?;
    Ok(Json(()))
}

// ==========================================
// ADMINISTRACIÓN: GRUPOS MUSCULARES
// ==========================================

pub async fn create_grupo_muscular(
    State(pool): State<PgPool>,
    Json(payload): Json<GrupoMuscularPayload>,
) -> Result<Json<GrupoMuscular>, String> {
    // Fíjate en el $2::text::categoria_grupo y en el as "categoria" del RETURNING
    let registro = sqlx::query_as!(
        GrupoMuscular,
        r#"
        INSERT INTO grupos_musculares (nombre, categoria) 
        VALUES ($1, $2::text::categoria_grupo) 
        RETURNING id, nombre, categoria::text as "categoria"
        "#,
        payload.nombre,
        payload.categoria
    )
    .fetch_one(&pool)
    .await
    .map_err(|e| e.to_string())?;

    Ok(Json(registro))
}

pub async fn update_grupo_muscular(
    Path(id): Path<Uuid>,
    State(pool): State<PgPool>,
    Json(payload): Json<GrupoMuscularPayload>,
) -> Result<Json<()>, String> {
    // Aquí también aplicamos el $2::text::categoria_grupo
    sqlx::query!(
        "UPDATE grupos_musculares SET nombre = $1, categoria = $2::text::categoria_grupo WHERE id = $3",
        payload.nombre,
        payload.categoria,
        id
    )
    .execute(&pool)
    .await
    .map_err(|e| e.to_string())?;

    Ok(Json(()))
}

pub async fn delete_grupo_muscular(
    Path(id): Path<Uuid>,
    State(pool): State<PgPool>,
) -> Result<Json<()>, String> {
    sqlx::query!("DELETE FROM grupos_musculares WHERE id = $1", id)
        .execute(&pool)
        .await
        .map_err(|e| e.to_string())?;

    Ok(Json(()))
}


// ==========================================
// ADMINISTRACIÓN: EQUIPAMIENTO
// ==========================================

pub async fn create_equipamiento(
    State(pool): State<PgPool>,
    Json(payload): Json<EquipamientoPayload>,
) -> Result<Json<Equipamiento>, String> {
    let registro = sqlx::query_as!(
        Equipamiento,
        "INSERT INTO equipamiento (nombre) VALUES ($1) RETURNING id, nombre",
        payload.nombre
    )
    .fetch_one(&pool)
    .await
    .map_err(|e| e.to_string())?;

    Ok(Json(registro))
}

pub async fn delete_equipamiento(
    Path(id): Path<Uuid>,
    State(pool): State<PgPool>,
) -> Result<Json<()>, String> {
    sqlx::query!("DELETE FROM equipamiento WHERE id = $1", id)
        .execute(&pool)
        .await
        .map_err(|e| e.to_string())?;

    Ok(Json(()))
}