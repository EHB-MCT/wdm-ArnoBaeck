FROM node:latest
WORKDIR /usr/app

COPY package*.json ./
RUN npm install --quiet

COPY public/ ./public/
COPY src/ ./src/
COPY index.html .
COPY vite.config.js .

EXPOSE 8080
CMD ["npm", "run", "dev"]