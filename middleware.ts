import { NextRequest, NextResponse } from 'next/server';

export function middleware(request: NextRequest) {
	// Handle CORS preflight requests
	if (request.method === 'OPTIONS') {
		return new NextResponse(null, {
			status: 200,
			headers: {
				'Access-Control-Allow-Origin': process.env.NODE_ENV === 'production' ? 'https://vyasr.space' : '*',
				'Access-Control-Allow-Methods': 'POST, OPTIONS',
				'Access-Control-Allow-Headers': 'Content-Type, Authorization',
				'Access-Control-Max-Age': '86400',
			},
		});
	}

	// Check request size for API routes (limit to 1MB)
	if (request.nextUrl.pathname.startsWith('/api/')) {
		const contentLength = request.headers.get('content-length');
		if (contentLength && parseInt(contentLength) > 1024 * 1024) {
			return new NextResponse(
				JSON.stringify({ error: 'Request body too large' }),
				{
					status: 413,
					headers: { 'Content-Type': 'application/json' }
				}
			);
		}
	}

	return NextResponse.next();
}

export const config = {
	matcher: [
		// Match all API routes and preflight requests
		'/api/:path*',
	],
};