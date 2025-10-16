## Start vanaf een bepaalde base image
FROM node:latest

## 
WORKDIR /usr/app

## 
COPY package*.json .

## Installeer dependencies
RUN npm install --quiet

COPY ./ ./

## 
CMD ["npm", "start"]