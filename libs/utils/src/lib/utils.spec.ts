import { VatRate } from '@e-invoice/constants';
import {
  calculateInvoiceTotals,
  isValidVietnamTaxCode,
  generateLookupCode,
  generateTaxAuthorityCode,
  signJwtToken,
  verifyJwtToken,
} from './utils';

describe('E-Invoice Financial Utils', () => {
  it('should calculate subTotal, vatAmount (8% and 10%) and totalAmount accurately', () => {
    const result = calculateInvoiceTotals([
      {
        name: 'Phần mềm kế toán',
        unit: 'Gói',
        quantity: 2,
        unitPrice: 1000000,
        vatRate: VatRate.EIGHT,
      },
      {
        name: 'Chữ ký số USB Token',
        unit: 'Cái',
        quantity: 1,
        unitPrice: 500000,
        vatRate: VatRate.TEN,
      },
    ]);

    expect(result.subTotal).toBe(2500000); // 2tr + 500k
    expect(result.vatAmount).toBe(210000); // 160k (8%) + 50k (10%)
    expect(result.totalAmount).toBe(2710000);
  });

  it('should throw error if quantity or unitPrice is negative', () => {
    expect(() =>
      calculateInvoiceTotals([
        {
          name: 'Lỗi âm',
          unit: 'Cái',
          quantity: -1,
          unitPrice: 100000,
          vatRate: VatRate.TEN,
        },
      ]),
    ).toThrow('Quantity and unitPrice must be non-negative');
  });

  it('should validate Vietnam Tax Code (10 or 13 digits)', () => {
    expect(isValidVietnamTaxCode('0101248141')).toBe(true);
    expect(isValidVietnamTaxCode('0101248141-001')).toBe(true);
    expect(isValidVietnamTaxCode('12345')).toBe(false);
  });

  it('should generate valid lookup code', () => {
    const code = generateLookupCode('EINV');
    expect(code).toMatch(/^EINV-[0-9A-F]{6}$/);
  });

  it('should generate valid tax authority code', () => {
    const code = generateTaxAuthorityCode('0101248141');
    expect(code).toMatch(/^CQT-0101248141-[A-Z0-9]+$/);
  });
});

describe('JWT Utils', () => {
  const originalJwtSecret = process.env['JWT_SECRET'];

  afterEach(() => {
    if (originalJwtSecret === undefined) {
      delete process.env['JWT_SECRET'];
    } else {
      process.env['JWT_SECRET'] = originalJwtSecret;
    }
  });

  it('should sign and verify a valid JWT token', () => {
    process.env['JWT_SECRET'] = 'test-secret-key-minimum-32-chars-long';
    const token = signJwtToken({
      sub: 'user-1',
      email: 'admin@einvoice.vn',
      fullName: 'Admin',
      role: 'ADMIN',
    });

    const payload = verifyJwtToken(token);
    expect(payload).not.toBeNull();
    expect(payload?.sub).toBe('user-1');
    expect(payload?.email).toBe('admin@einvoice.vn');
  });

  it('should return null when JWT signature is tampered', () => {
    process.env['JWT_SECRET'] = 'test-secret-key-minimum-32-chars-long';
    const token = signJwtToken({
      sub: 'user-1',
      email: 'admin@einvoice.vn',
      fullName: 'Admin',
      role: 'ADMIN',
    });
    const parts = token.split('.');
    const tamperedSig =
      parts[2][0] === 'A' ? 'B' + parts[2].slice(1) : 'A' + parts[2].slice(1);
    const tamperedToken = `${parts[0]}.${parts[1]}.${tamperedSig}`;

    expect(verifyJwtToken(tamperedToken)).toBeNull();
  });

  it('should throw when JWT_SECRET is missing', () => {
    delete process.env['JWT_SECRET'];
    expect(() =>
      signJwtToken({
        sub: 'user-1',
        email: 'admin@einvoice.vn',
        fullName: 'Admin',
        role: 'ADMIN',
      }),
    ).toThrow('Thiếu biến môi trường bắt buộc: JWT_SECRET');
  });
});
