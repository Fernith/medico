use crate::error::AppError;
use axum::{
    extract::{Path, State},
    Json,
};
use sqlx::PgPool;
use uuid::Uuid;

use crate::models::medicamento::{
    CategoriaMedicamento, CategoriaMedicamentoPayload, HistorialMedicacion,
    HistorialMedicacionPayload, MedicacionActiva, MedicacionActivaPayload, Medicamento,
    MedicamentoPayload, RangoFechasQuery, UnidadDosis, UnidadDosisPayload,
};

// ==========================================
// CATEGORÍAS
// ==========================================
pub async fn get_categorias(
    State(pool): State<PgPool>,
) -> Result<Json<Vec<CategoriaMedicamento>>, AppError> {
    let categorias = sqlx::query_as!(
        CategoriaMedicamento,
        "SELECT id, nombre, color FROM categoria_medicamento ORDER BY nombre"
    )
    .fetch_all(&pool)
    .await?;
    Ok(Json(categorias))
}

pub async fn create_categoria(
    State(pool): State<PgPool>,
    Json(payload): Json<CategoriaMedicamentoPayload>,
) -> Result<Json<CategoriaMedicamento>, AppError> {
    let registro = sqlx::query_as!(
        CategoriaMedicamento,
        "INSERT INTO categoria_medicamento (nombre, color) VALUES ($1, $2) RETURNING id, nombre, color",
        payload.nombre, payload.color
    ).fetch_one(&pool).await?;
    Ok(Json(registro))
}

pub async fn delete_categoria(
    Path(id): Path<Uuid>,
    State(pool): State<PgPool>,
) -> Result<Json<()>, AppError> {
    sqlx::query!("DELETE FROM categoria_medicamento WHERE id=$1", id)
        .execute(&pool)
        .await?;
    Ok(Json(()))
}

// ==========================================
// MEDICAMENTOS
// ==========================================
pub async fn get_medicamentos(
    State(pool): State<PgPool>,
) -> Result<Json<Vec<Medicamento>>, AppError> {
    let medicamentos = sqlx::query_as!(
        Medicamento,
        r#"
        SELECT 
            m.id, m.nombre, m.categoria_id, c.nombre as "categoria_nombre?",
            m.formato::text as "formato!", m.dosis::float8 as "dosis!", 
            m.unidad_dosis, m.notas
        FROM medicamento m
        LEFT JOIN categoria_medicamento c ON m.categoria_id = c.id
        ORDER BY m.nombre
        "#
    )
    .fetch_all(&pool)
    .await?;
    Ok(Json(medicamentos))
}

pub async fn create_medicamento(
    State(pool): State<PgPool>,
    Json(payload): Json<MedicamentoPayload>,
) -> Result<Json<()>, AppError> {
    sqlx::query!(
        "INSERT INTO medicamento (nombre, categoria_id, formato, dosis, unidad_dosis, notas) VALUES ($1, $2, $3::text::formato_medicamento, $4::float8, $5, $6)",
        payload.nombre, payload.categoria_id, payload.formato, payload.dosis, payload.unidad_dosis, payload.notas
    ).execute(&pool).await?;
    Ok(Json(()))
}

pub async fn update_medicamento(
    Path(id): Path<Uuid>,
    State(pool): State<PgPool>,
    Json(payload): Json<MedicamentoPayload>,
) -> Result<Json<()>, AppError> {
    sqlx::query!(
        "UPDATE medicamento SET nombre=$1, categoria_id=$2, formato=$3::text::formato_medicamento, dosis=$4::float8, unidad_dosis=$5, notas=$6 WHERE id=$7",
        payload.nombre, payload.categoria_id, payload.formato, payload.dosis, payload.unidad_dosis, payload.notas, id
    ).execute(&pool).await?;
    Ok(Json(()))
}

pub async fn delete_medicamento(
    Path(id): Path<Uuid>,
    State(pool): State<PgPool>,
) -> Result<Json<()>, AppError> {
    sqlx::query!("DELETE FROM medicamento WHERE id=$1", id)
        .execute(&pool)
        .await?;
    Ok(Json(()))
}

