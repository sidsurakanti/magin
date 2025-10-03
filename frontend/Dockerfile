FROM node:20 AS base

WORKDIR /app
COPY package*.json ./

RUN npm ci
COPY . .

EXPOSE 3000
RUN npm run build

