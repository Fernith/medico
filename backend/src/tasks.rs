use crate::services;
use sqlx::PgPool;
use tokio_cron_scheduler::{Job, JobScheduler};

pub async fn iniciar_tareas_de_fondo(pool: PgPool) {
    let pool_servidor = pool.clone();
    let pool_cron = pool.clone();

    // 1. Disparador Inicial (Se ejecuta al arrancar el servidor)
    tokio::spawn(async move {
        println!("[Iniciación] Comprobando actualizaciones de Google Fit y Medicación...");

        // 1º Ejecutamos el generador de tomas en el encendido
        generar_tomas_pendientes(&pool_servidor).await;

        // 2º Sincronizamos con Google Fit
        let _ = services::google_fit::sync_data(&pool_servidor).await;
    });

    // 2. Cron Diario (Planificado para ejecutarse a las 12:00 AM)
    tokio::spawn(async move {
        let scheduler = JobScheduler::new().await.unwrap();
        let job = Job::new_async("0 0 0 * * *", move |_uuid, _lock| {
            let pool = pool_cron.clone();
            Box::pin(async move {
                println!("[Cron 12 AM] Iniciando tareas planificadas...");

                // 1º Ejecutamos el generador de tomas a medianoche
                generar_tomas_pendientes(&pool).await;

                // 2º Sincronizamos con Google Fit
                let _ = services::google_fit::sync_data(&pool).await;
            })
        })
        .unwrap();

        scheduler.add(job).await.unwrap();
        scheduler.start().await.unwrap();
    });
}

pub fn frecuencia_a_horas(frecuencia: &str) -> Option<i64> {
    match frecuencia {
        "Cada 6 horas" => Some(6),
        "Cada 8 horas" => Some(8),
        "Cada 12 horas" => Some(12),
        "Diaria" => Some(24),
        "Semanal" => Some(168),
        _ => None,
    }
}

pub fn obtener_limites_hoy_utc() -> (chrono::DateTime<chrono::Utc>, chrono::DateTime<chrono::Utc>) {
    let offset_spain = chrono::Duration::hours(2);
    let now_spain = chrono::Utc::now() + offset_spain;
    let fecha_hoy = now_spain.date_naive();

    let inicio_spain = fecha_hoy.and_hms_opt(0, 0, 0).unwrap_or_default();
    let fin_spain = fecha_hoy.and_hms_opt(23, 59, 59).unwrap_or_default();

    (
        inicio_spain.and_utc() - offset_spain,
        fin_spain.and_utc() - offset_spain,
    )
}

pub async fn regenerar_tomas_hoy(
    pool: &PgPool,
    medicamento_id: uuid::Uuid,
    frecuencia: &str,
    cantidad: f64,
    fecha_inicio: Option<chrono::DateTime<chrono::Utc>>,
    fecha_fin: Option<chrono::DateTime<chrono::Utc>>,
) {
    let (inicio_hoy_utc, fin_hoy_utc) = obtener_limites_hoy_utc();

    let _ = sqlx::query(
        "DELETE FROM historial_medicacion WHERE medicamento_id = $1 AND fecha_hora >= $2",
    )
    .bind(medicamento_id)
    .bind(inicio_hoy_utc)
    .execute(pool)
    .await;

    if frecuencia == "Segun necesidad" {
        return;
    }

    let Some(horas) = frecuencia_a_horas(frecuencia) else {
        return;
    };

    let Some(inicio) = fecha_inicio else {
        return;
    };

    if inicio > fin_hoy_utc {
        return;
    }

    let mut next_dose = if inicio >= inicio_hoy_utc {
        inicio
    } else {
        let offset_spain = chrono::Duration::hours(2);
        let inicio_spain = inicio + offset_spain;
        let hoy_spain = (chrono::Utc::now() + offset_spain).date_naive();
        let ancla_spain = hoy_spain.and_time(inicio_spain.time());
        let mut candidato = ancla_spain.and_utc() - offset_spain;

        let paso = chrono::Duration::hours(horas);
        let min_permitido = if inicio > inicio_hoy_utc {
            inicio
        } else {
            inicio_hoy_utc
        };

        while candidato - paso >= min_permitido {
            candidato -= paso;
        }
        while candidato < min_permitido {
            candidato += paso;
        }
        candidato
    };

    while next_dose <= fin_hoy_utc {
        if let Some(fin) = fecha_fin {
            if next_dose > fin {
                break;
            }
        }

        let _ = sqlx::query(
            "INSERT INTO historial_medicacion (medicamento_id, fecha_hora, cantidad_tomada, pendiente) VALUES ($1, $2, $3::float8, true)",
        )
        .bind(medicamento_id)
        .bind(next_dose)
        .bind(cantidad)
        .execute(pool)
        .await;

        next_dose += chrono::Duration::hours(horas);
    }
}

pub async fn rellenar_tomas_plan_creado(
    pool: &PgPool,
    medicamento_id: uuid::Uuid,
    frecuencia: &str,
    cantidad: f64,
    fecha_inicio: Option<chrono::DateTime<chrono::Utc>>,
    fecha_fin: Option<chrono::DateTime<chrono::Utc>>,
) {
    if frecuencia == "Segun necesidad" {
        return;
    }

    let Some(horas) = frecuencia_a_horas(frecuencia) else {
        return;
    };

    let Some(inicio) = fecha_inicio else {
        return;
    };

    let (_, limit_utc) = obtener_limites_hoy_utc();
    let mut dose = inicio;

    while dose <= limit_utc {
        if let Some(fin) = fecha_fin {
            if dose > fin {
                break;
            }
        }

        let margen_inicio = dose - chrono::Duration::minutes(1);
        let margen_fin = dose + chrono::Duration::minutes(1);

        let existe: Option<bool> = sqlx::query_scalar(
            "SELECT EXISTS(SELECT 1 FROM historial_medicacion WHERE medicamento_id = $1 AND fecha_hora >= $2 AND fecha_hora <= $3)",
        )
        .bind(medicamento_id)
        .bind(margen_inicio)
        .bind(margen_fin)
        .fetch_one(pool)
        .await
        .ok();

        if existe == Some(false) {
            let _ = sqlx::query(
                "INSERT INTO historial_medicacion (medicamento_id, fecha_hora, cantidad_tomada, pendiente) VALUES ($1, $2, $3::float8, true)",
            )
            .bind(medicamento_id)
            .bind(dose)
            .bind(cantidad)
            .execute(pool)
            .await;
        }

        dose += chrono::Duration::hours(horas);
    }
}

