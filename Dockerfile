## Dockerfile start altijd pas vanaf een bepaald punt, als je ergens iets aanpast en de eertse 5 stappen blijven onaangepast dan zal docker die stappen niet opnieuw uitvoeren maar de oude versie gebruiken.

## Start met de laatste versie van node
FROM node:latest
### Stel de werkdirectory in de container in op /usr/app
WORKDIR /usr/app

## Kopieer package.json en alles wat begint met package en eindigt op .json naar de werkdirectory
COPY package*.json ./
## Installeer de nodige npm packages
RUN npm install --quiet

## Kopieer de rest van de code naar de werkdirectory
COPY public/ ./public/
COPY src/ ./src/
COPY index.html .
COPY vite.config.js .

## Stel de poort in waarop de app zal draaien, deze poort moet opentesteld worden anders werkt het niet
EXPOSE 8080
## Start de app (altijd de laatste stap in een dockerfile)
CMD ["npm", "run", "dev"]

## --- Commands to build and run the docker image ---
    # docker build -t local/test .
    # docker run --rm -it -p 8080:8080 local/test