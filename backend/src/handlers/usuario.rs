use crate::error::AppError;
use crate::models::usuario::{Sexo, UpdateUsuarioDto, UsuarioEntity};
use axum::{extract::State, Json};
use sqlx::PgPool;

pub async fn obtener_usuario(State(pool): State<PgPool>) -> Result<Json<UsuarioEntity>, AppError> {
    let usuario = sqlx::query_as!(
        UsuarioEntity,
        // Le decimos a SQLx que mapee directamente al enum Sexo de Rust
        r#"SELECT id, altura, sexo as "sexo: Sexo" FROM usuario WHERE id = 1"#
    )
    .fetch_one(&pool)
    .await?;

    Ok(Json(usuario))
}

pub async fn modificar_usuario(
    State(pool): State<PgPool>,
    Json(payload): Json<UpdateUsuarioDto>,
) -> Result<Json<UsuarioEntity>, AppError> {
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
    .await?;

    Ok(Json(usuario_actualizado))
}
