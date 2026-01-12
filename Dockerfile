FROM node:24-alpine3.22

RUN apk add postgresql17-client bash file gzip curl

WORKDIR /app

COPY db-task /app
RUN npm ci

ENTRYPOINT ["/app/entrypoint.sh"]