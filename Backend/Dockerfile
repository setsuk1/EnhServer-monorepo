# Stage 1: Build
FROM node:lts-slim AS base
# ENV NODE_ENV=production

WORKDIR /app

# Copy only essential files for dependency installation
COPY package.json .

# Install all dependencies
RUN npm install

# Copy application source code (excluding files via .dockerignore)
COPY . .

# Build the application and remove development dependencies
RUN npm run build && \
    npm prune --omit=dev

# Stage 2: Run
FROM gcr.io/distroless/nodejs22-debian12
ENV NODE_ENV=production

WORKDIR /app

# Copy only the built application and dependencies from the build stage
COPY --from=base /app/out /app/
COPY --from=base /app/node_modules /app/node_modules

# Set a non-root user for security
USER nonroot

# Expose application port
EXPOSE 3000

# Run the application
CMD ["main.js"]