// ==========================================
// MEDICACIÓN ACTIVA
// ==========================================
pub async fn get_medicaciones_activas(
    State(pool): State<PgPool>,
) -> Result<Json<Vec<MedicacionActiva>>, AppError> {
    // 🔥 DISPARADOR LAZY GENERATION: Generamos tomas pendientes antes de devolver los datos
    crate::tasks::generar_tomas_pendientes(&pool).await;

    let activas = sqlx::query_as!(
        MedicacionActiva,
        r#"
        SELECT 
            ma.id, ma.medicamento_id, m.nombre as "medicamento_nombre!",
            m.formato::text as "formato!", m.unidad_dosis as "unidad_dosis!",
            ma.frecuencia::text as "frecuencia!", ma.cantidad::float8 as "cantidad!",
            ma.fecha_inicio, ma.fecha_fin, ma.anotaciones, ma.activo
        FROM medicacion_activa ma
        JOIN medicamento m ON ma.medicamento_id = m.id
        ORDER BY ma.activo DESC, ma.fecha_inicio DESC NULLS LAST
        "#
    )
    .fetch_all(&pool)
    .await?;
    Ok(Json(activas))
}

pub async fn create_medicacion_activa(
    State(pool): State<PgPool>,
    Json(payload): Json<MedicacionActivaPayload>,
) -> Result<Json<()>, AppError> {
    if let Some(inicio) = payload.fecha_inicio {
        sqlx::query(
            "DELETE FROM historial_medicacion WHERE medicamento_id = $1 AND fecha_hora >= $2 AND ($3::timestamptz IS NULL OR fecha_hora <= $3) AND borrado = true",
        )
        .bind(payload.medicamento_id)
        .bind(inicio)
        .bind(payload.fecha_fin)
        .execute(&pool)
        .await?;
    }

    sqlx::query!(
        "INSERT INTO medicacion_activa (medicamento_id, frecuencia, cantidad, fecha_inicio, fecha_fin, anotaciones) VALUES ($1, $2::text::frecuencia_medicacion, $3::float8, $4, $5, $6)",
        payload.medicamento_id, payload.frecuencia, payload.cantidad, payload.fecha_inicio, payload.fecha_fin, payload.anotaciones
    ).execute(&pool).await?;

    crate::tasks::rellenar_tomas_plan_creado(
        &pool,
        payload.medicamento_id,
        &payload.frecuencia,
        payload.cantidad,
        payload.fecha_inicio,
        payload.fecha_fin,
    )
    .await;
    crate::tasks::generar_tomas_pendientes(&pool).await;

    Ok(Json(()))
}

