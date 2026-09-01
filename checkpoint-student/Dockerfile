FROM node:20-alpine AS build

WORKDIR /app

# Copy package files
COPY package.json package-lock.json ./

# Install dependencies
RUN npm ci

# Copy source code
COPY . .

# Build the React app (CI=false to ignore warnings)
RUN CI=false npm run build

# --- Production stage ---
FROM node:20-alpine

RUN npm install -g serve

WORKDIR /app

COPY --from=build /app/build ./build

EXPOSE 3000

# Railway injects PORT env var; serve static build
CMD serve -s build -l ${PORT:-3000}
