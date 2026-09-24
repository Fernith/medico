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

pub async fn listar_ocurrencias(
    State(pool): State<PgPool>,
) -> Result<Json<Vec<crate::models::sintomas::OcurrenciaDetalleDTO>>, AppError> {
    let query = r#"
        SELECT 
            o.*,
            s.nombre as sintoma_nombre,
            COALESCE(
                (
                    SELECT jsonb_agg(
                        jsonb_build_object(
                            'localizacion_id', l.localizacion_id,
                            'es_irradiado', l.es_irradiado,
                            'lado', l.lado
                        )
                    )
                    FROM ocurrencia_localizaciones l
                    WHERE l.ocurrencia_id = o.id
                ),
                '[]'::jsonb
            ) as localizaciones
        FROM ocurrencias_sintomas o
        JOIN sintomas s ON s.id = o.sintoma_id
        ORDER BY o.fecha_inicio DESC
    "#;

    let result = sqlx::query_as::<_, crate::models::sintomas::OcurrenciaDetalleDTO>(query)
        .fetch_all(&pool)
        .await?;

    Ok(Json(result))
}

pub async fn borrar_ocurrencia(
    State(pool): State<PgPool>,
    axum::extract::Path(id): axum::extract::Path<uuid::Uuid>,
) -> Result<Json<serde_json::Value>, AppError> {
    // Las localizaciones se borran en cascada si hay ON DELETE CASCADE.
    // Si no lo hay, borramos explícitamente primero.
    sqlx::query("DELETE FROM ocurrencia_localizaciones WHERE ocurrencia_id = $1")
        .bind(id)
        .execute(&pool)
        .await?;

    let res = sqlx::query("DELETE FROM ocurrencias_sintomas WHERE id = $1")
        .bind(id)
        .execute(&pool)
        .await?;

    if res.rows_affected() == 0 {
        return Err(AppError::NotFound("Ocurrencia no encontrada".into()));
    }

    Ok(Json(serde_json::json!({ "msg": "Borrado correcto" })))
}

pub async fn actualizar_ocurrencia(
    State(pool): State<PgPool>,
    axum::extract::Path(id): axum::extract::Path<uuid::Uuid>,
    Json(payload): Json<CrearOcurrenciaPayload>,
) -> Result<Json<serde_json::Value>, AppError> {
    let mut tx = pool.begin().await?;

    // Modificadores a JSONB
    let modificadores_json = match serde_json::to_value(&payload.modificadores) {
        Ok(v) => v,
        Err(_) => return Err(AppError::Internal("Error serializando modificadores".into())),
    };

    let res = sqlx::query(
        r#"
        UPDATE ocurrencias_sintomas
        SET sintoma_id = $1, fecha_inicio = $2, valor_registro = $3, notas = $4,
            caracteristica = $5, frecuencia = $6, modificadores = $7, created_at = NOW()
        WHERE id = $8
        "#
    )
    .bind(payload.sintoma_id)
    .bind(payload.fecha_inicio)
    .bind(payload.valor_registro)
    .bind(payload.notas)
    .bind(payload.caracteristica)
    .bind(payload.frecuencia)
    .bind(modificadores_json)
    .bind(id)
    .execute(&mut *tx)
    .await?;

    if res.rows_affected() == 0 {
        tx.rollback().await?;
        return Err(AppError::NotFound("Ocurrencia no encontrada".into()));
    }

    // Actualizar localizaciones
    sqlx::query("DELETE FROM ocurrencia_localizaciones WHERE ocurrencia_id = $1")
        .bind(id)
        .execute(&mut *tx)
        .await?;

    for loc in payload.localizaciones {
        sqlx::query(
            r#"
            INSERT INTO ocurrencia_localizaciones (ocurrencia_id, localizacion_id, es_irradiado, lado)
            VALUES ($1, $2, $3, $4)
            "#
        )
        .bind(id)
        .bind(loc.localizacion_id)
        .bind(loc.es_irradiado)
        .bind(loc.lado)
        .execute(&mut *tx)
        .await?;
    }

    tx.commit().await?;

    Ok(Json(serde_json::json!({ "msg": "Actualizado correctamente" })))
}
