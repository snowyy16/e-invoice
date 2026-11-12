import { Test } from '@nestjs/testing';
import {
  BadRequestException,
  NotFoundException,
  ServiceUnavailableException,
  UnauthorizedException,
} from '@nestjs/common';
import { getRepositoryToken } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';
import * as bcrypt from 'bcryptjs';
import { InvoiceStatus, UserRole, VatRate } from '@e-invoice/constants';
import { InvoiceEntity, UserEntity } from '@e-invoice/entities';
import { AppService } from './app.service';

const INVOICE_ID = '3f8b6c1e-9d2a-4c1b-8f6a-1a2b3c4d5e6f';

describe('AppService', () => {
  let service: AppService;
  let dataSource: { query: jest.Mock; transaction: jest.Mock };
  let queryBuilder: {
    addSelect: jest.Mock;
    where: jest.Mock;
    getOne: jest.Mock;
  };
  let invoiceRepo: { find: jest.Mock; findOneBy: jest.Mock; save: jest.Mock };

  beforeEach(async () => {
    process.env['JWT_SECRET'] = 'x'.repeat(32);

    dataSource = { query: jest.fn(), transaction: jest.fn() };
    queryBuilder = {
      addSelect: jest.fn().mockReturnThis(),
      where: jest.fn().mockReturnThis(),
      getOne: jest.fn(),
    };
    invoiceRepo = {
      find: jest.fn(),
      findOneBy: jest.fn(),
      save: jest.fn(async (invoice) => invoice),
    };

    const app = await Test.createTestingModule({
      providers: [
        AppService,
        { provide: DataSource, useValue: dataSource },
        {
          provide: getRepositoryToken(UserEntity),
          useValue: { createQueryBuilder: () => queryBuilder, find: jest.fn() },
        },
        { provide: getRepositoryToken(InvoiceEntity), useValue: invoiceRepo },
      ],
    }).compile();

    service = app.get<AppService>(AppService);
  });

  describe('getHealth', () => {
    it('trả về ok khi database phản hồi', async () => {
      dataSource.query.mockResolvedValue([{ '?column?': 1 }]);
      const health = await service.getHealth();
      expect(health.status).toEqual('ok');
      expect(health.database).toEqual('up');
    });

    it('trả 503 khi database không phản hồi', async () => {
      dataSource.query.mockRejectedValue(new Error('ECONNREFUSED'));
      await expect(service.getHealth()).rejects.toThrow(
        ServiceUnavailableException,
      );
    });
  });

  describe('login', () => {
    const makeUser = async (role = UserRole.ADMIN) => ({
      id: 'user-1',
      email: 'admin@einvoice.vn',
      fullName: 'Admin',
      role,
      isActive: true,
      passwordHash: await bcrypt.hash('mat-khau-dung', 4),
    });

    it('từ chối khi sai mật khẩu', async () => {
      queryBuilder.getOne.mockResolvedValue(await makeUser());
      await expect(
        service.login('admin@einvoice.vn', 'sai-mat-khau'),
      ).rejects.toThrow(UnauthorizedException);
    });

    it('từ chối khi email không tồn tại, cùng thông báo với sai mật khẩu', async () => {
      queryBuilder.getOne.mockResolvedValue(null);
      await expect(
        service.login('khong-co@einvoice.vn', 'bat-ky'),
      ).rejects.toThrow('Email hoặc mật khẩu không đúng');
    });

    it('từ chối khi không gửi mật khẩu', async () => {
      queryBuilder.getOne.mockResolvedValue(await makeUser());
      await expect(
        service.login('admin@einvoice.vn', undefined as unknown as string),
      ).rejects.toThrow(UnauthorizedException);
    });

    it('trả token JWT và không lộ passwordHash khi đúng mật khẩu', async () => {
      queryBuilder.getOne.mockResolvedValue(await makeUser());
      const result = await service.login(
        'admin@einvoice.vn',
        'mat-khau-dung',
        'ADMIN',
      );
      expect(result.token.split('.')).toHaveLength(3);
      expect(result.user.email).toEqual('admin@einvoice.vn');
      expect(JSON.stringify(result)).not.toContain('passwordHash');
    });

    it('báo sai cổng nếu tài khoản kế toán vào cổng ADMIN', async () => {
      queryBuilder.getOne.mockResolvedValue(
        await makeUser(UserRole.ACCOUNTANT),
      );
      await expect(
        service.login('admin@einvoice.vn', 'mat-khau-dung', 'ADMIN'),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('createInvoice', () => {
    const items = [
      {
        name: 'Dịch vụ',
        unit: 'Gói',
        quantity: 1,
        unitPrice: 1000000,
        vatRate: VatRate.EIGHT,
      },
    ];

    it('từ chối mã số thuế sai định dạng', async () => {
      await expect(
        service.createInvoice({
          buyerName: 'Công ty A',
          buyerTaxCode: 'abc',
          buyerEmail: 'a@a.vn',
          items,
        }),
      ).rejects.toThrow(BadRequestException);
    });

    it('từ chối hóa đơn không có dòng hàng', async () => {
      await expect(
        service.createInvoice({
          buyerName: 'Công ty A',
          buyerTaxCode: '0101248141',
          buyerEmail: 'a@a.vn',
          items: [],
        }),
      ).rejects.toThrow(BadRequestException);
    });

    it('từ chối dòng hàng có số lượng âm hoặc thuế suất lạ', async () => {
      await expect(
        service.createInvoice({
          buyerName: 'Công ty A',
          buyerTaxCode: '0101248141',
          buyerEmail: 'a@a.vn',
          items: [{ ...items[0], quantity: -1 }],
        }),
      ).rejects.toThrow(BadRequestException);
      await expect(
        service.createInvoice({
          buyerName: 'Công ty A',
          buyerTaxCode: '0101248141',
          buyerEmail: 'a@a.vn',
          items: [{ ...items[0], vatRate: 7 as VatRate }],
        }),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('updateStatus', () => {
    const baseInvoice = () => ({
      id: INVOICE_ID,
      invoiceNumber: 'INV-2026-0001',
      lookupCode: 'EINV-TEST01',
      buyerName: 'Công ty A',
      buyerTaxCode: '0101248141',
      buyerEmail: 'a@a.vn',
      items: [],
      subTotal: 1000000,
      vatAmount: 80000,
      totalAmount: 1080000,
    });

    it('trả 404 khi id không phải UUID', async () => {
      await expect(
        service.updateStatus('inv-123', InvoiceStatus.ISSUED, 'Kế toán trưởng'),
      ).rejects.toThrow(NotFoundException);
    });

    it('từ chối chuyển trạng thái không hợp lệ (PAID -> PENDING)', async () => {
      invoiceRepo.findOneBy.mockResolvedValue({
        ...baseInvoice(),
        status: InvoiceStatus.PAID,
      });
      await expect(
        service.updateStatus(
          INVOICE_ID,
          InvoiceStatus.PENDING,
          'Kế toán trưởng',
        ),
      ).rejects.toThrow(BadRequestException);
    });

    it('phát hành hóa đơn: ký số, ghi người ký, không trả xmlContent', async () => {
      invoiceRepo.findOneBy.mockResolvedValue({
        ...baseInvoice(),
        status: InvoiceStatus.PENDING,
      });
      const result = await service.updateStatus(
        INVOICE_ID,
        InvoiceStatus.ISSUED,
        'Nguyễn Văn A',
      );
      expect(result.status).toEqual(InvoiceStatus.ISSUED);
      expect(result.signedBy).toEqual('Nguyễn Văn A');
      expect(result.taxAuthorityCode).toBeDefined();
      expect(result.digitalSignature).toBeDefined();
      expect(result.xmlContent).toBeUndefined();
      // XML đã được lưu vào bản ghi để tải riêng qua /invoices/:id/xml
      expect(invoiceRepo.save.mock.calls[0][0].xmlContent).toContain('<');
    });

    it('từ chối phát hành khi không biết người ký', async () => {
      invoiceRepo.findOneBy.mockResolvedValue({
        ...baseInvoice(),
        status: InvoiceStatus.PENDING,
      });
      await expect(
        service.updateStatus(INVOICE_ID, InvoiceStatus.ISSUED),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('getInvoiceXml', () => {
    it('trả 404 khi id không hợp lệ', async () => {
      await expect(service.getInvoiceXml('khong-hop-le')).rejects.toThrow(
        NotFoundException,
      );
    });
  });
});
