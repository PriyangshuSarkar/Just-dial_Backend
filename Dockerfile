# Use official Bun image
FROM oven/bun:latest

# Set the working directory
WORKDIR /app

# Copy package.json and install dependencies
COPY package.json ./
RUN bun install

# Copy the rest of the application
COPY . .

# Expose the application port
EXPOSE 4000

# Run the app
CMD ["bun", "run", "start"]
