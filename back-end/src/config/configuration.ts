import { registerAs } from '@nestjs/config';

/**
 * Typed application config, namespaced under `app`.
 * Read it via `configService.get('app', { infer: true })` or with the
 * `AppConfig` type below.
 */
export interface AppConfig {
  /** Frontend origin — used for CORS and for building magic-link URLs. */
  appBaseUrl: string;
  jwtSecret: string;
  smtpHost: string;
  smtpPort: number;
  mailFrom: string;
  isProd: boolean;
}

export default registerAs(
  'app',
  (): AppConfig => ({
    appBaseUrl: process.env.APP_BASE_URL ?? 'http://localhost:5173',
    jwtSecret: process.env.JWT_SECRET ?? 'dev-only-change-me',
    smtpHost: process.env.SMTP_HOST ?? 'localhost',
    smtpPort: Number(process.env.SMTP_PORT ?? 1025),
    mailFrom: process.env.MAIL_FROM ?? 'Cheetah Squad <noreply@arka.local>',
    isProd: process.env.NODE_ENV === 'production',
  }),
);
