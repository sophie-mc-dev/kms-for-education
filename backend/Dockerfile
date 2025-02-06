# Use an official Node.js runtime as a parent image
FROM node:20-alpine

# Set the working directory inside the container
WORKDIR /backend

# Copy package.json and package-lock.json
COPY package*.json ./

# Install dependencies 
RUN npm install

# Copy the rest of the application code
COPY . .

# Expose the application port
EXPOSE 8080

# Define the command to run the app
CMD ["npm", "start"]
