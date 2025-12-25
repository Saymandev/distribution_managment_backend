# ---- Build Stage ----
FROM node:18 AS build

WORKDIR /app

COPY package*.json ./
RUN npm install

COPY . .
RUN npm run build

# ---- Production Stage ----
FROM node:18 AS production

WORKDIR /app

COPY package*.json ./
RUN npm install --omit=dev

COPY --from=build /app/dist ./dist

# Environment variables (Colify provides via dashboard, but you can set defaults here)
ENV NODE_ENV=production
ENV PORT=3000

# Run your app
CMD [ "node", "dist/main.js" ]