// ========================================================
// MOTOR LÓGICO DE GENERACIÓN DE TOMAS DE MEDICACIÓN
// ========================================================
pub async fn generar_tomas_pendientes(pool: &PgPool) {
    // 1. Obtener todas las planificaciones activas
    let planes = match sqlx::query!(
        r#"
        SELECT id, medicamento_id, frecuencia::text as "frecuencia!", cantidad::float8 as "cantidad!", fecha_inicio, fecha_fin 
        FROM medicacion_activa 
        WHERE activo = true
        "#
    ).fetch_all(pool).await {
        Ok(p) => p,
        Err(e) => { eprintln!("❌ [Medicación] Error al obtener planes activos: {}", e); return; }
    };

    if planes.is_empty() {
        return;
    }

    // 2. Límite de tiempo: Final del día de hoy en España
    let (_, limit_utc) = obtener_limites_hoy_utc();

    for plan in planes {
        // Las pautas a demanda / según necesidad no generan tomas programadas en el calendario
        if plan.frecuencia == "Segun necesidad" {
            continue;
        }

        let Some(fecha_inicio) = plan.fecha_inicio else {
            continue;
        };

        // Traducción de la Frecuencia a horas matemáticas
        let Some(horas) = frecuencia_a_horas(plan.frecuencia.as_str()) else {
            continue;
        };

        // 2.5 Si se adelantó fecha_inicio, rellenar el hueco previo a la primera toma existente
        let first_toma: Option<chrono::DateTime<chrono::Utc>> = sqlx::query_scalar(
            "SELECT MIN(fecha_hora) FROM historial_medicacion WHERE medicamento_id = $1 AND fecha_hora >= $2",
        )
        .bind(plan.medicamento_id)
        .bind(fecha_inicio)
        .fetch_one(pool)
        .await
        .ok()
        .flatten();

        let mut insertadas = 0;

        if let Some(first) = first_toma {
            let mut prev_dose = fecha_inicio;
            while prev_dose + chrono::Duration::minutes(1) < first && prev_dose <= limit_utc {
                if let Some(fin) = plan.fecha_fin {
                    if prev_dose > fin {
                        break;
                    }
                }

                let res = sqlx::query(
                    "INSERT INTO historial_medicacion (medicamento_id, fecha_hora, cantidad_tomada, pendiente) VALUES ($1, $2, $3::float8, true)",
                )
                .bind(plan.medicamento_id)
                .bind(prev_dose)
                .bind(plan.cantidad)
                .execute(pool)
                .await;

                if res.is_ok() {
                    insertadas += 1;
                }

                prev_dose += chrono::Duration::hours(horas);
            }
        }

        // 3. Buscar la última toma para ESTE medicamento generada DESPUÉS del inicio del plan
        let last_toma = sqlx::query!(
            r#"
            SELECT MAX(fecha_hora) as max_fecha 
            FROM historial_medicacion 
            WHERE medicamento_id = $1 AND fecha_hora >= $2
            "#,
            plan.medicamento_id,
            fecha_inicio
        )
        .fetch_one(pool)
        .await
        .ok()
        .and_then(|r| r.max_fecha);

        // Si hay una última toma, le sumamos la frecuencia. Si no, empezamos desde fecha_inicio
        let mut next_dose = match last_toma {
            Some(last) => last + chrono::Duration::hours(horas),
            None => fecha_inicio,
        };

        let mut plan_finished = false;

        // 4. Bucle generador: Proyectar tomas futuras hasta el límite de hoy
        while next_dose <= limit_utc {
            // Si tiene fecha fin y nos pasamos, paramos la generación
            if let Some(fin) = plan.fecha_fin {
                if next_dose > fin {
                    plan_finished = true;
                    break;
                }
            }

            // Insertamos la toma FUTURA como PENDIENTE
            let res = sqlx::query!(
                "INSERT INTO historial_medicacion (medicamento_id, fecha_hora, cantidad_tomada, pendiente) VALUES ($1, $2, $3::float8, true)",
                plan.medicamento_id, next_dose, plan.cantidad
            ).execute(pool).await;

            if res.is_ok() {
                insertadas += 1;
            }

            // Avanzamos el reloj para la siguiente iteración
            next_dose += chrono::Duration::hours(horas);
        }

        if insertadas > 0 {
            println!(
                "   💊 [Medicación] Generadas {} tomas futuras para el plan: {}",
                insertadas, plan.id
            );
        }

        // 5. Apagado automático del plan si la fecha caducó
        let ha_caducado = plan.fecha_fin.map_or(false, |fin| chrono::Utc::now() > fin);
        if plan_finished || ha_caducado {
            sqlx::query!(
                "UPDATE medicacion_activa SET activo = false WHERE id = $1",
                plan.id
            )
            .execute(pool)
            .await
            .ok();
            println!(
                "   🛑 [Medicación] El plan {} ha llegado a su fecha de fin y se ha desactivado.",
                plan.id
            );
        }
    }
}
