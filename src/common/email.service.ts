import { Injectable } from '@nestjs/common';
import * as nodemailer from 'nodemailer';

@Injectable()
export class EmailService {
  private transporter;

  constructor() {
    this.transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST || 'localhost',
      port: parseInt(process.env.SMTP_PORT || '587'),
      secure: false,
      auth: {
        user: process.env.SMTP_USER || '',
        pass: process.env.SMTP_PASS || '',
      },
    });
  }

  async sendVerificationEmail(email: string, token: string) {
    const verifyUrl = `${process.env.FRONTEND_URL}/verify-email?token=${token}`;

    await this.transporter.sendMail({
      from: process.env.FROM_EMAIL,
      to: email,
      subject: 'Verify your email - KoreaBiz Directory',
      html: `
        <h2>Email Verification</h2>
        <p>Click the link below to verify your email:</p>
        <a href="${verifyUrl}">Verify Email</a>
      `,
    });
  }

  async sendClaimNotification(adminEmail: string, enterpriseName: string) {
    await this.transporter.sendMail({
      from: process.env.FROM_EMAIL,
      to: adminEmail,
      subject: 'New Business Claim - KoreaBiz Directory',
      html: `
        <h2>New Business Claim</h2>
        <p>A new claim has been submitted for: <strong>${enterpriseName}</strong></p>
        <p>Please review in the admin panel.</p>
      `,
    });
  }

  async sendReviewNotification(ownerEmail: string, enterpriseName: string) {
    await this.transporter.sendMail({
      from: process.env.SMTP_FROM || 'noreply@koreabiz.com',
      to: ownerEmail,
      subject: 'New Review - KoreaBiz Directory',
      html: `
        <h2>New Review</h2>
        <p>Your business <strong>${enterpriseName}</strong> has received a new review.</p>
      `,
    });
  }
}