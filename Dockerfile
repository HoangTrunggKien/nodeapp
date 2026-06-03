FROM node:22-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm install --only=production

FROM node:22-alpine
WORKDIR /app
RUN addgroup -g 1001 -S devops && \
    adduser -S devops -u 1001
COPY --from=builder --chown=devops:devops /app/node_modules ./node_modules
COPY --chown=devops:devops src ./src
COPY --chown=devops:devops package*.json ./
USER devops
EXPOSE 3000
CMD ["node", "src/app.js"]