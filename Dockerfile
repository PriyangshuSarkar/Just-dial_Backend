# Use official Bun image for building
FROM oven/bun:latest AS builder

# Set working directory
WORKDIR /app

# Copy the rest of the application
COPY . .

# Copy .env file so Prisma can access the database URL
COPY .env .env

# Build the app
RUN bun run build:default

# Generate Prisma client
RUN bun run prisma generate

# Use a lighter runtime image
FROM oven/bun:latest AS runner

# Set working directory
WORKDIR /app

# Copy only the built files and node_modules from the builder stage
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package.json ./package.json
COPY --from=builder /app/.env .env 

# Expose application port
EXPOSE 4000

# Run the application
CMD ["bun", "run", "start"]