pub async fn update_medicacion_activa(
    Path(id): Path<Uuid>,
    State(pool): State<PgPool>,
    Json(payload): Json<MedicacionActivaPayload>,
) -> Result<Json<()>, AppError> {
    #[derive(sqlx::FromRow)]
    struct EstadoPrevioMedicacionActiva {
        medicamento_id: Uuid,
        frecuencia: String,
        cantidad: f64,
        fecha_inicio: Option<chrono::DateTime<chrono::Utc>>,
        fecha_fin: Option<chrono::DateTime<chrono::Utc>>,
        activo: bool,
    }

    let previo = sqlx::query_as::<_, EstadoPrevioMedicacionActiva>(
        r#"
        SELECT medicamento_id, frecuencia::text as frecuencia, cantidad::float8 as cantidad, fecha_inicio, fecha_fin, activo
        FROM medicacion_activa
        WHERE id = $1
        "#,
    )
    .bind(id)
    .fetch_optional(&pool)
    .await?;

    sqlx::query!(
        "UPDATE medicacion_activa SET medicamento_id=$1, frecuencia=$2::text::frecuencia_medicacion, cantidad=$3::float8, fecha_inicio=$4, fecha_fin=$5, anotaciones=$6 WHERE id=$7",
        payload.medicamento_id, payload.frecuencia, payload.cantidad, payload.fecha_inicio, payload.fecha_fin, payload.anotaciones, id
    ).execute(&pool).await?;

    if let Some(old) = previo {
        let no_caducado = payload
            .fecha_fin
            .map_or(true, |fin| chrono::Utc::now() <= fin);
        if old.fecha_fin != payload.fecha_fin && no_caducado && !old.activo {
            sqlx::query("UPDATE medicacion_activa SET activo = true WHERE id = $1")
                .bind(id)
                .execute(&pool)
                .await?;
        }

        if old.medicamento_id != payload.medicamento_id {
            sqlx::query(
                "DELETE FROM historial_medicacion WHERE medicamento_id = $1 AND ($2::timestamptz IS NULL OR fecha_hora >= $2) AND ($3::timestamptz IS NULL OR fecha_hora <= $3) AND (pendiente = true OR borrado = true)",
            )
            .bind(old.medicamento_id)
            .bind(old.fecha_inicio)
            .bind(old.fecha_fin)
            .execute(&pool)
            .await?;
        }

        // 1. Modificación de fecha_inicio o fecha_fin: eliminar físicamente las que queden fuera de rango
        if let Some(new_start) = payload.fecha_inicio {
            if let Some(old_start) = old.fecha_inicio {
                if new_start > old_start {
                    sqlx::query(
                        "DELETE FROM historial_medicacion WHERE medicamento_id = $1 AND fecha_hora >= $2 AND fecha_hora < $3",
                    )
                    .bind(payload.medicamento_id)
                    .bind(old_start)
                    .bind(new_start)
                    .execute(&pool)
                    .await?;
                }
            }

            sqlx::query(
                "UPDATE historial_medicacion SET borrado = false, pendiente = true WHERE medicamento_id = $1 AND fecha_hora >= $2 AND ($3::timestamptz IS NULL OR fecha_hora <= $3) AND borrado = true",
            )
            .bind(payload.medicamento_id)
            .bind(new_start)
            .bind(payload.fecha_fin)
            .execute(&pool)
            .await?;
        }

        if let Some(new_end) = payload.fecha_fin {
            let cota_inferior = match (old.fecha_inicio, payload.fecha_inicio) {
                (Some(a), Some(b)) => Some(if a < b { a } else { b }),
                (Some(a), None) => Some(a),
                (None, Some(b)) => Some(b),
                (None, None) => None,
            };

            sqlx::query(
                "DELETE FROM historial_medicacion WHERE medicamento_id = $1 AND fecha_hora > $2 AND ($3::timestamptz IS NULL OR fecha_hora >= $3)",
            )
            .bind(payload.medicamento_id)
            .bind(new_end)
            .bind(cota_inferior)
            .execute(&pool)
            .await?;
        }

        // 3. Modificación de frecuencia: regenerar solo el día de hoy
        if old.frecuencia != payload.frecuencia {
            crate::tasks::regenerar_tomas_hoy(
                &pool,
                payload.medicamento_id,
                &payload.frecuencia,
                payload.cantidad,
                payload.fecha_inicio,
                payload.fecha_fin,
            )
            .await;
        }

        // 2. Modificación de cantidad: actualizar las tomas de hoy y ponerlas como pendientes
        if (old.cantidad - payload.cantidad).abs() > f64::EPSILON {
            let (inicio_hoy_utc, fin_hoy_utc) = crate::tasks::obtener_limites_hoy_utc();
            sqlx::query(
                "UPDATE historial_medicacion SET cantidad_tomada = $1::float8, pendiente = true WHERE medicamento_id = $2 AND fecha_hora >= $3 AND fecha_hora <= $4 AND borrado = false",
            )
            .bind(payload.cantidad)
            .bind(payload.medicamento_id)
            .bind(inicio_hoy_utc)
            .bind(fin_hoy_utc)
            .execute(&pool)
            .await?;
        }
    }

    crate::tasks::generar_tomas_pendientes(&pool).await;

    Ok(Json(()))
}

