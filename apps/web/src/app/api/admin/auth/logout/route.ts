import { NextResponse, type NextRequest } from 'next/server';
import { clearSession } from '@/lib/admin/session';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
	await clearSession();
	return NextResponse.redirect(new URL('/admin', request.nextUrl.origin), { status: 303 });
}
