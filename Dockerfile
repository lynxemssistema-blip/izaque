# ========================================================
# Dockerfile Multi-Stage para Easypanel (IZAQUE Monólito)
# Constrói o Frontend React (Vite) e executa o Backend Node.js
# Servindo tudo na mesma porta (3001) sem problemas de CORS ou SSL
# ========================================================

# ESTÁGIO 1: Build do Frontend React
FROM node:20-alpine AS frontend-builder

WORKDIR /build/frontend

# Cache de dependências do frontend
COPY frontend/package*.json ./
RUN npm ci || npm install

# Build da aplicação React
COPY frontend/ ./
RUN npm run build

# ESTÁGIO 2: Backend Node.js de Produção
FROM node:20-alpine

WORKDIR /app

# Variáveis de ambiente padrão para Produção
ENV NODE_ENV=production
ENV PORT=3001
ENV CORS_ORIGIN=*

# Instala dependências de produção do backend
COPY backend/package*.json ./backend/
RUN cd backend && (npm ci --omit=dev || npm install --omit=dev)

# Copia código-fonte do backend
COPY backend/ ./backend/

# Copia o build estático do frontend compilado no estágio 1
COPY --from=frontend-builder /build/frontend/dist ./frontend/dist

# Expõe as portas 80 e 3001 para o Easypanel/Traefik
EXPOSE 80
EXPOSE 3001

# Inicia o servidor orquestrador Hermes
CMD ["node", "backend/src/server.js"]
