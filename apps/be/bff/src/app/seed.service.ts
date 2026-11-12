import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcryptjs';
import { InvoiceStatus, UserRole, VatRate } from '@e-invoice/constants';
import { IInvoiceItem } from '@e-invoice/interfaces';
import {
  calculateInvoiceTotals,
  generateInvoiceXml,
  generateTaxAuthorityCode,
} from '@e-invoice/utils';
import { InvoiceEntity, UserEntity } from '@e-invoice/entities';

const SEED_USERS = [
  {
    email: 'admin@einvoice.vn',
    fullName: 'Quản trị viên Hệ thống',
    role: UserRole.ADMIN,
  },
  {
    email: 'ketoantruong@einvoice.vn',
    fullName: 'Nguyễn Văn A (Kế toán trưởng)',
    role: UserRole.CHIEF_ACCOUNTANT,
  },
  {
    email: 'ketoanvien@einvoice.vn',
    fullName: 'Trần Thị B (Kế toán viên)',
    role: UserRole.ACCOUNTANT,
  },
];

/**
 * Nạp dữ liệu mẫu cho môi trường dev/staging.
 * Chỉ chạy khi SEED_DATA=true. Production phải để SEED_DATA=false (hoặc không đặt).
 * Lỗi không bị nuốt: nếu seed hỏng thì app dừng ngay để biết mà sửa.
 */
@Injectable()
export class SeedService implements OnModuleInit {
  private readonly logger = new Logger(SeedService.name);

  constructor(
    private readonly config: ConfigService,
    @InjectRepository(UserEntity)
    private readonly userRepo: Repository<UserEntity>,
    @InjectRepository(InvoiceEntity)
    private readonly invoiceRepo: Repository<InvoiceEntity>,
  ) {}

  async onModuleInit() {
    if (this.config.get<string>('SEED_DATA') !== 'true') return;

    const password = this.config.get<string>('SEED_PASSWORD');
    if (!password || password.length < 8) {
      throw new Error(
        'SEED_DATA=true cần biến SEED_PASSWORD (tối thiểu 8 ký tự) để đặt mật khẩu cho tài khoản mẫu',
      );
    }

    await this.seedUsers(password);
    await this.seedInvoices();
    this.logger.log('Đã nạp dữ liệu mẫu (SEED_DATA=true)');
  }

  private async seedUsers(password: string) {
    const passwordHash = await bcrypt.hash(password, 10);

    for (const seed of SEED_USERS) {
      const existing = await this.userRepo
        .createQueryBuilder('user')
        .addSelect('user.passwordHash')
        .where('user.email = :email', { email: seed.email })
        .getOne();

      if (!existing) {
        await this.userRepo.save(
          this.userRepo.create({ ...seed, passwordHash }),
        );
      } else if (!existing.passwordHash) {
        // Tài khoản tạo từ phiên bản cũ chưa có mật khẩu: đặt mật khẩu cho nó.
        existing.passwordHash = passwordHash;
        await this.userRepo.save(existing);
      }
    }
  }

  private async seedInvoices() {
    if ((await this.invoiceRepo.count()) > 0) return;

    const items1: IInvoiceItem[] = [
      {
        name: 'Bản quyền Phần mềm E-Invoice Enterprise',
        unit: 'Gói',
        quantity: 1,
        unitPrice: 10000000,
        vatRate: VatRate.EIGHT,
      },
    ];
    const totals1 = calculateInvoiceTotals(items1);
    const cqt1 = generateTaxAuthorityCode('0101248141');
    const signer = 'Nguyễn Văn A (Kế toán trưởng)';
    const xml1 = generateInvoiceXml({
      invoiceNumber: 'INV-2026-0001',
      lookupCode: 'EINV-DEMO01',
      buyerName: 'Công ty TNHH Công Nghệ FPT',
      buyerTaxCode: '0101248141',
      buyerEmail: 'ketoan@fpt.com',
      items: items1,
      ...totals1,
      taxAuthorityCode: cqt1,
      signedBy: signer,
    });

    const items2: IInvoiceItem[] = [
      {
        name: 'Dịch vụ Cloud Server Kubernetes',
        unit: 'Tháng',
        quantity: 12,
        unitPrice: 2000000,
        vatRate: VatRate.TEN,
      },
    ];

    await this.invoiceRepo.save([
      this.invoiceRepo.create({
        invoiceNumber: 'INV-2026-0001',
        lookupCode: 'EINV-DEMO01',
        buyerName: 'Công ty TNHH Công Nghệ FPT',
        buyerTaxCode: '0101248141',
        buyerEmail: 'ketoan@fpt.com',
        items: items1,
        ...totals1,
        status: InvoiceStatus.ISSUED,
        taxAuthorityCode: cqt1,
        signedAt: new Date(),
        signedBy: signer,
        digitalSignature: xml1.signatureDigest,
        xmlContent: xml1.xml,
      }),
      this.invoiceRepo.create({
        invoiceNumber: 'INV-2026-0002',
        lookupCode: 'EINV-DEMO02',
        buyerName: 'Tập đoàn Viễn thông Viettel',
        buyerTaxCode: '0100109106',
        buyerEmail: 'billing@viettel.com.vn',
        items: items2,
        ...calculateInvoiceTotals(items2),
        status: InvoiceStatus.PENDING,
      }),
    ]);
  }
}
