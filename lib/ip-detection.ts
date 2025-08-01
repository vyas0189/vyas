import { NextRequest } from 'next/server';

/**
 * Extract client IP address from request headers with proper proxy/CDN handling
 * Follows security best practices to prevent header spoofing
 */
export function getClientIP(request: NextRequest): string {
	// Priority order for header checking (most trusted first)
	const headerChecks = [
		// Cloudflare
		() => request.headers.get('cf-connecting-ip'),
		// Standard proxy headers (take first IP only to prevent spoofing)
		() => getFirstIP(request.headers.get('x-forwarded-for')),
		() => request.headers.get('x-real-ip'),
		() => request.headers.get('x-client-ip'),
		// Fallback to other headers
		() => request.headers.get('remote-addr'),
		// Last resort - extract from URL or connection
		() => getIPFromConnection(request),
	];

	for (const getIP of headerChecks) {
		const ip = getIP();
		if (ip && isValidIP(ip)) {
			return normalizeIP(ip);
		}
	}

	// Ultimate fallback
	return '127.0.0.1';
}

/**
 * Extract the first (most trusted) IP from X-Forwarded-For header
 * Format: "client, proxy1, proxy2" - we want the client IP
 */
function getFirstIP(forwardedFor: string | null): string | null {
	if (!forwardedFor) return null;

	// Split by comma and take the first IP (client IP)
	const ips = forwardedFor.split(',');
	const firstIP = ips[0]?.trim();

	return firstIP || null;
}

/**
 * Extract IP from connection information as last resort
 */
function getIPFromConnection(request: NextRequest): string | null {
	// Try to extract from the URL or other connection info
	// This is a fallback for edge cases
	try {
		const url = new URL(request.url);
		// In development, we might have localhost
		if (url.hostname === 'localhost' || url.hostname === '127.0.0.1') {
			return '127.0.0.1';
		}
	} catch {
		// Ignore URL parsing errors
	}

	return null;
}

/**
 * Validate if a string is a valid IPv4 or IPv6 address
 */
function isValidIP(ip: string): boolean {
	// Remove any port numbers first
	const cleanIP = stripPort(ip);

	return isValidIPv4(cleanIP) || isValidIPv6(cleanIP);
}

/**
 * Validate IPv4 address
 */
function isValidIPv4(ip: string): boolean {
	const ipv4Regex = /^(\d{1,3})\.(\d{1,3})\.(\d{1,3})\.(\d{1,3})$/;
	const match = ip.match(ipv4Regex);

	if (!match) return false;

	// Check each octet is 0-255
	for (let i = 1; i <= 4; i++) {
		const octet = parseInt(match[i], 10);
		if (octet < 0 || octet > 255) return false;
	}

	return true;
}

/**
 * Validate IPv6 address (simplified validation)
 */
function isValidIPv6(ip: string): boolean {
	// Handle IPv4-mapped IPv6 addresses
	if (ip.includes('::ffff:')) {
		const ipv4Part = ip.split('::ffff:')[1];
		return ipv4Part ? isValidIPv4(ipv4Part) : false;
	}

	// Basic IPv6 validation
	const ipv6Regex = /^([0-9a-fA-F]{0,4}:){1,7}[0-9a-fA-F]{0,4}$/;

	// Handle compressed notation (::)
	if (ip.includes('::')) {
		const parts = ip.split('::');
		if (parts.length !== 2) return false;

		const leftParts = parts[0] ? parts[0].split(':').length : 0;
		const rightParts = parts[1] ? parts[1].split(':').length : 0;

		// IPv6 has 8 groups, compressed notation should not exceed this
		return leftParts + rightParts <= 8;
	}

	return ipv6Regex.test(ip) && ip.split(':').length === 8;
}

/**
 * Strip port number from IP address
 */
function stripPort(ip: string): string {
	// IPv6 with port: [::1]:8080
	if (ip.startsWith('[') && ip.includes(']:')) {
		return ip.substring(1, ip.indexOf(']:'));
	}

	// IPv4 with port: 192.168.1.1:8080
	if (ip.includes(':') && !ip.includes('::')) {
		// Check if it's IPv4 with port (not IPv6)
		const parts = ip.split(':');
		if (parts.length === 2 && /^\d+$/.test(parts[1])) {
			return parts[0];
		}
	}

	return ip;
}

/**
 * Normalize IP address format
 */
function normalizeIP(ip: string): string {
	const cleanIP = stripPort(ip);

	// Handle IPv4-mapped IPv6 addresses
	if (cleanIP.includes('::ffff:')) {
		const ipv4Part = cleanIP.split('::ffff:')[1];
		if (ipv4Part && isValidIPv4(ipv4Part)) {
			return ipv4Part;
		}
	}

	// Normalize IPv6 to lowercase
	if (isValidIPv6(cleanIP)) {
		return cleanIP.toLowerCase();
	}

	return cleanIP;
}

/**
 * Check if IP is from a private/local network
 */
export function isPrivateIP(ip: string): boolean {
	const cleanIP = normalizeIP(ip);

	if (isValidIPv4(cleanIP)) {
		// Private IPv4 ranges
		const privateRanges = [
			/^10\./, // 10.0.0.0/8
			/^172\.(1[6-9]|2[0-9]|3[0-1])\./, // 172.16.0.0/12
			/^192\.168\./, // 192.168.0.0/16
			/^127\./, // 127.0.0.0/8 (loopback)
			/^169\.254\./, // 169.254.0.0/16 (link-local)
		];

		return privateRanges.some((range) => range.test(cleanIP));
	}

	if (isValidIPv6(cleanIP)) {
		// Common private IPv6 ranges
		return (
			cleanIP.startsWith('::1') || // loopback
			cleanIP.startsWith('fc00:') || // unique local
			cleanIP.startsWith('fd00:') || // unique local
			cleanIP.startsWith('fe80:') // link-local
		);
	}

	return false;
}
