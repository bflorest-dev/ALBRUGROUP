FROM node:22-alpine AS builder
WORKDIR /app
ARG GATEWAY_BASE_URL=http://localhost:8080

COPY package*.json ./
RUN npm install

COPY . .
RUN sed -i "s|http://localhost:8080|${GATEWAY_BASE_URL}|g" src/environments/environment.prod.ts
RUN npm run build

FROM nginx:1.27-alpine
COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=builder /app/dist/frontend/browser /usr/share/nginx/html

EXPOSE 80