pub async fn toggle_medicacion_activa(
    Path(id): Path<Uuid>,
    State(pool): State<PgPool>,
) -> Result<Json<()>, AppError> {
    sqlx::query!(
        "UPDATE medicacion_activa SET activo = NOT activo WHERE id=$1",
        id
    )
    .execute(&pool)
    .await?;

    crate::tasks::generar_tomas_pendientes(&pool).await;

    Ok(Json(()))
}

pub async fn delete_medicacion_activa(
    Path(id): Path<Uuid>,
    State(pool): State<PgPool>,
) -> Result<Json<()>, AppError> {
    #[derive(sqlx::FromRow)]
    struct PlanABorrar {
        medicamento_id: Uuid,
        fecha_inicio: Option<chrono::DateTime<chrono::Utc>>,
        fecha_fin: Option<chrono::DateTime<chrono::Utc>>,
    }

    if let Some(plan) = sqlx::query_as::<_, PlanABorrar>(
        "SELECT medicamento_id, fecha_inicio, fecha_fin FROM medicacion_activa WHERE id = $1",
    )
    .bind(id)
    .fetch_optional(&pool)
    .await?
    {
        sqlx::query(
            "DELETE FROM historial_medicacion WHERE medicamento_id = $1 AND ($2::timestamptz IS NULL OR fecha_hora >= $2) AND ($3::timestamptz IS NULL OR fecha_hora <= $3) AND (pendiente = true OR borrado = true)",
        )
        .bind(plan.medicamento_id)
        .bind(plan.fecha_inicio)
        .bind(plan.fecha_fin)
        .execute(&pool)
        .await?;
    }

    sqlx::query!("DELETE FROM medicacion_activa WHERE id=$1", id)
        .execute(&pool)
        .await?;
    Ok(Json(()))
}

// ==========================================
// HISTORIAL DE TOMAS
// ==========================================
pub async fn add_historial_medicacion(
    State(pool): State<PgPool>,
    Json(payload): Json<HistorialMedicacionPayload>,
) -> Result<Json<()>, AppError> {
    sqlx::query!(
        "INSERT INTO historial_medicacion (medicamento_id, fecha_hora, cantidad_tomada, pendiente) VALUES ($1, $2, $3::float8, $4)",
        payload.medicamento_id, payload.fecha_hora, payload.cantidad_tomada, payload.pendiente
    ).execute(&pool).await?;
    Ok(Json(()))
}

pub async fn get_historial(
    State(pool): State<PgPool>,
) -> Result<Json<Vec<HistorialMedicacion>>, AppError> {
    crate::tasks::generar_tomas_pendientes(&pool).await;

    let historial = sqlx::query_as!(
        HistorialMedicacion,
        r#"
        SELECT 
            h.id, h.medicamento_id, m.nombre as "medicamento_nombre!",
            c.nombre as "categoria_nombre?", c.color as "categoria_color?",
            m.formato::text as "formato!", m.dosis::float8 as "dosis_base!", m.unidad_dosis as "unidad_dosis!",
            h.fecha_hora, h.cantidad_tomada::float8 as "cantidad_tomada!", h.pendiente, h.borrado
        FROM historial_medicacion h
        JOIN medicamento m ON h.medicamento_id = m.id
        LEFT JOIN categoria_medicamento c ON m.categoria_id = c.id
        WHERE h.borrado = false
        ORDER BY h.fecha_hora DESC
        "#
    ).fetch_all(&pool).await?;
    Ok(Json(historial))
}

pub async fn update_historial_medicacion(
    Path(id): Path<Uuid>,
    State(pool): State<PgPool>,
    Json(payload): Json<HistorialMedicacionPayload>,
) -> Result<Json<()>, AppError> {
    sqlx::query!(
        "UPDATE historial_medicacion SET medicamento_id=$1, fecha_hora=$2, cantidad_tomada=$3::float8, pendiente=$4 WHERE id=$5",
        payload.medicamento_id, payload.fecha_hora, payload.cantidad_tomada, payload.pendiente, id
    ).execute(&pool).await?;
    Ok(Json(()))
}

