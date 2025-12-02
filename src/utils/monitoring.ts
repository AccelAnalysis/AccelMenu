import * as Sentry from '@sentry/browser';

interface MonitoringOptions {
  dsn?: string;
  environment?: string;
  release?: string;
  tracesSampleRate?: number;
}

export interface FeedbackPayload {
  message: string;
  email?: string;
  name?: string;
  tags?: Record<string, string>;
}

let monitoringInitialized = false;

function readEnv(key: string): string | undefined {
  try {
    if (typeof import.meta !== 'undefined') {
      return (import.meta as any).env?.[key];
    }
    if (typeof process !== 'undefined') {
      return (process.env as Record<string, string | undefined>)[key];
    }
  } catch {
    // ignore
  }
  return undefined;
}

function resolveDsn(options: MonitoringOptions): string | undefined {
  return options.dsn ?? readEnv('VITE_SENTRY_DSN') ?? readEnv('SENTRY_DSN');
}

export function initializeMonitoring(options: MonitoringOptions = {}): boolean {
  if (monitoringInitialized) return monitoringInitialized;

  const dsn = resolveDsn(options);
  if (!dsn) {
    console.info('Sentry DSN not provided; monitoring disabled.');
    return false;
  }

  Sentry.init({
    dsn,
    environment: options.environment ?? readEnv('VITE_SENTRY_ENVIRONMENT') ?? readEnv('NODE_ENV') ?? 'development',
    release: options.release ?? readEnv('VITE_RELEASE') ?? readEnv('RELEASE'),
    tracesSampleRate: options.tracesSampleRate ?? 0.1,
    normalizeDepth: 6,
  });

  monitoringInitialized = true;
  return monitoringInitialized;
}

export function captureError(error: unknown, context?: Record<string, unknown>) {
  if (!monitoringInitialized) {
    console.error('Captured error (monitoring disabled):', error, context);
    return;
  }

  Sentry.captureException(error, {
    extra: context,
  });
}

export function captureFeedback(feedback: FeedbackPayload) {
  if (!feedback.message?.trim()) return;

  if (!monitoringInitialized) {
    console.info('Feedback (monitoring disabled):', feedback);
    return;
  }

  Sentry.captureMessage(feedback.message, {
    level: 'info',
    tags: { ...feedback.tags, channel: 'in-app-feedback' },
    extra: {
      email: feedback.email,
      name: feedback.name,
    },
  });
}
