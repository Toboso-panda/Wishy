FROM node:22-alpine AS dependencies
WORKDIR /app
RUN apk add --no-cache openssl libc6-compat
COPY package.json package-lock.json ./
COPY prisma ./prisma
RUN npm ci

FROM node:22-alpine AS builder
WORKDIR /app
RUN apk add --no-cache openssl libc6-compat
COPY --from=dependencies /app/node_modules ./node_modules
COPY . .
RUN npx prisma generate
ENV NEXT_TELEMETRY_DISABLED=1
RUN npm run build

# Només el CLI de Prisma (per a "migrate deploy" en arrencar), no tot el node_modules.
# Mateixa versió que el package-lock.json.
FROM node:22-alpine AS prisma-cli
WORKDIR /prisma-cli
RUN apk add --no-cache openssl libc6-compat
RUN npm init -y >/dev/null && npm install --omit=dev --no-audit --no-fund prisma@6.19.3

FROM node:22-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV PATH="/opt/prisma-cli/node_modules/.bin:$PATH"
RUN apk add --no-cache openssl libc6-compat
# "standalone" ja porta el servidor i només els paquets que l'app fa servir
COPY --chown=node:node --from=builder /app/.next/standalone ./
COPY --chown=node:node --from=builder /app/.next/static ./.next/static
# Client de Prisma generat (amb el motor per a Alpine)
COPY --chown=node:node --from=builder /app/node_modules/.prisma ./node_modules/.prisma
COPY --chown=node:node --from=builder /app/node_modules/@prisma/client ./node_modules/@prisma/client
COPY --chown=node:node --from=builder /app/prisma ./prisma
COPY --from=prisma-cli /prisma-cli /opt/prisma-cli
# --chown als COPY: un "chown -R /app" duplicaria tots els fitxers en una capa nova
RUN mkdir -p /data/uploads && chown node:node /app /data/uploads
USER node
EXPOSE 3000
CMD ["sh", "-c", "test -n \"$AUTH_SECRET\" || { echo 'Falta AUTH_SECRET. Configura un secret llarg al fitxer .env.'; exit 1; }; prisma migrate deploy && node server.js"]
