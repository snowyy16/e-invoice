import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';
import { InvoiceStatus, VatRate } from '@e-invoice/constants';
import { IInvoiceItem } from '@e-invoice/interfaces';

@Schema({ timestamps: true, collection: 'invoices' })
export class InvoiceDocument extends Document {
  @Prop({ required: true, unique: true })
  invoiceNumber!: string;

  @Prop({ required: true, unique: true, index: true })
  lookupCode!: string;

  @Prop({ required: true })
  buyerName!: string;

  @Prop({ required: true, index: true })
  buyerTaxCode!: string;

  @Prop({ required: true })
  buyerEmail!: string;

  @Prop({ type: Array, default: [] })
  items!: IInvoiceItem[];

  @Prop({ required: true, default: 0 })
  subTotal!: number;

  @Prop({ required: true, default: 0 })
  vatAmount!: number;

  @Prop({ required: true, default: 0 })
  totalAmount!: number;

  @Prop({ type: String, enum: InvoiceStatus, default: InvoiceStatus.PENDING })
  status!: InvoiceStatus;

  @Prop()
  taxAuthorityCode?: string;

  @Prop()
  signedAt?: Date;

  @Prop()
  signedBy?: string;

  @Prop()
  digitalSignature?: string;

  @Prop()
  xmlContent?: string;
}

export const InvoiceSchema = SchemaFactory.createForClass(InvoiceDocument);

export const DEFAULT_SEED_ITEM = {
  name: 'Bản quyền Phần mềm E-Invoice Enterprise',
  unit: 'Gói',
  quantity: 1,
  unitPrice: 10000000,
  vatRate: VatRate.EIGHT,
};
