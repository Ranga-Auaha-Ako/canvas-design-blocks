# Dockerfile
FROM node:18.7.0 AS build

WORKDIR /usr/src/app
COPY ["package.json", "package-lock.json*", "npm-shrinkwrap.json*", "yarn.lock", "./"]
RUN yarn
COPY . .

RUN yarn build

FROM joseluisq/static-web-server:latest as prod
COPY --from=build /usr/src/app/dist /public
COPY ./static-web-server.toml /config.toml
ENV SERVER_CONFIG_FILE=/config.toml
EXPOSE 80