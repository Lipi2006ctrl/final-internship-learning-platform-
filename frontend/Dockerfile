FROM node:20-alpine

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy the rest of the application
COPY . .

# Expose the Vite default port
EXPOSE 5173

# Start the dev server and bind to all interfaces
CMD ["npm", "run", "dev", "--", "--host"]
