import { Injectable } from '@nestjs/common';
import * as nodemailer from 'nodemailer';
import * as handlebars from 'handlebars';
import { readFileSync } from 'fs';
import { join } from 'path';

@Injectable()
export class EmailService {
  private transporter: nodemailer.Transporter;

  constructor() {
    this.transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST || 'localhost',
      port: parseInt(process.env.SMTP_PORT || '587'),
      secure: process.env.SMTP_SECURE === 'true',
      auth: {
        user: process.env.SMTP_USER || '',
        pass: process.env.SMTP_PASS || '',
      },
    });
  }

  async sendEmail(to: string, subject: string, body: string) {
    if (process.env.NODE_ENV === 'test') {
      return;
    }
    await this.transporter.sendMail({
      from: process.env.SMTP_FROM || 'noreply@koreabiz.com',
      to,
      subject,
      html: body,
    });
  }

  async sendVerificationEmail(email: string, token: string) {
    if (process.env.NODE_ENV === 'test') { return; }
    const template = this.loadTemplate('verify-email');
    const html = template({
      verificationUrl: `${process.env.FRONTEND_URL}/verify-email?token=${token}`,
      appName: 'KoreaBiz Directory',
    });

    return this.transporter.sendMail({
      from: process.env.FROM_EMAIL,
      to: email,
      subject: 'Verify your email address',
      html,
    });
  }

  async sendAdminNotification(subject: string, data: any) {
    if (process.env.NODE_ENV === 'test') { return; }
    const template = this.loadTemplate('admin-notify');
    const html = template({
      subject,
      data: JSON.stringify(data, null, 2),
      timestamp: new Date().toISOString(),
    });

    return this.transporter.sendMail({
      from: process.env.SMTP_FROM || 'noreply@koreabiz.com',
      to: process.env.ADMIN_EMAIL,
      subject: `[KoreaBiz Admin] ${subject}`,
      html,
    });
  }

  async sendClaimNotification(claimData: any) {
    return this.sendAdminNotification('New Business Claim Submitted', claimData);
  }

  async sendReviewModerationNotification(reviewData: any) {
    return this.sendAdminNotification('Review Requires Moderation', reviewData);
  }

  private loadTemplate(templateName: string): handlebars.TemplateDelegate {
    const templatePath = join(__dirname, 'templates', `${templateName}.hbs`);
    const templateSource = readFileSync(templatePath, 'utf8');
    return handlebars.compile(templateSource);
  }
}