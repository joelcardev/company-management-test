FROM node:20-alpine

WORKDIR /usr/src/app

COPY package*.json ./

RUN npm install

COPY . .

EXPOSE 5173

# Vite requires the host flag to work correctly inside docker
CMD ["npm", "run", "dev", "--", "--host"]
