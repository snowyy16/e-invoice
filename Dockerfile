# giai đoạn xây dựng bộ mã nguồn
FROM node:20-alpine AS builder

WORKDIR /app

# kích hoạt trình quản lý gói pnpm thông qua corepack
RUN corepack enable && corepack prepare pnpm@12.18.0 --activate

# cài đặt các thư viện phụ thuộc
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
RUN pnpm install --frozen-lockfile

# sao chép mã nguồn và biên dịch ứng dụng bff
COPY . .
RUN pnpm nx build bff && cd /app/dist/apps/be/bff && pnpm install --prod --frozen-lockfile

# giai đoạn khởi chạy môi trường thực tế
FROM node:20-alpine AS runner

# cập nhật gói bảo mật alpine và gỡ bỏ trình quản lý gói không cần thiết ở runtime
RUN apk upgrade --no-cache && \
    rm -rf /usr/local/lib/node_modules/npm /usr/local/bin/npm /usr/local/bin/npx \
           /usr/local/lib/node_modules/corepack /usr/local/bin/corepack \
           /opt/yarn* /usr/local/bin/yarn /usr/local/bin/yarnpkg

WORKDIR /app
ENV NODE_ENV=production

# sao chép kết quả biên dịch kèm node_modules thực tế từ giai đoạn builder
COPY --from=builder --chown=node:node /app/dist/apps/be/bff ./

# chạy bằng tài khoản không có quyền quản trị tối cao theo tiêu chuẩn bảo mật
USER node

EXPOSE 3000

CMD ["node", "main.js"]
