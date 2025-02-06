# Use an official Node.js runtime as a parent image
FROM node:20-alpine

# Set the working directory
WORKDIR /frontend

# Copy package.json and package-lock.json
COPY package*.json .

# Install dependencies
RUN npm install

# Copy the rest of the application code
COPY . .

# Expose port for the application
EXPOSE 5173

# Start the application in dev mode (with hot reloading)
CMD ["npm", "run", "dev"]
 