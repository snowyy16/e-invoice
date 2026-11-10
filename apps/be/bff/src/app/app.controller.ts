import {
  Body,
  Controller,
  Get,
  Header,
  Param,
  Patch,
  Post,
} from '@nestjs/common';
import { AppService } from './app.service';
import { InvoiceStatus } from '@e-invoice/constants';
import { IInvoiceItem } from '@e-invoice/interfaces';

@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Get('health')
  getHealth() {
    return this.appService.getHealth();
  }

  @Post('auth/login')
  login(
    @Body()
    body: {
      email: string;
      password?: string;
      portalType?: 'ADMIN' | 'ACCOUNTANT';
    },
  ) {
    return this.appService.login(body.email, body.portalType);
  }

  @Get('invoices')
  getInvoices() {
    return this.appService.findAll();
  }

  @Get('invoices/lookup/:code')
  lookupInvoice(@Param('code') code: string) {
    return this.appService.findByLookupCode(code);
  }

  @Get('invoices/:id/xml')
  @Header('Content-Type', 'application/xml')
  @Header('Content-Disposition', 'attachment; filename="invoice.xml"')
  getInvoiceXml(@Param('id') id: string) {
    return this.appService.getInvoiceXml(id);
  }

  @Get('users')
  getUsers() {
    return this.appService.getUsers();
  }

  @Post('invoices')
  createInvoice(
    @Body()
    body: {
      buyerName: string;
      buyerTaxCode: string;
      buyerEmail: string;
      items: IInvoiceItem[];
    },
  ) {
    return this.appService.createInvoice(body);
  }

  @Patch('invoices/:id/status')
  updateStatus(
    @Param('id') id: string,
    @Body('status') status: InvoiceStatus,
    @Body('signedBy') signedBy?: string,
  ) {
    return this.appService.updateStatus(id, status, signedBy);
  }

  @Post('invoices/ai-extract')
  extractWithAI(@Body('rawText') rawText: string) {
    return this.appService.extractInvoiceWithAI(rawText);
  }
}