pub async fn delete_historial_medicacion(
    Path(id): Path<Uuid>,
    State(pool): State<PgPool>,
) -> Result<Json<()>, AppError> {
    sqlx::query!(
        "UPDATE historial_medicacion SET borrado = true WHERE id=$1",
        id
    )
    .execute(&pool)
    .await?;
    Ok(Json(()))
}

pub async fn marcar_historial_tomado(
    Path(id): Path<Uuid>,
    State(pool): State<PgPool>,
) -> Result<Json<()>, AppError> {
    sqlx::query!(
        "UPDATE historial_medicacion SET pendiente = false WHERE id=$1",
        id
    )
    .execute(&pool)
    .await?;
    Ok(Json(()))
}

// ==========================================
// UNIDADES DE DOSIS (Ajustes)
// ==========================================
pub async fn get_unidades_dosis(
    State(pool): State<PgPool>,
) -> Result<Json<Vec<UnidadDosis>>, AppError> {
    let unidades = sqlx::query_as!(
        UnidadDosis,
        "SELECT id, nombre, abreviatura FROM unidad_dosis ORDER BY nombre"
    )
    .fetch_all(&pool)
    .await?;
    Ok(Json(unidades))
}

pub async fn create_unidad_dosis(
    State(pool): State<PgPool>,
    Json(payload): Json<UnidadDosisPayload>,
) -> Result<Json<UnidadDosis>, AppError> {
    let registro = sqlx::query_as!(
        UnidadDosis,
        "INSERT INTO unidad_dosis (nombre, abreviatura) VALUES ($1, $2) RETURNING id, nombre, abreviatura",
        payload.nombre, payload.abreviatura
    ).fetch_one(&pool).await?;
    Ok(Json(registro))
}

pub async fn delete_unidad_dosis(
    Path(id): Path<Uuid>,
    State(pool): State<PgPool>,
) -> Result<Json<()>, AppError> {
    sqlx::query!("DELETE FROM unidad_dosis WHERE id=$1", id)
        .execute(&pool)
        .await?;
    Ok(Json(()))
}

pub async fn update_unidad_dosis(
    Path(id): Path<Uuid>,
    State(pool): State<PgPool>,
    Json(payload): Json<UnidadDosisPayload>,
) -> Result<Json<()>, AppError> {
    sqlx::query!(
        "UPDATE unidad_dosis SET nombre=$1, abreviatura=$2 WHERE id=$3",
        payload.nombre,
        payload.abreviatura,
        id
    )
    .execute(&pool)
    .await?;
    Ok(Json(()))
}

// RANGOS
pub async fn get_historial_rango(
    State(pool): State<PgPool>,
    axum::extract::Query(query): axum::extract::Query<RangoFechasQuery>,
) -> Result<Json<Vec<HistorialMedicacion>>, AppError> {
    let historial = sqlx::query_as!(
        HistorialMedicacion,
        r#"
        SELECT 
            h.id, h.medicamento_id, m.nombre as "medicamento_nombre!",
            c.nombre as "categoria_nombre?", c.color as "categoria_color?",
            m.formato::text as "formato!", m.dosis::float8 as "dosis_base!", m.unidad_dosis as "unidad_dosis!",
            h.fecha_hora, h.cantidad_tomada::float8 as "cantidad_tomada!", h.pendiente, h.borrado
        FROM historial_medicacion h
        JOIN medicamento m ON h.medicamento_id = m.id
        LEFT JOIN categoria_medicamento c ON m.categoria_id = c.id
        WHERE h.pendiente = true 
          AND h.fecha_hora >= $1 
          AND h.fecha_hora <= $2
            AND h.borrado = false
        ORDER BY h.fecha_hora ASC
        "#,
        query.start, query.end
    ).fetch_all(&pool).await?;

    Ok(Json(historial))
}

pub async fn marcar_historial_pendiente(
    Path(id): Path<Uuid>,
    State(pool): State<PgPool>,
) -> Result<Json<()>, AppError> {
    sqlx::query!(
        "UPDATE historial_medicacion SET pendiente = true WHERE id=$1",
        id
    )
    .execute(&pool)
    .await?;
    Ok(Json(()))
}
