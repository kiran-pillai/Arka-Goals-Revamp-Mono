import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createTransport, type Transporter } from 'nodemailer';
import { Resend } from 'resend';
import type { AppConfig } from '../config/configuration';

@Injectable()
export class MailService {
  private readonly logger = new Logger(MailService.name);
  // Prod uses Resend API; local uses SMTP (MailHog)
  private readonly resend: Resend | null = null;
  private readonly transporter: Transporter | null = null;
  private readonly from: string;

  constructor(config: ConfigService) {
    const app = config.getOrThrow<AppConfig>('app');
    this.from = app.mailFrom;

    if (app.isProd) {
      this.resend = new Resend(app.smtpApiKey);
    } else {
      // MailHog defaults: localhost:1025, no TLS
      this.transporter = createTransport({
        host: app.smtpHost,
        port: app.smtpPort,
        ignoreTLS: true,
      });
    }
  }

  async sendLoginLink(email: string, url: string): Promise<void> {
    await this.send(
      email,
      'Your Cheetah Squad sign-in link',
      `<p>Tap the link below to sign in. It expires in 15 minutes and can be used once.</p>
       <p><a href="${url}">Sign in to Cheetah Squad</a></p>`,
    );
  }

  async sendInviteLink(email: string, url: string, firstName?: string, lastName?: string): Promise<void> {
    const greeting = firstName ? `<p>Hi ${firstName}${lastName ? ' ' + lastName : ''}!</p>` : '';
    await this.send(
      email,
      "You're invited to Cheetah Squad",
      `${greeting}<p>You've been invited to Cheetah Squad. Tap the link below to join.
       It expires in 7 days and can be used once.</p>
       <p><a href="${url}">Join Cheetah Squad</a></p>`,
    );
  }

  private async send(to: string, subject: string, html: string): Promise<void> {
    // Used in prod
    if (this.resend) {
      const { error } = await this.resend.emails.send({
        from: this.from,
        to,
        subject,
        html,
      });
      if (error) {
        this.logger.error(`Failed to send "${subject}" to ${to}: ${error.message}`);
        throw new Error(`Email delivery failed: ${error.message}`);
      }
      // Use in Dev
    } else {
      await this.transporter!.sendMail({ from: this.from, to, subject, html });
    }
    this.logger.log(`Sent "${subject}" to ${to}`);
  }
}
