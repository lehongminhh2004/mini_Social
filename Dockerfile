# File: Dockerfile (ở ngoài cùng)

FROM node:18-alpine
WORKDIR /app

# Copy file cấu hình và cài đặt thư viện
COPY package*.json ./
RUN npm install

# Copy toàn bộ source code vào
COPY . .

# Build Next.js
RUN npm run build

EXPOSE 3000
CMD ["npm", "start"]