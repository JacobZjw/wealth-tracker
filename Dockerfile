# Use the Bun image
FROM oven/bun:canary-slim

# Set WORKDIR
WORKDIR /app

# Copy package files for dependency installation
COPY package.json yarn.lock ./
COPY server/package.json ./server/
COPY client/package.json ./client/

# Install all dependencies (including devDependencies for build)
RUN yarn install --frozen-lockfile

# Copy source code
COPY server ./server
COPY client ./client

# Build client and server
RUN yarn build

# Remove devDependencies to reduce image size
RUN yarn install --production --frozen-lockfile && yarn cache clean

# Expose app port
EXPOSE 8888

# Define database file path
VOLUME ["/app/data"]

# Auto exec Bun APP
CMD ["bun", "server/dist/index.js"]
