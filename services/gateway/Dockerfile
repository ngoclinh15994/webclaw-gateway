FROM ghcr.io/0xmassi/webclaw:latest AS webclaw-bin

FROM mcr.microsoft.com/playwright:v1.58.2-noble

WORKDIR /app

COPY --from=webclaw-bin /usr/local/bin/webclaw /usr/local/bin/webclaw

COPY package*.json ./
RUN npm ci --omit=dev

COPY src ./src
COPY ui ./ui

EXPOSE 8822

CMD ["npm", "start"]
