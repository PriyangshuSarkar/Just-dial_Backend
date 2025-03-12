# Use official Bun image for building
FROM oven/bun:latest AS builder

# Set working directory
WORKDIR /app

# Copy package.json and bun.lockb (if available) before installing dependencies
COPY package.json tsconfig.json bun.lockb* ./

# Install dependencies
RUN bun install --frozen-lockfile

# Copy the rest of the application
COPY . .

# Ensure TypeScript is installed
RUN bun add -g typescript

# Build the app
RUN bun run build:default

# Use a lighter runtime image
FROM oven/bun:latest AS runner

# Set working directory
WORKDIR /app

# Copy only the built files and node_modules from the builder stage
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package.json ./package.json

# Expose application port
EXPOSE 4000

# Run the application
CMD ["bun", "run", "start"]
