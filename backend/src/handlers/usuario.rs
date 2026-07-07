use axum::{extract::State, http::StatusCode, Json};
use sqlx::PgPool;
use crate::models::usuario::{UpdateUsuarioDto, UsuarioEntity, Sexo};

pub async fn obtener_usuario(
    State(pool): State<PgPool>,
) -> Result<Json<UsuarioEntity>, (StatusCode, String)> {
    let usuario = sqlx::query_as!(
        UsuarioEntity,
        // Le decimos a SQLx que mapee directamente al enum Sexo de Rust
        r#"SELECT id, altura, sexo as "sexo: Sexo" FROM usuario WHERE id = 1"#
    )
    .fetch_one(&pool)
    .await
    .map_err(|e| (StatusCode::INTERNAL_SERVER_ERROR, e.to_string()))?;

    Ok(Json(usuario))
}

pub async fn modificar_usuario(
    State(pool): State<PgPool>,
    Json(payload): Json<UpdateUsuarioDto>,
) -> Result<Json<UsuarioEntity>, (StatusCode, String)> {
    let usuario_actualizado = sqlx::query_as!(
        UsuarioEntity,
        r#"
        UPDATE usuario 
        SET altura = $1, sexo = $2::sexo_enum 
        WHERE id = 1 
        RETURNING id, altura, sexo as "sexo: Sexo"
        "#,
        payload.altura, 
        payload.sexo as _ // Dejamos que SQLx lo infiera basándose en el tipo del trait
    )
    .fetch_one(&pool)
    .await
    .map_err(|e| (StatusCode::INTERNAL_SERVER_ERROR, e.to_string()))?;

    Ok(Json(usuario_actualizado))
}