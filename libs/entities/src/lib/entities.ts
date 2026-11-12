import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
  ValueTransformer,
} from 'typeorm';
import { InvoiceStatus, UserRole } from '@e-invoice/constants';
import { IInvoiceItem } from '@e-invoice/interfaces';

// PostgreSQL trả bigint dưới dạng chuỗi. Tiền VND là số nguyên nên chuyển về number.
const bigintToNumber: ValueTransformer = {
  to: (value?: number | null) => value,
  from: (value?: string | null) => (value == null ? value : Number(value)),
};

@Entity({ name: 'users' })
export class UserEntity {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'varchar', unique: true })
  email!: string;

  @Column({ type: 'varchar' })
  fullName!: string;

  // select: false -> không bao giờ có trong kết quả API hay log.
  // Chỉ lấy khi đăng nhập, bằng createQueryBuilder().addSelect('user.passwordHash').
  @Column({ type: 'varchar', nullable: true, select: false })
  passwordHash?: string;

  @Column({ type: 'varchar', default: UserRole.ACCOUNTANT })
  role!: string;

  @Column({ type: 'boolean', default: true })
  isActive!: boolean;

  @CreateDateColumn()
  createdAt!: Date;
}

@Entity({ name: 'invoices' })
export class InvoiceEntity {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'varchar', unique: true })
  invoiceNumber!: string;

  @Column({ type: 'varchar', unique: true })
  lookupCode!: string;

  @Column({ type: 'varchar' })
  buyerName!: string;

  @Index()
  @Column({ type: 'varchar' })
  buyerTaxCode!: string;

  @Column({ type: 'varchar' })
  buyerEmail!: string;

  @Column({ type: 'jsonb', default: () => "'[]'" })
  items!: IInvoiceItem[];

  @Column({ type: 'bigint', default: 0, transformer: bigintToNumber })
  subTotal!: number;

  @Column({ type: 'bigint', default: 0, transformer: bigintToNumber })
  vatAmount!: number;

  @Column({ type: 'bigint', default: 0, transformer: bigintToNumber })
  totalAmount!: number;

  @Column({ type: 'varchar', default: InvoiceStatus.PENDING })
  status!: InvoiceStatus;

  @Column({ type: 'varchar', nullable: true })
  taxAuthorityCode?: string;

  @Column({ type: 'timestamptz', nullable: true })
  signedAt?: Date;

  @Column({ type: 'varchar', nullable: true })
  signedBy?: string;

  @Column({ type: 'text', nullable: true })
  digitalSignature?: string;

  @Column({ type: 'text', nullable: true })
  xmlContent?: string;

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;
}
