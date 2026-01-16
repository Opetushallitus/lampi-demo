FROM node:24-alpine3.22

RUN apk add bash
WORKDIR /app

COPY db-task /app
RUN npm ci
RUN npm run biome:ci
RUN npx tsc --noEmit --pretty false

ENTRYPOINT ["/app/entrypoint.sh"]