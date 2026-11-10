import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PrometheusModule } from '@willsoto/nestjs-prometheus';
import { InvoiceDocument, InvoiceSchema } from '@e-invoice/schemas';
import { UserEntity } from '@e-invoice/entities';
import { AppController } from './app.controller';
import { AppService } from './app.service';

@Module({
  imports: [
    PrometheusModule.register({
      path: '/metrics',
      defaultMetrics: { enabled: true },
    }),
    // 1. Kết nối MongoDB (Lưu Hóa đơn điện tử)
    MongooseModule.forRoot(
      process.env.MONGO_URI ||
        'mongodb://admin:password123@localhost:27017/einvoice_db?authSource=admin',
    ),
    MongooseModule.forFeature([
      { name: InvoiceDocument.name, schema: InvoiceSchema },
    ]),
    // 2. Kết nối PostgreSQL (Lưu Tài khoản Kế toán & Phân quyền)
    TypeOrmModule.forRoot({
      type: 'postgres',
      host: process.env.POSTGRES_HOST || 'localhost',
      port: Number(process.env.POSTGRES_PORT) || 5433,
      username: process.env.POSTGRES_USER || 'admin',
      password: process.env.POSTGRES_PASSWORD || 'password123',
      database: process.env.POSTGRES_DB || 'einvoice_user_db',
      entities: [UserEntity],
      synchronize: true, // Tự động tạo bảng users trong PostgreSQL,
    }),
    TypeOrmModule.forFeature([UserEntity]),
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
