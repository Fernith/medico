use crate::error::AppError;
use crate::models::habito::{HabitoToxico, ItemHabitoPayload};
use axum::{extract::State, http::StatusCode, Json};
use sqlx::PgPool;

pub async fn get_habitos(State(pool): State<PgPool>) -> Result<Json<Vec<HabitoToxico>>, AppError> {
    let registros = sqlx::query_as::<_, HabitoToxico>(
        r#"
        SELECT id, clave, nombre, categoria,
               estado::text as estado,
               frecuencia::text as frecuencia,
               cantidad, notas
        FROM habitos_toxicos
        ORDER BY
            CASE WHEN categoria = 'habito' THEN 1 ELSE 2 END,
            CASE
                WHEN clave = 'cafeina' THEN 1
                WHEN clave = 'bebidas_energeticas' THEN 2
                WHEN clave = 'tabaco' THEN 3
                WHEN clave = 'vapeo' THEN 4
                WHEN clave = 'alcohol' THEN 5
                WHEN clave = 'cannabis' THEN 6
                WHEN clave = 'otras_sustancias' THEN 7
                ELSE 8
            END,
            nombre ASC
        "#,
    )
    .fetch_all(&pool)
    .await?;

    Ok(Json(registros))
}

pub async fn guardar_habitos(
    State(pool): State<PgPool>,
    Json(payload): Json<Vec<ItemHabitoPayload>>,
) -> Result<StatusCode, AppError> {
    let mut tx = pool.begin().await?;

    for item in payload {
        sqlx::query(
            r#"
            INSERT INTO habitos_toxicos (clave, nombre, categoria, estado, frecuencia, cantidad, notas, updated_at)
            VALUES ($1, $2, $3, $4::estado_consumo_habito_enum, $5::frecuencia_consumo_enum, $6, $7, now())
            ON CONFLICT (clave) DO UPDATE
            SET estado = EXCLUDED.estado,
                frecuencia = EXCLUDED.frecuencia,
                cantidad = EXCLUDED.cantidad,
                notas = EXCLUDED.notas,
                updated_at = now()
            "#,
        )
        .bind(item.clave)
        .bind(item.nombre)
        .bind(item.categoria)
        .bind(item.estado)
        .bind(item.frecuencia)
        .bind(item.cantidad)
        .bind(item.notas)
        .execute(&mut *tx)
        .await?;
    }

    tx.commit().await?;

    Ok(StatusCode::OK)
}

