FROM node:20-alpine AS base
WORKDIR /app
COPY package*.json ./
RUN npm install

# Development
FROM base AS dev
ARG UID=1000
ARG GID=1000
RUN chown -R node:node /app
USER node
EXPOSE 8000
CMD ["npm", "run", "dev"]

# Production
FROM base AS prod
COPY . .
RUN npm run build
EXPOSE 8000
CMD ["npm", "run", "start"]