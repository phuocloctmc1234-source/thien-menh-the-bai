FROM node:20-slim
WORKDIR /app
COPY backend/package*.json backend/
RUN cd backend && npm ci --omit=dev
COPY backend backend
COPY frontend frontend
WORKDIR /app/backend
ENV PORT=3000 DB_PATH=/data/thebai.db FRONTEND_DIR=/app/frontend
VOLUME /data
EXPOSE 3000
CMD ["node", "src/server.js"]
