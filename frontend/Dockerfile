
# Stage 1: Build the React application.
FROM node:22-alpine AS build

WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci

COPY . .

ARG VITE_API_BASE_URL=/api/v1
ENV VITE_API_BASE_URL=${VITE_API_BASE_URL}

RUN npm run build


# Stage 2: Serve the production build with Nginx.
FROM nginx:1.28-alpine AS runtime

ENV PORT=10000
ENV BACKEND_ORIGIN=https://whale-h0hp.onrender.com
ENV NGINX_ENVSUBST_FILTER=^(BACKEND_ORIGIN|PORT)$

COPY nginx.conf /etc/nginx/templates/default.conf.template
COPY --from=build /app/dist /usr/share/nginx/html

EXPOSE 10000

CMD ["nginx", "-g", "daemon off;"]
