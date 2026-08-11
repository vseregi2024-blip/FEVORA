FROM node:22-alpine AS base
WORKDIR /app
COPY package.json package-lock.json* ./
RUN npm ci
COPY . .
RUN npm run build
RUN chmod +x ./docker-entrypoint.sh
EXPOSE 3000
ENV NODE_ENV=production
CMD ["./docker-entrypoint.sh"]
