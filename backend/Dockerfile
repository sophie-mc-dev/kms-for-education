# Use an official Node.js runtime as a parent image
FROM node:20-alpine

# Set the working directory inside the container
WORKDIR /backend

# Install system dependencies required for bcrypt and other native modules
RUN apk add --no-cache python3 make g++

# Copy package.json and package-lock.json
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy the rest of the application code
COPY . .

# Install nodemon globally for dev mode
RUN npm install -g nodemon

# Expose the application port
EXPOSE 8080

# Use nodemon to auto-restart the server on file changes
CMD ["npm", "run", "dev"]
