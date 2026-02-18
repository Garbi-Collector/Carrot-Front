# Etapa 1: Build Angular
FROM node:20-alpine AS builder

WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build -- --configuration production

# Etapa 2: Nginx para servir el front
FROM nginx:alpine

COPY --from=builder /app/dist/*/browser /usr/share/nginx/html

# Config de nginx para Angular (manejo de rutas SPA)
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80
