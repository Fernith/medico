use sqlx::PgPool;
use tokio_cron_scheduler::{Job, JobScheduler};
use crate::services;

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
        }).unwrap();

        scheduler.add(job).await.unwrap();
        scheduler.start().await.unwrap();
    });
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

    if planes.is_empty() { return; }

    // 2. Límite de tiempo: Final del día de hoy en España
    let offset_spain = chrono::Duration::hours(2);
    let now_spain = chrono::Utc::now() + offset_spain;
    let fin_hoy_spain = now_spain.date_naive().and_hms_opt(23, 59, 59).unwrap();
    let limit_utc = fin_hoy_spain.and_utc() - offset_spain;

    for plan in planes {
        // Traducción de la Frecuencia a horas matemáticas
        let horas = match plan.frecuencia.as_str() {
            "Cada 6 horas" => 6,
            "Cada 8 horas" => 8,
            "Cada 12 horas" => 12,
            "Diaria" => 24,
            "Semanal" => 168,
            _ => 24, // Fallback por seguridad
        };

        // 3. Buscar la última toma para ESTE medicamento generada DESPUÉS del inicio del plan
        let last_toma = sqlx::query!(
            r#"
            SELECT MAX(fecha_hora) as max_fecha 
            FROM historial_medicacion 
            WHERE medicamento_id = $1 AND fecha_hora >= $2
            "#,
            plan.medicamento_id, plan.fecha_inicio
        ).fetch_one(pool).await.ok().and_then(|r| r.max_fecha);

        // Si hay una última toma, le sumamos la frecuencia. Si no, empezamos desde fecha_inicio
        let mut next_dose = match last_toma {
            Some(last) => last + chrono::Duration::hours(horas),
            None => plan.fecha_inicio,
        };

        let mut plan_finished = false;
        let mut insertadas = 0;

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

            if res.is_ok() { insertadas += 1; }

            // Avanzamos el reloj para la siguiente iteración
            next_dose += chrono::Duration::hours(horas);
        }

        if insertadas > 0 {
            println!("   💊 [Medicación] Generadas {} tomas futuras para el plan: {}", insertadas, plan.id);
        }

        // 5. Apagado automático del plan si la fecha caducó
        if plan_finished || (plan.fecha_fin.is_some() && chrono::Utc::now() > plan.fecha_fin.unwrap()) {
            sqlx::query!("UPDATE medicacion_activa SET activo = false WHERE id = $1", plan.id).execute(pool).await.ok();
            println!("   🛑 [Medicación] El plan {} ha llegado a su fecha de fin y se ha desactivado.", plan.id);
        }
    }
}