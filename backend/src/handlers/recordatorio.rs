use axum::{extract::{Path, State}, Json};
use sqlx::PgPool;
use chrono::Local;
use crate::models::recordatorio::Recordatorio;

// OBTENER TODOS + CÁLCULO DE ALERTAS
pub async fn get_recordatorios(State(pool): State<PgPool>) -> Result<Json<Vec<Recordatorio>>, String> {
    let recs = sqlx::query!("SELECT clave, nombre, descripcion, dias, entidad FROM recordatorios")
        .fetch_all(&pool).await.map_err(|e| e.to_string())?;

    let mut resultados = Vec::new();
    let hoy = Local::now().naive_local().date();

    for r in recs {
        let mut ultima_fecha = None;
        
        // Match dinámico y SEGURO contra inyecciones SQL
        match r.entidad.as_str() {
            "peso" => { ultima_fecha = sqlx::query!("SELECT MAX(fecha) as f FROM pesos").fetch_one(&pool).await.ok().and_then(|row| row.f); },
            "medicion" => { ultima_fecha = sqlx::query!("SELECT MAX(fecha) as f FROM medicion").fetch_one(&pool).await.ok().and_then(|row| row.f); },
            "pasos" => { ultima_fecha = sqlx::query!("SELECT MAX(fecha) as f FROM pasos").fetch_one(&pool).await.ok().and_then(|row| row.f); },
            "sueno" => { ultima_fecha = sqlx::query!("SELECT MAX(fecha) as f FROM sueno").fetch_one(&pool).await.ok().and_then(|row| row.f); },
            "entrenamiento" => { ultima_fecha = sqlx::query!("SELECT MAX(DATE(fecha_fin)) as f FROM historial_rutinas").fetch_one(&pool).await.ok().and_then(|row| row.f); },
            _ => {}
        }

        let mut alerta = false;
        let mut transcurridos = -1;

        if let Some(fecha) = ultima_fecha {
            transcurridos = (hoy - fecha).num_days() as i32;
            if transcurridos >= r.dias { alerta = true; }
        } else {
            alerta = true; // Si no hay registros previos, salta la alerta
        }

        resultados.push(Recordatorio {
            clave: r.clave, nombre: r.nombre, descripcion: r.descripcion, dias: r.dias, entidad: r.entidad,
            alerta: Some(alerta), dias_transcurridos: Some(transcurridos),
        });
    }
    Ok(Json(resultados))
}

pub async fn create_recordatorio(State(pool): State<PgPool>, Json(payload): Json<Recordatorio>) -> Result<Json<()>, String> {
    sqlx::query!("INSERT INTO recordatorios (clave, nombre, descripcion, dias, entidad) VALUES ($1, $2, $3, $4, $5)",
        payload.clave, payload.nombre, payload.descripcion, payload.dias, payload.entidad)
        .execute(&pool).await.map_err(|e| e.to_string())?;
    Ok(Json(()))
}

pub async fn update_recordatorio(Path(clave): Path<String>, State(pool): State<PgPool>, Json(payload): Json<Recordatorio>) -> Result<Json<()>, String> {
    sqlx::query!("UPDATE recordatorios SET nombre = $1, descripcion = $2, dias = $3, entidad = $4 WHERE clave = $5",
        payload.nombre, payload.descripcion, payload.dias, payload.entidad, clave)
        .execute(&pool).await.map_err(|e| e.to_string())?;
    Ok(Json(()))
}

pub async fn delete_recordatorio(Path(clave): Path<String>, State(pool): State<PgPool>) -> Result<Json<()>, String> {
    sqlx::query!("DELETE FROM recordatorios WHERE clave = $1", clave).execute(&pool).await.map_err(|e| e.to_string())?;
    Ok(Json(()))
}