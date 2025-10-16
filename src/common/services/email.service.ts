import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

export interface EmailOptions {
  to: string;
  subject: string;
  html: string;
  text?: string;
}

@Injectable()
export class EmailService {
  private readonly logger = new Logger(EmailService.name);

  constructor(private configService: ConfigService) {}

  async sendEmail(options: EmailOptions): Promise<void> {
    // For now, we'll just log the email content
    // In production, you would integrate with an email service like SendGrid, AWS SES, etc.
    this.logger.log(`Email would be sent to: ${options.to}`);
    this.logger.log(`Subject: ${options.subject}`);
    this.logger.log(`Content: ${options.text || options.html}`);
    
    // TODO: Implement actual email sending
    // Example with SendGrid:
    // const sgMail = require('@sendgrid/mail');
    // sgMail.setApiKey(this.configService.get('SENDGRID_API_KEY'));
    // await sgMail.send(options);
  }

  async sendVendorApprovalEmail(vendorEmail: string, vendorName: string, status: string, rejectionReason?: string): Promise<void> {
    const subject = status === 'approved' 
      ? `🎉 Welcome to Dream Weddings - Your Application is Approved!`
      : `Application Update - Dream Weddings`;

    const html = status === 'approved' 
      ? this.getApprovalEmailTemplate(vendorName)
      : this.getRejectionEmailTemplate(vendorName, rejectionReason);

    const text = status === 'approved'
      ? `Congratulations ${vendorName}! Your vendor application has been approved. You can now access your vendor dashboard and start receiving bookings.`
      : `Dear ${vendorName}, Unfortunately, your vendor application was not approved at this time. ${rejectionReason ? `Reason: ${rejectionReason}` : ''}`;

    await this.sendEmail({
      to: vendorEmail,
      subject,
      html,
      text,
    });
  }

  async sendNewVendorNotificationEmail(adminEmail: string, vendorName: string, vendorEmail: string): Promise<void> {
    const subject = `New Vendor Application - ${vendorName}`;
    
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #e91e63;">New Vendor Application</h2>
        <p>A new vendor has submitted an application for review:</p>
        <div style="background-color: #f5f5f5; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <p><strong>Business Name:</strong> ${vendorName}</p>
          <p><strong>Email:</strong> ${vendorEmail}</p>
          <p><strong>Applied On:</strong> ${new Date().toLocaleDateString()}</p>
        </div>
        <p>Please review the application in the admin panel.</p>
        <a href="${this.configService.get('ADMIN_PANEL_URL')}/vendors" 
           style="background-color: #e91e63; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; display: inline-block;">
          Review Application
        </a>
      </div>
    `;

    const text = `New vendor application from ${vendorName} (${vendorEmail}). Please review in the admin panel.`;

    await this.sendEmail({
      to: adminEmail,
      subject,
      html,
      text,
    });
  }

  private getApprovalEmailTemplate(vendorName: string): string {
    return `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="text-align: center; padding: 40px 0;">
          <h1 style="color: #e91e63; margin-bottom: 20px;">🎉 Congratulations!</h1>
          <h2 style="color: #333;">Welcome to Dream Weddings</h2>
        </div>
        
        <div style="background-color: #f8f9fa; padding: 30px; border-radius: 8px; margin: 20px 0;">
          <p style="font-size: 18px; color: #333; margin-bottom: 20px;">
            Dear <strong>${vendorName}</strong>,
          </p>
          
          <p style="color: #666; line-height: 1.6; margin-bottom: 20px;">
            We're thrilled to inform you that your vendor application has been <strong style="color: #28a745;">approved</strong>! 
            You are now officially part of the Dream Weddings family.
          </p>
          
          <div style="background-color: white; padding: 20px; border-radius: 6px; border-left: 4px solid #28a745; margin: 20px 0;">
            <h3 style="color: #28a745; margin-top: 0;">What's Next?</h3>
            <ul style="color: #666; line-height: 1.8;">
              <li>Access your vendor dashboard</li>
              <li>Complete your profile setup</li>
              <li>Upload your portfolio</li>
              <li>Set your availability</li>
              <li>Start receiving bookings!</li>
            </ul>
          </div>
          
          <div style="text-align: center; margin: 30px 0;">
            <a href="${this.configService.get('FRONTEND_URL')}/vendor/dashboard" 
               style="background-color: #e91e63; color: white; padding: 15px 30px; text-decoration: none; border-radius: 6px; display: inline-block; font-weight: bold;">
              Access Your Dashboard
            </a>
          </div>
          
          <p style="color: #666; line-height: 1.6;">
            If you have any questions or need assistance, please don't hesitate to contact our support team.
          </p>
          
          <p style="color: #666;">
            Best regards,<br>
            The Dream Weddings Team
          </p>
        </div>
        
        <div style="text-align: center; padding: 20px; color: #999; font-size: 14px;">
          <p>Dream Weddings - Making Your Special Day Perfect</p>
        </div>
      </div>
    `;
  }

  private getRejectionEmailTemplate(vendorName: string, rejectionReason?: string): string {
    return `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="text-align: center; padding: 40px 0;">
          <h1 style="color: #e91e63; margin-bottom: 20px;">Application Update</h1>
        </div>
        
        <div style="background-color: #f8f9fa; padding: 30px; border-radius: 8px; margin: 20px 0;">
          <p style="font-size: 18px; color: #333; margin-bottom: 20px;">
            Dear <strong>${vendorName}</strong>,
          </p>
          
          <p style="color: #666; line-height: 1.6; margin-bottom: 20px;">
            Thank you for your interest in joining Dream Weddings. After careful review, 
            we regret to inform you that your vendor application was not approved at this time.
          </p>
          
          ${rejectionReason ? `
            <div style="background-color: #fff3cd; padding: 20px; border-radius: 6px; border-left: 4px solid #ffc107; margin: 20px 0;">
              <h3 style="color: #856404; margin-top: 0;">Feedback:</h3>
              <p style="color: #856404; margin-bottom: 0;">${rejectionReason}</p>
            </div>
          ` : ''}
          
          <div style="background-color: white; padding: 20px; border-radius: 6px; border-left: 4px solid #17a2b8; margin: 20px 0;">
            <h3 style="color: #17a2b8; margin-top: 0;">What You Can Do:</h3>
            <ul style="color: #666; line-height: 1.8;">
              <li>Review the feedback above</li>
              <li>Update your business information</li>
              <li>Submit a new application</li>
              <li>Contact our support team for clarification</li>
            </ul>
          </div>
          
          <div style="text-align: center; margin: 30px 0;">
            <a href="${this.configService.get('FRONTEND_URL')}/vendor/onboarding" 
               style="background-color: #17a2b8; color: white; padding: 15px 30px; text-decoration: none; border-radius: 6px; display: inline-block; font-weight: bold;">
              Submit New Application
            </a>
          </div>
          
          <p style="color: #666; line-height: 1.6;">
            We encourage you to reapply once you've addressed the feedback. We're always looking for 
            quality vendors to join our platform.
          </p>
          
          <p style="color: #666;">
            Best regards,<br>
            The Dream Weddings Team
          </p>
        </div>
        
        <div style="text-align: center; padding: 20px; color: #999; font-size: 14px;">
          <p>Dream Weddings - Making Your Special Day Perfect</p>
        </div>
      </div>
    `;
  }
}
