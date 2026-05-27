import * as Sentry from '@sentry/astro';

const EMAIL_REGEX = /[\w.+-]+@[\w-]+\.[\w.-]+/;
const SENSITIVE_KEYS = new Set(['email', 'name', 'message', 'to', 'from', 'replyTo']);

function scrubObject(obj) {
	if (!obj || typeof obj !== 'object') return;
	for (const key of Object.keys(obj)) {
		const value = obj[key];
		if (typeof value === 'string' && SENSITIVE_KEYS.has(key)) {
			obj[key] = '[Filtered]';
		} else if (value && typeof value === 'object') {
			scrubObject(value);
		}
	}
}

Sentry.init({
	dsn:
		import.meta.env.PUBLIC_SENTRY_DSN ||
		'https://e45e12cd45f5de19cd27f3c1320249c3@o4507371130585088.ingest.us.sentry.io/4508447134121984',

	environment: import.meta.env.PUBLIC_DEPLOY_CONTEXT ?? 'production',
	release: import.meta.env.PUBLIC_COMMIT_REF,

	// Disabled: avoid collecting user IP addresses and cookies
	sendDefaultPii: false,

	integrations: [],

	enableLogs: false,

	beforeSend(event) {
		try {
			if (event.request?.data) {
				scrubObject(event.request.data);
			}
			if (event.contexts?.response?.body) {
				scrubObject(event.contexts.response.body);
			}
			if (Array.isArray(event.breadcrumbs)) {
				for (const breadcrumb of event.breadcrumbs) {
					if (breadcrumb && typeof breadcrumb === 'object') {
						scrubObject(breadcrumb.data);
					}
				}
			}
		} catch {
			// best-effort scrubbing; never break event delivery
		}
		return event;
	},

	beforeBreadcrumb(breadcrumb) {
		if (
			breadcrumb?.category === 'console' &&
			typeof breadcrumb.message === 'string' &&
			(breadcrumb.message.includes('email') ||
				breadcrumb.message.includes('Resend') ||
				EMAIL_REGEX.test(breadcrumb.message))
		) {
			return null;
		}
		return breadcrumb;
	},
});
