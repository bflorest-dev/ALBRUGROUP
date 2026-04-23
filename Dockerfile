# Build stage
FROM node:20-alpine AS builder
WORKDIR /app

# Vite variables are injected at build time.
ARG VITE_API_URL
ARG VITE_AUTH_BASE_URL=/api/auth
ARG VITE_RRHH_BASE_URL=/api/rrhh
ARG VITE_LEADS_BASE_URL=/api/leads
ARG VITE_RECRUITMENT_BASE_URL=/api/recruitment
ARG VITE_PRESENCE_BASE_URL=/api/presence
ARG VITE_NUMVERIFY_ACCESS_KEY

ENV VITE_API_URL=$VITE_API_URL \
	VITE_AUTH_BASE_URL=$VITE_AUTH_BASE_URL \
	VITE_RRHH_BASE_URL=$VITE_RRHH_BASE_URL \
	VITE_LEADS_BASE_URL=$VITE_LEADS_BASE_URL \
	VITE_RECRUITMENT_BASE_URL=$VITE_RECRUITMENT_BASE_URL \
	VITE_PRESENCE_BASE_URL=$VITE_PRESENCE_BASE_URL \
	VITE_NUMVERIFY_ACCESS_KEY=$VITE_NUMVERIFY_ACCESS_KEY

# Install dependencies based on lockfile
COPY package.json package-lock.json ./
RUN npm ci

# Copy source code and build
COPY . .
RUN npm run build

# Runtime stage
FROM nginx:stable-alpine AS runtime
COPY --from=builder /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Exponer el puerto interno usado por nginx
EXPOSE 5173

CMD ["nginx", "-g", "daemon off;"]
