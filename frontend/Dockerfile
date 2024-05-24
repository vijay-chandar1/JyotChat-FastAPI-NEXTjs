# Build stage
FROM node:20-alpine as build

WORKDIR /app

# Install dependencies
COPY package.json package-lock.* ./
RUN npm install

# Build the application
COPY . .
RUN npm run build

# ====================================
# FROM build as release

EXPOSE 3000
# Serve the static files
CMD ["npm", "run", "dev"]


