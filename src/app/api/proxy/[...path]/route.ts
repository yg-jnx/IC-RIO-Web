import { NextRequest, NextResponse } from 'next/server';

const AZURE_API_BASE = 'https://instacrew-prod-api-gvdsdub0d9a6gxhh.uksouth-01.azurewebsites.net/api';

async function handler(request: NextRequest, { params }: { params: Promise<{ path: string[] }> }) {
  const { path } = await params;
  const targetPath = path.join('/');
  const searchParams = request.nextUrl.searchParams.toString();
  const targetUrl = `${AZURE_API_BASE}/${targetPath}${searchParams ? `?${searchParams}` : ''}`;

  const headers: Record<string, string> = {
    'Content-Type': request.headers.get('content-type') || 'application/json; charset=utf-8',
  };

  const authorization = request.headers.get('authorization');
  if (authorization) {
    headers['Authorization'] = authorization;
  }

  let body: BodyInit | undefined;
  if (request.method !== 'GET' && request.method !== 'HEAD') {
    const contentType = request.headers.get('content-type') || '';
    if (contentType.includes('multipart/form-data')) {
      // Forward FormData as-is (don't set Content-Type, let fetch set boundary)
      body = await request.formData();
      delete headers['Content-Type'];
    } else {
      body = await request.text();
    }
  }

  try {
    const response = await fetch(targetUrl, {
      method: request.method,
      headers,
      body,
    });

    const responseContentType = response.headers.get('content-type') || '';
    let data: unknown;

    if (responseContentType.includes('application/json')) {
      data = await response.json();
    } else {
      data = await response.text();
    }

    return NextResponse.json(data, { status: response.status });
  } catch (error) {
    console.error('Proxy error:', error);
    return NextResponse.json({ error: 'Proxy request failed' }, { status: 502 });
  }
}

export const GET = handler;
export const POST = handler;
export const PUT = handler;
export const PATCH = handler;
export const DELETE = handler;
export const OPTIONS = handler;
