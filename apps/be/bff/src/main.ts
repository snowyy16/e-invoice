/**
 * khởi tạo máy chủ dịch vụ backend trung gian xử lý nghiệp vụ hóa đơn điện tử
 */

import { Logger } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app/app.module';
import { MICROSERVICE_PORTS } from '@e-invoice/constants';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const globalPrefix = 'api';
  app.setGlobalPrefix(globalPrefix);
  app.enableCors();
  const port = process.env.PORT || MICROSERVICE_PORTS.BFF;
  await app.listen(port);
  // thiết lập tín hiệu khi công cụ nx chờ máy chủ khởi động hoàn tất
  if (process.env.NX_READY_SIGNAL_SOCKET) {
    try {
      // hàm giữ cho trình biên dịch không tự ý viết lại hoặc gộp lệnh nạp thư viện
      const load = new Function('s', 'return import(s)') as (
        s: string,
      ) => Promise<{ emitReadySignal(server: unknown): boolean }>;
      (await load('@nx/js/ready-signal')).emitReadySignal(app.getHttpServer());
    } catch {
      // bỏ qua nếu gói thư viện tín hiệu chưa được cài đặt
    }
  }
  Logger.log(
    `🚀 Application is running on: http://localhost:${port}/${globalPrefix}`,
  );
}

bootstrap();
