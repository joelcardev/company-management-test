FROM node:20-alpine

WORKDIR /usr/src/app

# Install openssl and libc6-compat for Prisma engine to work on alpine
RUN apk add --no-cache openssl libc6-compat

COPY package*.json ./
COPY prisma ./prisma/

RUN npm install && npm cache clean --force

COPY . .

# Generate Prisma client for alpine
RUN npx prisma generate

EXPOSE 3000

# Generate Prisma client and push schema at runtime
CMD ["sh", "-c", "npx prisma generate && npx prisma db push && npm run start:dev"]
