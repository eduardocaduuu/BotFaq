FROM node:20-alpine
WORKDIR /app
COPY package.json package-lock.json* ./
RUN npm ci --omit=dev || npm install --omit=dev
COPY src ./src
COPY .env.example ./
ENV NODE_ENV=production
CMD ["npm","start"]
