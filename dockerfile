# Dockerfile
FROM node:18.7.0 AS build

WORKDIR /usr/src/app
COPY ["package.json", "package-lock.json*", "npm-shrinkwrap.json*", "yarn.lock", "./"]
RUN yarn
COPY . .

RUN yarn build

FROM nginx as prod
COPY --from=build /usr/src/app/build /usr/share/nginx/html
EXPOSE 80