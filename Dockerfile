# ==========================================
# ETAPA 1: Construir el Frontend (React/Vite)
# ==========================================
FROM node:20-alpine AS frontend-builder
WORKDIR /app/frontend

COPY frontend/package*.json ./
RUN npm ci

COPY frontend/ ./
RUN npm run build

# ==========================================
# ETAPA 2: Construir el Backend (Rust)
# ==========================================
FROM rust:1.78-slim-bookworm AS backend-builder
WORKDIR /app

# Instalar dependencias para compilar OpenSSL y Reqwest
RUN apt-get update && apt-get install -y pkg-config libssl-dev

COPY Cargo.toml Cargo.lock ./
COPY backend/ ./backend/

# Activamos el modo offline de SQLx para que compile sin BD externa
ENV SQLX_OFFLINE=true

RUN cargo build --release --bin backend

# ==========================================
# ETAPA 3: Imagen Final (Producción)
# ==========================================
FROM debian:bookworm-slim
WORKDIR /app

# Instalar certificados SSL (Vital para que Reqwest pueda llamar a Google Fit)
RUN apt-get update && \
    apt-get install -y ca-certificates libssl3 && \
    rm -rf /var/lib/apt/lists/*

# Copiamos el binario compilado
COPY --from=backend-builder /app/target/release/backend /usr/local/bin/backend

# Copiamos los estáticos de React asegurando que la ruta coincide con main.rs
COPY --from=frontend-builder /app/frontend/dist /app/frontend/dist

CMD ["backend"]