import {
  BadRequestException,
  Injectable,
  Logger,
  NotFoundException,
  ServiceUnavailableException,
  UnauthorizedException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, Like, Repository } from 'typeorm';
import * as bcrypt from 'bcryptjs';
import { isUUID } from 'class-validator';
import { InvoiceStatus, UserRole, VatRate } from '@e-invoice/constants';
import { IInvoiceItem } from '@e-invoice/interfaces';
import {
  calculateInvoiceTotals,
  generateInvoiceXml,
  generateLookupCode,
  generateTaxAuthorityCode,
  isValidVietnamTaxCode,
  signJwtToken,
} from '@e-invoice/utils';
import { InvoiceEntity, UserEntity } from '@e-invoice/entities';

// Hóa đơn chỉ được đi theo các bước hợp lệ. PAID và CANCELLED là trạng thái cuối.
const ALLOWED_TRANSITIONS: Record<InvoiceStatus, InvoiceStatus[]> = {
  [InvoiceStatus.DRAFT]: [InvoiceStatus.PENDING, InvoiceStatus.CANCELLED],
  [InvoiceStatus.PENDING]: [InvoiceStatus.ISSUED, InvoiceStatus.CANCELLED],
  [InvoiceStatus.ISSUED]: [InvoiceStatus.PAID, InvoiceStatus.CANCELLED],
  [InvoiceStatus.PAID]: [],
  [InvoiceStatus.CANCELLED]: [],
};

@Injectable()
export class AppService {
  private readonly logger = new Logger(AppService.name);

  constructor(
    @InjectRepository(UserEntity)
    private readonly userRepo: Repository<UserEntity>,
    @InjectRepository(InvoiceEntity)
    private readonly invoiceRepo: Repository<InvoiceEntity>,
    private readonly dataSource: DataSource,
  ) {}

  // ---------------------------------------------------------------- Health

  async getHealth() {
    try {
      await this.dataSource.query('SELECT 1');
    } catch (err) {
      this.logger.error(`Health check: database không phản hồi (${err})`);
      throw new ServiceUnavailableException({
        status: 'error',
        database: 'down',
      });
    }
    return {
      status: 'ok',
      service: 'einvoice-api',
      database: 'up',
      timestamp: new Date().toISOString(),
    };
  }

  // ----------------------------------------------------------------- Users

  async getUsers() {
    // passwordHash có select:false nên không bao giờ lọt ra API.
    return this.userRepo.find({ order: { createdAt: 'ASC' } });
  }

  async login(
    email: string,
    password: string,
    portalType?: 'ADMIN' | 'ACCOUNTANT',
  ) {
    const cleanEmail = (email || '').trim().toLowerCase();

    const user = await this.userRepo
      .createQueryBuilder('user')
      .addSelect('user.passwordHash')
      .where('LOWER(user.email) = :email', { email: cleanEmail })
      .getOne();

    const passwordOk =
      !!user?.passwordHash &&
      typeof password === 'string' &&
      (await bcrypt.compare(password, user.passwordHash));

    // Một thông báo chung cho cả "sai email" và "sai mật khẩu" để không lộ tài khoản nào tồn tại.
    if (!user || !user.isActive || !passwordOk) {
      throw new UnauthorizedException('Email hoặc mật khẩu không đúng');
    }

    // Chỉ báo sai cổng đăng nhập sau khi đã xác thực đúng mật khẩu.
    if (portalType === 'ADMIN' && user.role !== UserRole.ADMIN) {
      throw new BadRequestException(
        'Tài khoản này thuộc bộ phận Kế toán. Vui lòng đăng nhập qua Cổng Kế toán!',
      );
    }
    if (portalType === 'ACCOUNTANT' && user.role === UserRole.ADMIN) {
      throw new BadRequestException(
        'Tài khoản Quản trị viên (ADMIN) vui lòng đăng nhập qua Cổng Quản trị viên!',
      );
    }

    const token = signJwtToken({
      sub: user.id,
      email: user.email,
      fullName: user.fullName,
      role: user.role,
    });

    return {
      success: true,
      message: 'Đăng nhập thành công',
      user: {
        id: user.id,
        email: user.email,
        fullName: user.fullName,
        role: user.role,
      },
      token,
    };
  }

  // -------------------------------------------------------------- Invoices

  async findAll() {
    const invoices = await this.invoiceRepo.find({
      order: { createdAt: 'DESC' },
    });
    return invoices.map((inv) => this.toPublicInvoice(inv));
  }

  async findByLookupCode(code: string) {
    const invoice = await this.invoiceRepo.findOneBy({
      lookupCode: (code || '').trim().toUpperCase(),
    });
    if (!invoice) {
      throw new NotFoundException(
        `Không tìm thấy hóa đơn với mã tra cứu: ${code}`,
      );
    }
    return this.toPublicInvoice(invoice);
  }

