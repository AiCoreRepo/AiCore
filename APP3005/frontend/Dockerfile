# Build stage
FROM node:18-alpine AS build

WORKDIR /app

COPY package*.json ./
ENV NGROK_SKIP_POSTINSTALL=1
RUN npm ci

COPY . .

ARG VITE_API_URL=http://localhost:3002
ARG VITE_GOOGLE_CLIENT_ID=
ARG VITE_ENABLE_TRY_ON_PACK_DEV_SKIP=false
ENV VITE_API_URL=${VITE_API_URL}
ENV VITE_GOOGLE_CLIENT_ID=${VITE_GOOGLE_CLIENT_ID}
ENV VITE_ENABLE_TRY_ON_PACK_DEV_SKIP=${VITE_ENABLE_TRY_ON_PACK_DEV_SKIP}

RUN npm run build

# Runtime stage
FROM nginx:1.25-alpine

COPY --from=build /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 8080

CMD ["nginx", "-g", "daemon off;"]
