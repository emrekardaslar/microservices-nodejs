# Use the official Node.js image
FROM node:16-alpine

# Create and set the working directory inside the container
WORKDIR /app

# Copy the package.json and package-lock.json
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy the rest of the application files
COPY . .

# Expose the service port
EXPOSE 3001

# Start the service
CMD ["npm", "start"]
