# frontend/Dockerfile
FROM node:20 AS builder

WORKDIR /app

# Instala openssl necessário para o Prisma
RUN apt-get update && apt-get install -y openssl && rm -rf /var/lib/apt/lists/*

# Copia arquivos do package manager primeiro
COPY package*.json ./
COPY prisma ./prisma/

# Instala dependências e gera o Prisma Client
RUN npm install
RUN npx prisma generate

# Copia o restante do código
COPY . .

RUN npm run build

FROM nginx:alpine

RUN rm /etc/nginx/conf.d/default.conf
COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=builder /app/out /usr/share/nginx/html

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
