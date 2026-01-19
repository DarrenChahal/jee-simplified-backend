# Use Node.js LTS as base image
FROM node:20

# Set working directory
WORKDIR /app

# Copy package.json and package-lock.json first for better caching
COPY package*.json ./

# Install dependencies
RUN npm ci --omit=dev

# Copy the rest of the application
COPY . .

# Set environment variables
ENV NODE_ENV=production
ENV GCLOUD_PROJECT_ID=solveiit

# Cloud Run listens on 8080
EXPOSE 8080

# Start the application
CMD ["node", "index.js"]
