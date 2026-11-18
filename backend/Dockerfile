FROM node:22-slim
WORKDIR /app
# Công cụ build dự phòng cho better-sqlite3 (khi không tải được bản dựng sẵn)
RUN apt-get update && apt-get install -y --no-install-recommends python3 make g++ && rm -rf /var/lib/apt/lists/*
COPY backend/package*.json backend/
RUN cd backend && npm ci --omit=dev
COPY backend backend
COPY frontend frontend
WORKDIR /app/backend
ENV DB_PATH=/data/thebai.db FRONTEND_DIR=/app/frontend
RUN mkdir -p /data
EXPOSE 3000
CMD ["node", "src/server.js"]