  async createInvoice(payload: {
    buyerName: string;
    buyerTaxCode: string;
    buyerEmail: string;
    items: IInvoiceItem[];
  }) {
    if (!payload?.buyerName?.trim()) {
      throw new BadRequestException('Thiếu tên người mua');
    }
    if (
      typeof payload.buyerTaxCode !== 'string' ||
      !isValidVietnamTaxCode(payload.buyerTaxCode)
    ) {
      throw new BadRequestException(
        'Mã số thuế không hợp lệ (10 hoặc 13 chữ số)',
      );
    }
    this.assertValidItems(payload.items);

    // Tổng tiền luôn do server tính, không tin số liệu từ client.
    const totals = calculateInvoiceTotals(payload.items);
    const year = new Date().getFullYear();

    return this.dataSource.transaction(async (manager) => {
      // Khóa theo giao dịch để hai người tạo cùng lúc không bị trùng số hóa đơn.
      await manager.query(
        "SELECT pg_advisory_xact_lock(hashtext('invoice_number'))",
      );
      const count = await manager.count(InvoiceEntity, {
        where: { invoiceNumber: Like(`INV-${year}-%`) },
      });

      const invoice = manager.create(InvoiceEntity, {
        invoiceNumber: `INV-${year}-${String(count + 1).padStart(4, '0')}`,
        lookupCode: generateLookupCode('EINV'),
        buyerName: payload.buyerName.trim(),
        buyerTaxCode: payload.buyerTaxCode.trim(),
        buyerEmail: payload.buyerEmail || 'khachhang@company.vn',
        items: payload.items,
        ...totals,
        status: InvoiceStatus.PENDING,
      });
      const saved = await manager.save(invoice);
      return this.toPublicInvoice(saved);
    });
  }

  async updateStatus(id: string, status: InvoiceStatus, signedBy?: string) {
    if (!Object.values(InvoiceStatus).includes(status)) {
      throw new BadRequestException(`Trạng thái không hợp lệ: ${status}`);
    }

    const invoice = await this.findInvoiceOrFail(id);
    if (invoice.status === status) {
      return this.toPublicInvoice(invoice);
    }
    if (!ALLOWED_TRANSITIONS[invoice.status]?.includes(status)) {
      throw new BadRequestException(
        `Không thể chuyển hóa đơn từ ${invoice.status} sang ${status}`,
      );
    }

    invoice.status = status;

    // Ký số điện tử khi phát hành. Người ký là người đang đăng nhập (controller truyền vào).
    if (status === InvoiceStatus.ISSUED) {
      if (!signedBy) {
        throw new BadRequestException('Thiếu thông tin người ký');
      }
      const cqtCode =
        invoice.taxAuthorityCode ||
        generateTaxAuthorityCode(invoice.buyerTaxCode);
      const xmlData = generateInvoiceXml({
        invoiceNumber: invoice.invoiceNumber,
        lookupCode: invoice.lookupCode,
        buyerName: invoice.buyerName,
        buyerTaxCode: invoice.buyerTaxCode,
        buyerEmail: invoice.buyerEmail,
        items: invoice.items,
        subTotal: invoice.subTotal,
        vatAmount: invoice.vatAmount,
        totalAmount: invoice.totalAmount,
        taxAuthorityCode: cqtCode,
        signedBy,
      });

      invoice.taxAuthorityCode = cqtCode;
      invoice.signedAt = new Date();
      invoice.signedBy = signedBy;
      invoice.digitalSignature = xmlData.signatureDigest;
      invoice.xmlContent = xmlData.xml;
    }

    const saved = await this.invoiceRepo.save(invoice);
    return this.toPublicInvoice(saved);
  }

  async getInvoiceXml(id: string): Promise<string> {
    const invoice = await this.findInvoiceOrFail(id);
    if (invoice.xmlContent) {
      return invoice.xmlContent;
    }

    // Hóa đơn chưa phát hành: sinh XML tạm thời, không lưu lại.
    return generateInvoiceXml({
      invoiceNumber: invoice.invoiceNumber,
      lookupCode: invoice.lookupCode,
      buyerName: invoice.buyerName,
      buyerTaxCode: invoice.buyerTaxCode,
      buyerEmail: invoice.buyerEmail,
      items: invoice.items,
      subTotal: invoice.subTotal,
      vatAmount: invoice.vatAmount,
      totalAmount: invoice.totalAmount,
      taxAuthorityCode:
        invoice.taxAuthorityCode ||
        generateTaxAuthorityCode(invoice.buyerTaxCode),
      signedBy: invoice.signedBy,
    }).xml;
  }

  // --------------------------------------------------------------- Helpers

  private async findInvoiceOrFail(id: string): Promise<InvoiceEntity> {
    // id không phải UUID thì Postgres báo lỗi 500, nên trả 404 luôn.
    if (!isUUID(id)) {
      throw new NotFoundException(`Không tìm thấy hóa đơn ID: ${id}`);
    }
    const invoice = await this.invoiceRepo.findOneBy({ id });
    if (!invoice) {
      throw new NotFoundException(`Không tìm thấy hóa đơn ID: ${id}`);
    }
    return invoice;
  }

  private assertValidItems(items: IInvoiceItem[]) {
    if (!Array.isArray(items) || items.length === 0) {
      throw new BadRequestException('Hóa đơn phải có ít nhất một dòng hàng');
    }
    const vatRates = Object.values(VatRate).filter(
      (v): v is VatRate => typeof v === 'number',
    );
    for (const item of items) {
      const valid =
        typeof item?.name === 'string' &&
        item.name.trim() !== '' &&
        Number.isFinite(item.quantity) &&
        item.quantity > 0 &&
        Number.isFinite(item.unitPrice) &&
        item.unitPrice >= 0 &&
        vatRates.includes(item.vatRate);
      if (!valid) {
        throw new BadRequestException(
          'Dòng hàng không hợp lệ (cần tên, số lượng > 0, đơn giá >= 0, thuế suất 0/5/8/10%)',
        );
      }
    }
  }

  // XML đầy đủ có endpoint riêng (/invoices/:id/xml), không đưa vào danh sách/tra cứu.
  private toPublicInvoice(invoice: InvoiceEntity) {
    return { ...invoice, xmlContent: undefined };
  }
}
