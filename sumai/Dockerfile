FROM node:22-alpine

WORKDIR /app

COPY package.json package-lock.json* ./
RUN npm ci

COPY . .

EXPOSE 3002

CMD ["npx", "next", "dev", "--port", "3002"]
