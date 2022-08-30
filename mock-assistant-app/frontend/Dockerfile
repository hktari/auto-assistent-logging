# Multi-stage
# 1) Node image for building frontend assets
# 2) nginx stage to serve frontend assets

FROM node:16 AS builder

WORKDIR /usr/src/app

COPY . .

ENV REACT_APP_BACKEND_HOST=localhost
ENV REACT_APP_BACKEND_PORT=5983

RUN echo -e "REACT_APP_BACKEND_HOST=${REACT_APP_BACKEND_HOST}\nREACT_APP_BACKEND_PORT=${REACT_APP_BACKEND_PORT}" > .env

RUN npm install && npm run build

# nginx state for serving content
FROM nginx:alpine
# Set working directory to nginx asset directory
WORKDIR /usr/share/nginx/html
# Remove default nginx static assets
RUN rm -rf ./*
# Copy static assets from builder stage
COPY --from=builder /usr/src/app/build .
# Containers run nginx with global directives and daemon off
ENTRYPOINT ["nginx", "-g", "daemon off;"]