import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';
import { InvoiceEntity, UserEntity } from '@e-invoice/entities';
import { AppController } from './app.controller';
import { AppService } from './app.service';

describe('AppController', () => {
  let app: TestingModule;

  beforeAll(async () => {
    app = await Test.createTestingModule({
      controllers: [AppController],
      providers: [
        AppService,
        // Database giả: test chạy không cần PostgreSQL.
        {
          provide: DataSource,
          useValue: { query: jest.fn().mockResolvedValue([]) },
        },
        { provide: getRepositoryToken(UserEntity), useValue: {} },
        { provide: getRepositoryToken(InvoiceEntity), useValue: {} },
      ],
    }).compile();
  });

  describe('getHealth', () => {
    it('should return status ok', async () => {
      const appController = app.get<AppController>(AppController);
      const health = await appController.getHealth();
      expect(health.status).toEqual('ok');
    });
  });
});
