FROM node:lts-slim AS base
ENV NODE_ENV=development
ENV DEVELOPMENT=1

WORKDIR /app

# Copy only necessary files for dependencies
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy only application source files
COPY . .

# Start the development server
CMD ["npm", "run", "dev"]
