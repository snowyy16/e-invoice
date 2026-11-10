import { InvoiceStatus, VatRate } from '@e-invoice/constants';

export interface IInvoiceItem {
  productId?: string;
  name: string;
  unit: string;
  quantity: number;
  unitPrice: number;
  vatRate: VatRate;
}

export interface IInvoiceCalculation {
  subTotal: number; // Tổng tiền trước thuế
  vatAmount: number; // Tổng tiền thuế GTGT (VAT)
  totalAmount: number; // Tổng tiền thanh toán (sau thuế)
}

export interface IInvoice extends IInvoiceCalculation {
  id: string;
  invoiceNumber: string; // Số hóa đơn (VD: INV-2026-0001)
  lookupCode: string; // Mã tra cứu cho khách hàng
  buyerName: string;
  buyerTaxCode: string; // Mã số thuế người mua
  buyerEmail: string;
  items: IInvoiceItem[];
  status: InvoiceStatus;
  taxAuthorityCode?: string; // Mã cấp của Cơ quan Thuế theo Thông tư 78
  signedAt?: string; // Thời điểm ký số điện tử
  signedBy?: string; // Người ký (Kế toán trưởng / Giám đốc)
  digitalSignature?: string; // Chữ ký số điện tử (Digest / Signature Value)
  xmlContent?: string; // Nội dung file XML chuẩn Thông tư 78
  createdAt: string;
}
