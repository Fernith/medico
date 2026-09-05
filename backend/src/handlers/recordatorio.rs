use axum::{extract::{Path, State}, Json};
use sqlx::PgPool;
use chrono::{Local, NaiveDate};
use crate::models::recordatorio::Recordatorio;

pub async fn get_recordatorios(State(pool): State<PgPool>) -> Result<Json<Vec<Recordatorio>>, String> {
    let recs = sqlx::query!("SELECT clave, nombre, descripcion, dias, entidad, proxima_fecha FROM recordatorios")
        .fetch_all(&pool).await.map_err(|e| e.to_string())?;

    let mut resultados = Vec::new();
    let hoy = Local::now().naive_local().date();

    for r in recs {
        let mut dias_extra = 0;
        let mut alerta = false;

        if r.entidad == "fecha" {
            if let Some(pf) = r.proxima_fecha {
                dias_extra = (hoy - pf).num_days() as i32;
                if dias_extra >= 0 { alerta = true; }
            } else {
                alerta = true;
            }
        } else {
            let mut ultima_fecha: Option<NaiveDate> = None;
            match r.entidad.as_str() {
                "peso" => { ultima_fecha = sqlx::query!("SELECT MAX(fecha) as f FROM pesos").fetch_one(&pool).await.ok().and_then(|row| row.f); },
                "medicion" => { ultima_fecha = sqlx::query!("SELECT MAX(fecha) as f FROM medicion").fetch_one(&pool).await.ok().and_then(|row| row.f); },
                "pasos" => { ultima_fecha = sqlx::query!("SELECT MAX(fecha) as f FROM pasos").fetch_one(&pool).await.ok().and_then(|row| row.f); },
                "sueno" => { ultima_fecha = sqlx::query!("SELECT MAX(fecha) as f FROM sueno").fetch_one(&pool).await.ok().and_then(|row| row.f); },
                "entrenamiento" => { ultima_fecha = sqlx::query!("SELECT MAX(DATE(fecha_fin)) as f FROM historial_rutinas").fetch_one(&pool).await.ok().and_then(|row| row.f); },
                _ => {}
            }

            if let Some(fecha) = ultima_fecha {
                let transcurridos = (hoy - fecha).num_days() as i32;
                dias_extra = transcurridos - r.dias;
                if dias_extra >= 0 { alerta = true; }
            } else {
                dias_extra = 999;
                alerta = true;
            }
        }

        resultados.push(Recordatorio {
            clave: r.clave, nombre: r.nombre, descripcion: r.descripcion, dias: r.dias, entidad: r.entidad,
            proxima_fecha: r.proxima_fecha,
            alerta: Some(alerta), dias_extra: Some(dias_extra),
        });
    }
    Ok(Json(resultados))
}

pub async fn create_recordatorio(State(pool): State<PgPool>, Json(payload): Json<Recordatorio>) -> Result<Json<()>, String> {
    sqlx::query!("INSERT INTO recordatorios (clave, nombre, descripcion, dias, entidad, proxima_fecha) VALUES ($1, $2, $3, $4, $5, $6)",
        payload.clave, payload.nombre, payload.descripcion, payload.dias, payload.entidad, payload.proxima_fecha)
        .execute(&pool).await.map_err(|e| e.to_string())?;
    Ok(Json(()))
}

pub async fn update_recordatorio(Path(clave): Path<String>, State(pool): State<PgPool>, Json(payload): Json<Recordatorio>) -> Result<Json<()>, String> {
    sqlx::query!("UPDATE recordatorios SET nombre = $1, descripcion = $2, dias = $3, entidad = $4, proxima_fecha = $5 WHERE clave = $6",
        payload.nombre, payload.descripcion, payload.dias, payload.entidad, payload.proxima_fecha, clave)
        .execute(&pool).await.map_err(|e| e.to_string())?;
    Ok(Json(()))
}

pub async fn delete_recordatorio(Path(clave): Path<String>, State(pool): State<PgPool>) -> Result<Json<()>, String> {
    sqlx::query!("DELETE FROM recordatorios WHERE clave = $1", clave).execute(&pool).await.map_err(|e| e.to_string())?;
    Ok(Json(()))
}

// NUEVO ENDPOINT: Posponer recordatorio de fecha sumando X días desde hoy
pub async fn posponer_recordatorio(Path(clave): Path<String>, State(pool): State<PgPool>) -> Result<Json<()>, String> {
    let hoy = Local::now().naive_local().date();
    let rec = sqlx::query!("SELECT dias FROM recordatorios WHERE clave = $1", clave.clone()).fetch_one(&pool).await.map_err(|e| e.to_string())?;
    let nueva_fecha = hoy + chrono::Duration::days(rec.dias as i64);
    
    sqlx::query!("UPDATE recordatorios SET proxima_fecha = $1 WHERE clave = $2", nueva_fecha, clave)
        .execute(&pool).await.map_err(|e| e.to_string())?;
    Ok(Json(()))
}