FROM node:24-alpine3.22

RUN apk add postgresql17-client bash file gzip curl

WORKDIR /app

COPY src /app
RUN npm ci