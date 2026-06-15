FROM node:22-alpine

WORKDIR /app

ARG VITE_APP_NAME
ARG VITE_API_BASE_URL
ENV VITE_APP_NAME=$VITE_APP_NAME
ENV VITE_API_BASE_URL=$VITE_API_BASE_URL

COPY package*.json ./
RUN npm ci

COPY . .
RUN npm run build

EXPOSE 4173

CMD sh -c "npm run preview -- --host 0.0.0.0 --port ${PORT:-4173}"
