use crate::error::AppError;
use crate::models::sintomas::{CrearOcurrenciaPayload, Sintoma, OcurrenciaSintoma};
use axum::{extract::State, Json};
use sqlx::PgPool;
use sqlx::types::Json as SqlxJson;

// Obtener el catálogo maestro de síntomas (para el combo final)
pub async fn get_sintomas(State(pool): State<PgPool>) -> Result<Json<Vec<Sintoma>>, AppError> {
    let result = sqlx::query_as::<_, Sintoma>(
        "SELECT id, nombre, categoria, regla_medicion FROM sintomas ORDER BY nombre ASC",
    )
    .fetch_all(&pool)
    .await?;

    Ok(Json(result))
}

// Crear una nueva ocurrencia de síntoma
pub async fn crear_ocurrencia(
    State(pool): State<PgPool>,
    Json(payload): Json<CrearOcurrenciaPayload>,
) -> Result<Json<OcurrenciaSintoma>, AppError> {
    let mut tx = pool.begin().await?;

    let modificadores_json = SqlxJson(payload.modificadores);

    let ocurrencia = sqlx::query_as::<_, OcurrenciaSintoma>(
        r#"
        INSERT INTO ocurrencias_sintomas 
        (sintoma_id, fecha_inicio, valor_registro, notas, caracteristica, frecuencia, modificadores)
        VALUES ($1, $2, $3, $4, $5, $6, $7)
        RETURNING *
        "#,
    )
    .bind(payload.sintoma_id)
    .bind(payload.fecha_inicio)
    .bind(payload.valor_registro)
    .bind(payload.notas)
    .bind(payload.caracteristica)
    .bind(payload.frecuencia)
    .bind(modificadores_json)
    .fetch_one(&mut *tx)
    .await?;

    for loc in payload.localizaciones {
        sqlx::query(
            r#"
            INSERT INTO ocurrencia_localizaciones 
            (ocurrencia_id, localizacion_id, es_irradiado, lado)
            VALUES ($1, $2, $3, $4)
            "#,
        )
        .bind(ocurrencia.id)
        .bind(loc.localizacion_id)
        .bind(loc.es_irradiado)
        .bind(loc.lado)
        .execute(&mut *tx)
        .await?;
    }

    tx.commit().await?;

    Ok(Json(ocurrencia))
}
