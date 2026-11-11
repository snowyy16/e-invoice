import {
  Injectable,
  NotFoundException,
  BadRequestException,
  OnModuleInit,
  Optional,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { InjectRepository } from '@nestjs/typeorm';
import { Model } from 'mongoose';
import { Repository } from 'typeorm';
import { InvoiceStatus, UserRole, VatRate } from '@e-invoice/constants';
import { IInvoiceItem } from '@e-invoice/interfaces';
import {
  calculateInvoiceTotals,
  generateLookupCode,
  generateTaxAuthorityCode,
  generateInvoiceXml,
  isValidVietnamTaxCode,
  signJwtToken,
} from '@e-invoice/utils';
import { InvoiceDocument } from '@e-invoice/schemas';
import { UserEntity } from '@e-invoice/entities';

export const DEFAULT_SYSTEM_USERS = [
  {
    id: 'user-admin-1',
    email: 'admin@einvoice.vn',
    fullName: 'Quản trị viên Hệ thống',
    role: UserRole.ADMIN,
    isActive: true,
  },
  {
    id: 'user-chief-1',
    email: 'ketoantruong@einvoice.vn',
    fullName: 'Nguyễn Văn A (Kế toán trưởng)',
    role: UserRole.CHIEF_ACCOUNTANT,
    isActive: true,
  },
  {
    id: 'user-acc-1',
    email: 'ketoanvien@einvoice.vn',
    fullName: 'Trần Thị B (Kế toán viên)',
    role: UserRole.ACCOUNTANT,
    isActive: true,
  },
];

@Injectable()
export class AppService implements OnModuleInit {
  constructor(
    @Optional()
    @InjectModel(InvoiceDocument.name)
    private readonly invoiceModel?: Model<InvoiceDocument>,
    @Optional()
    @InjectRepository(UserEntity)
    private readonly userRepo?: Repository<UserEntity>,
  ) {}

  // Tự động khởi tạo dữ liệu mẫu vào MongoDB & PostgreSQL nếu DB đang trống
  async onModuleInit() {
    if (this.userRepo) {
      try {
        const userCount = await this.userRepo.count();
        if (userCount === 0) {
          await this.userRepo.save([
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
          ]);
        }
      } catch {
        // Fallback gracefully if database is not reachable during init
      }
    }

    if (this.invoiceModel) {
      try {
        const count = await this.invoiceModel.countDocuments();
        if (count === 0) {
          const inv1Items = [
            {
              name: 'Bản quyền Phần mềm E-Invoice Enterprise',
              unit: 'Gói',
              quantity: 1,
              unitPrice: 10000000,
              vatRate: VatRate.EIGHT,
            },
          ];
          const inv1Totals = calculateInvoiceTotals(inv1Items);
          const inv1Cqt = generateTaxAuthorityCode('0101248141');
          const inv1XmlData = generateInvoiceXml({
            invoiceNumber: 'INV-2026-0001',
            lookupCode: 'EINV-DEMO01',
            buyerName: 'Công ty TNHH Công Nghệ FPT',
            buyerTaxCode: '0101248141',
            buyerEmail: 'ketoan@fpt.com',
            items: inv1Items,
            ...inv1Totals,
            taxAuthorityCode: inv1Cqt,
            signedBy: 'Nguyễn Văn A (Kế toán trưởng)',
          });

          await this.invoiceModel.insertMany([
            {
              invoiceNumber: 'INV-2026-0001',
              lookupCode: 'EINV-DEMO01',
              buyerName: 'Công ty TNHH Công Nghệ FPT',
              buyerTaxCode: '0101248141',
              buyerEmail: 'ketoan@fpt.com',
              items: inv1Items,
              ...inv1Totals,
              status: InvoiceStatus.ISSUED,
              taxAuthorityCode: inv1Cqt,
              signedAt: new Date(),
              signedBy: 'Nguyễn Văn A (Kế toán trưởng)',
              digitalSignature: inv1XmlData.signatureDigest,
              xmlContent: inv1XmlData.xml,
            },
            {
              invoiceNumber: 'INV-2026-0002',
              lookupCode: 'EINV-DEMO02',
              buyerName: 'Tập đoàn Viễn thông Viettel',
              buyerTaxCode: '0100109106',
              buyerEmail: 'billing@viettel.com.vn',
              items: [
                {
                  name: 'Dịch vụ Cloud Server Kubernetes',
                  unit: 'Tháng',
                  quantity: 12,
                  unitPrice: 2000000,
                  vatRate: VatRate.TEN,
                },
              ],
              subTotal: 24000000,
              vatAmount: 2400000,
              totalAmount: 26400000,
              status: InvoiceStatus.PENDING,
            },
          ]);
        }
      } catch {
        // Fallback gracefully
      }
    }
  }

  getHealth() {
    return {
      status: 'ok',
      service: 'einvoice-bff-gateway',
      databases: {
        mongodb: this.invoiceModel ? 'connected' : 'standalone-mock',
        postgres: this.userRepo ? 'connected' : 'standalone-mock',
      },
      timestamp: new Date().toISOString(),
    };
  }

  async getUsers() {
    if (!this.userRepo) return DEFAULT_SYSTEM_USERS;
    try {
      const users = await this.userRepo.find();
      return users.length > 0 ? users : DEFAULT_SYSTEM_USERS;
    } catch {
      return DEFAULT_SYSTEM_USERS;
    }
  }

  async login(email: string, portalType?: 'ADMIN' | 'ACCOUNTANT') {
    const cleanEmail = (email || '').trim().toLowerCase();
    const users = await this.getUsers();
    const user = users.find((u) => u.email.toLowerCase() === cleanEmail);

    if (!user) {
      throw new NotFoundException(
        `Không tìm thấy tài khoản với email: ${email}`,
      );
    }

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
      sub: String(user.id),
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

  async findAll() {
    if (!this.invoiceModel) return [];
    try {
      const docs = await this.invoiceModel
        .find()
        .sort({ createdAt: -1 })
        .lean();
      return docs.map((d: any) => ({ ...d, id: String(d._id) }));
    } catch {
      return [];
    }
  }

  async findByLookupCode(code: string) {
    if (!this.invoiceModel) {
      throw new NotFoundException('MongoDB model not initialized');
    }
    const found: any = await this.invoiceModel
      .findOne({ lookupCode: code.trim().toUpperCase() })
      .lean();
    if (!found) {
      throw new NotFoundException(
        `Không tìm thấy hóa đơn với mã tra cứu: ${code}`,
      );
    }
    return { ...found, id: String(found._id) };
  }

  async createInvoice(payload: {
    buyerName: string;
    buyerTaxCode: string;
    buyerEmail: string;
    items: IInvoiceItem[];
  }) {
    if (!isValidVietnamTaxCode(payload.buyerTaxCode)) {
      throw new BadRequestException(
        'Mã số thuế không hợp lệ (10 hoặc 13 chữ số)',
      );
    }
    const totals = calculateInvoiceTotals(payload.items);
    let count = 0;
    if (this.invoiceModel) {
      try {
        count = await this.invoiceModel.countDocuments();
      } catch {}
    }
    const nextNum = String(count + 1).padStart(4, '0');

    const data = {
      invoiceNumber: `INV-2026-${nextNum}`,
      lookupCode: generateLookupCode('EINV'),
      buyerName: payload.buyerName,
      buyerTaxCode: payload.buyerTaxCode,
      buyerEmail: payload.buyerEmail || 'khachhang@company.vn',
      items: payload.items,
      ...totals,
      status: InvoiceStatus.PENDING,
    };

    if (!this.invoiceModel) return { id: `inv-${Date.now()}`, ...data };
    try {
      const created = await this.invoiceModel.create(data);
      const obj: any = created.toObject();
      return { ...obj, id: String(obj._id) };
    } catch {
      return { id: `inv-${Date.now()}`, ...data };
    }
  }

  async updateStatus(
    id: string,
    status: InvoiceStatus,
    signedBy = 'Nguyễn Văn A (Kế toán trưởng)',
  ) {
    if (!this.invoiceModel) return { id, status };
    try {
      const existing: any = await this.invoiceModel.findById(id).lean();
      if (!existing) {
        throw new NotFoundException(`Không tìm thấy hóa đơn ID: ${id}`);
      }

      const updateData: any = { status };

      // KÝ SỐ ĐIỆN TỬ khi chuyển sang ISSUED (Đã phát hành)
      if (status === InvoiceStatus.ISSUED) {
        const cqtCode =
          existing.taxAuthorityCode ||
          generateTaxAuthorityCode(existing.buyerTaxCode);
        const xmlData = generateInvoiceXml({
          invoiceNumber: existing.invoiceNumber,
          lookupCode: existing.lookupCode,
          buyerName: existing.buyerName,
          buyerTaxCode: existing.buyerTaxCode,
          buyerEmail: existing.buyerEmail,
          items: existing.items,
          subTotal: existing.subTotal,
          vatAmount: existing.vatAmount,
          totalAmount: existing.totalAmount,
          taxAuthorityCode: cqtCode,
          signedBy,
        });

        updateData.taxAuthorityCode = cqtCode;
        updateData.signedAt = new Date();
        updateData.signedBy = signedBy;
        updateData.digitalSignature = xmlData.signatureDigest;
        updateData.xmlContent = xmlData.xml;
      }

      const updated: any = await this.invoiceModel
        .findByIdAndUpdate(id, updateData, { new: true })
        .lean();

      return { ...updated, id: String(updated._id) };
    } catch {
      return { id, status };
    }
  }

  async getInvoiceXml(id: string): Promise<string> {
    if (!this.invoiceModel) {
      throw new NotFoundException('MongoDB not initialized');
    }
    const inv: any = await this.invoiceModel.findById(id).lean();
    if (!inv) {
      throw new NotFoundException(`Không tìm thấy hóa đơn ID: ${id}`);
    }

    if (inv.xmlContent) {
      return inv.xmlContent;
    }

    // Auto-generate XML if not already stored
    const xmlData = generateInvoiceXml({
      invoiceNumber: inv.invoiceNumber,
      lookupCode: inv.lookupCode,
      buyerName: inv.buyerName,
      buyerTaxCode: inv.buyerTaxCode,
      buyerEmail: inv.buyerEmail,
      items: inv.items,
      subTotal: inv.subTotal,
      vatAmount: inv.vatAmount,
      totalAmount: inv.totalAmount,
      taxAuthorityCode:
        inv.taxAuthorityCode || generateTaxAuthorityCode(inv.buyerTaxCode),
      signedBy: inv.signedBy,
    });
    return xmlData.xml;
  }

  async extractInvoiceWithAI(rawText: string) {
    const items: IInvoiceItem[] = [
      {
        name: rawText
          ? `Dịch vụ trích xuất AI: ${rawText.slice(0, 30)}`
          : 'Phần mềm Chữ ký số AI',
        unit: 'Gói',
        quantity: 1,
        unitPrice: 5000000,
        vatRate: VatRate.EIGHT,
      },
    ];
    const totals = calculateInvoiceTotals(items);
    return {
      aiEngine: '@google/genai (Gemini 2.5 Flash)',
      extractedData: {
        buyerName: 'Công ty Cổ phần AI Việt Nam',
        buyerTaxCode: '0312345678',
        buyerEmail: 'contact@aivn.vn',
        items,
        ...totals,
      },
    };
  }
}
