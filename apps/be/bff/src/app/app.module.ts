import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PrometheusModule } from '@willsoto/nestjs-prometheus';
import { InvoiceEntity, UserEntity } from '@e-invoice/entities';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { SeedService } from './seed.service';

// Thiếu cấu hình bắt buộc thì app dừng ngay khi khởi động, không chạy với giá trị mặc định.
function validateEnv(config: Record<string, unknown>) {
  const missing = ['DATABASE_URL', 'JWT_SECRET'].filter((key) => !config[key]);
  if (missing.length > 0) {
    throw new Error(`Thiếu biến môi trường bắt buộc: ${missing.join(', ')}`);
  }
  if (String(config['JWT_SECRET']).length < 32) {
    throw new Error('JWT_SECRET phải dài tối thiểu 32 ký tự');
  }
  return config;
}

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true, validate: validateEnv }),
    PrometheusModule.register({
      path: '/metrics',
      defaultMetrics: { enabled: true },
    }),
    TypeOrmModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        type: 'postgres' as const,
        url: config.getOrThrow<string>('DATABASE_URL'),
        entities: [UserEntity, InvoiceEntity],
        // Chỉ bật ở dev (DB_SYNCHRONIZE=true). Staging/production dùng migration, không để TypeORM tự sửa bảng.
        synchronize: config.get<string>('DB_SYNCHRONIZE') === 'true',
      }),
    }),
    TypeOrmModule.forFeature([UserEntity, InvoiceEntity]),
  ],
  controllers: [AppController],
  providers: [AppService, SeedService],
})
export class AppModule {}
