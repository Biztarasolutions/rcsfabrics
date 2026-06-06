import { NextResponse } from 'next/server';

/**
 * Proxy GET requests for bulk enquiries to the backend API.
 * Supports pagination (page, limit) and optional search query.
 */
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const page = searchParams.get('page') ?? '1';
  const limit = searchParams.get('limit') ?? '20';
  const search = searchParams.get('search') ?? '';

  const backendUrl = `${process.env.NEXT_PUBLIC_BACKEND_URL || ''}/admin/bulk-enquiries?page=${page}&limit=${limit}&search=${encodeURIComponent(search)}`;

  const backendResponse = await fetch(backendUrl, {
    method: 'GET',
    headers: {
      // forward auth cookie if exists
      cookie: request.headers.get('cookie') || '',
    },
    cache: 'no-store',
  });

  const data = await backendResponse.json();
  return NextResponse.json(data, {
    status: backendResponse.status,
  });
}
