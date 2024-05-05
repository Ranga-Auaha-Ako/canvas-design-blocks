# Dockerfile
# STEP 1: Copy icon repository
ARG CANVAS_BLOCKS_ICONS_LIBRARY_IMAGE=busybox
FROM $CANVAS_BLOCKS_ICONS_LIBRARY_IMAGE as icons


# STEP 2: Install and configure Yarn
FROM node:20.10.0 AS build

WORKDIR /usr/src/app
COPY ["package.json", "package-lock.json*", "npm-shrinkwrap.json*", ".yarnrc.yml", "yarn.lock", "./"]
RUN yarn

# Step 4: Build icon repository
RUN apt-get update || : && apt-get install python3 python3-pip -y
RUN pip3 install picosvg --break-system-packages
COPY ./src/lib/icons ./src/lib/icons
COPY --from=icons /icons ./src/lib/icons/assets/custom
RUN yarn icons
COPY . .

ARG CANVAS_BLOCKS_BASE_DOMAINS
ENV CANVAS_BLOCKS_BASE_DOMAINS=$CANVAS_BLOCKS_BASE_DOMAINS

ARG CANVAS_BLOCKS_THEME_HOST
ENV CANVAS_BLOCKS_THEME_HOST=$CANVAS_BLOCKS_THEME_HOST

ARG CANVAS_BLOCKS_THEME_CONTACT_NAME
ENV CANVAS_BLOCKS_THEME_CONTACT_NAME=$CANVAS_BLOCKS_THEME_CONTACT_NAME

ARG CANVAS_BLOCKS_THEME_CONTACT_LINK
ENV CANVAS_BLOCKS_THEME_CONTACT_LINK=$CANVAS_BLOCKS_THEME_CONTACT_LINK

ARG CANVAS_BLOCKS_THEME
ENV CANVAS_BLOCKS_THEME=$CANVAS_BLOCKS_THEME

ARG CANVAS_BLOCKS_USE_CANVAS_ICONS
ENV CANVAS_BLOCKS_USE_CANVAS_ICONS=$CANVAS_BLOCKS_USE_CANVAS_ICONS

ARG CANVAS_BLOCKS_GLOSSARY_DEFINITIONS
ENV CANVAS_BLOCKS_GLOSSARY_DEFINITIONS=$CANVAS_BLOCKS_GLOSSARY_DEFINITIONS

RUN yarn build-theme

FROM joseluisq/static-web-server:latest as prod
COPY --from=build /usr/src/app/dist /public
COPY ./static-web-server.toml /config.toml
ENV SERVER_CONFIG_FILE=/config.toml
EXPOSE 80