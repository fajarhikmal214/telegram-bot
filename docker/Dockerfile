FROM registry.digitalservice.id/proxyjds/library/node:16-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
RUN npm run build

FROM registry.digitalservice.id/proxyjds/library/node:16-alpine AS server
WORKDIR /app
COPY package*.json ./
RUN npm install --production
RUN npm cache clean --force
COPY --from=builder ./app/build ./build
EXPOSE 8000
CMD ["npm", "run", "start"]
