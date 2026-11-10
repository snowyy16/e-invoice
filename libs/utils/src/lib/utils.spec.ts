import { VatRate } from '@e-invoice/constants';
import {
  calculateInvoiceTotals,
  isValidVietnamTaxCode,
  generateLookupCode,
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
    expect(code).toMatch(/^EINV-[A-Z0-9]{6}$/);
  });
});
