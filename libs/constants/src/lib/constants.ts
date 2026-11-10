export enum InvoiceStatus {
  DRAFT = 'DRAFT', // Bản nháp
  PENDING = 'PENDING', // Chờ Kế toán trưởng duyệt
  ISSUED = 'ISSUED', // Đã ký số & Phát hành (Có mã tra cứu)
  PAID = 'PAID', // Đã thanh toán
  CANCELLED = 'CANCELLED', // Đã hủy
}

export enum UserRole {
  ADMIN = 'ADMIN',
  CHIEF_ACCOUNTANT = 'CHIEF_ACCOUNTANT',
  ACCOUNTANT = 'ACCOUNTANT',
}

export enum VatRate {
  ZERO = 0, // 0% (Hàng xuất khẩu / Không chịu thuế)
  FIVE = 5, // 5% (Nước sạch, thiết bị y tế, giáo dục)
  EIGHT = 8, // 8% (Chính sách giảm thuế GTGT hiện hành)
  TEN = 10, // 10% (Thuế suất tiêu chuẩn)
}

export const MICROSERVICE_PORTS = {
  BFF: 3000,
  INVOICE_TCP: 3001,
  PRODUCT_TCP: 3002,
  USER_ACCESS_TCP: 3003,
  AUTHORIZE_TCP: 3004,
} as const;
