export interface AppConfig {
  appBaseUrl: string;
  jwtSecret: string;
  smtpHost: string;
  smtpPort: number;
  smtpApiKey: string;
  mailFrom: string;
  isProd: boolean;
}

export default (): { app: AppConfig } => ({
  app: {
    appBaseUrl: process.env.APP_BASE_URL ?? 'http://localhost:5173',
    jwtSecret: process.env.JWT_SECRET ?? 'dev-only-change-me',
    smtpHost: process.env.SMTP_HOST ?? 'localhost',
    smtpPort: Number(process.env.SMTP_PORT ?? 1025),
    smtpApiKey: process.env.SMTP_API_KEY ?? '',
    mailFrom: process.env.MAIL_FROM ?? 'Cheetah Squad <noreply@arka.local>',
    isProd: process.env.NODE_ENV === 'production',
  },
});
