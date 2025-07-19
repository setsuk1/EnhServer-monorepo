# Stage 1: Build
FROM node:lts-slim AS base

WORKDIR /app

# Copy only essential files for dependency installation
COPY package.json .

# Install all dependencies
RUN npm install

# Copy application source code (excluding files via .dockerignore)
COPY src/ ./src/
COPY tsconfig.json .

# Build the application and remove development dependencies
RUN npm run build && \
    npm prune --omit=dev && \
    mv src/* ./ && \
    rmdir src

# Stage 2: Run
FROM nginx:latest

WORKDIR /enhserver-frontend
COPY --from=base /app/ /enhserver-frontend/

COPY nginx/conf.d/EnhServer.conf /etc/nginx/conf.d/