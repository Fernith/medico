use sqlx::PgPool;
use tokio_cron_scheduler::{Job, JobScheduler};
use crate::services;

pub async fn iniciar_tareas_de_fondo(pool: PgPool) {
    let pool_servidor = pool.clone();
    let pool_cron = pool.clone();

    // 1. Disparador Inicial (Se ejecuta al arrancar el servidor)
    tokio::spawn(async move {
        println!("[Iniciación] Comprobando actualizaciones en Google Fit...");
        match services::google_fit::sync_sleep_data(&pool_servidor).await {
            Ok(_) => println!("[Iniciación] Datos sincronizados correctamente al arrancar."),
            Err(e) => eprintln!("[Iniciación Alert] Fallo al sincronizar en arranque: {}", e),
        }
    });

    // 2. Cron Diario (Planificado para ejecutarse a las 12:00 AM)
    tokio::spawn(async move {
        let scheduler = JobScheduler::new().await.unwrap();
        let job = Job::new_async("0 0 0 * * *", move |_uuid, _lock| {
            let pool = pool_cron.clone();
            Box::pin(async move {
                println!("[Cron 12 AM] Iniciando tarea planificada de sueño...");
                let _ = services::google_fit::sync_sleep_data(&pool).await;
            })
        }).unwrap();

        scheduler.add(job).await.unwrap();
        scheduler.start().await.unwrap();
    });
}