# ==========================================
# giai đoạn xây dựng bộ mã nguồn
# ==========================================
FROM node:20-alpine AS builder

WORKDIR /app

# kích hoạt trình quản lý gói pnpm thông qua corepack
RUN corepack enable && corepack prepare pnpm@12.18.0 --activate

# cài đặt các thư viện phụ thuộc
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
RUN pnpm install --frozen-lockfile

# sao chép mã nguồn và biên dịch ứng dụng bff
COPY . .
RUN pnpm nx build bff

# ==========================================
# giai đoạn khởi chạy môi trường thực tế
# ==========================================
FROM node:20-alpine AS runner

WORKDIR /app
ENV NODE_ENV=production

# kích hoạt pnpm ở giai đoạn khởi chạy
RUN corepack enable && corepack prepare pnpm@12.18.0 --activate

# sao chép kết quả đã biên dịch từ giai đoạn xây dựng
COPY --from=builder /app/dist/apps/be/bff ./

# cài đặt thư viện chạy thực tế và trình điều khiển postgresql
RUN pnpm install --prod && pnpm add pg

# chạy bằng tài khoản không có quyền quản trị tối cao theo tiêu chuẩn bảo mật
USER node

EXPOSE 3000

CMD ["node", "main.js"]
