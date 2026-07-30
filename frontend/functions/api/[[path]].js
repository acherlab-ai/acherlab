export async function onRequest(context) {
  const url = new URL(context.request.url);
  const apiUrl = context.env.BACKEND_URL || 'https://acherlab-production.up.railway.app';
  const target = `${apiUrl}${url.pathname}${url.search}`;

  const headers = new Headers(context.request.headers);
  headers.delete('host');

  const body = context.request.method !== 'GET' && context.request.method !== 'HEAD'
    ? await context.request.text()
    : undefined;

  const resp = await fetch(target, {
    method: context.request.method,
    headers,
    body,
  });

  const respHeaders = new Headers(resp.headers);
  respHeaders.set('access-control-allow-origin', '*');

  return new Response(resp.body, {
    status: resp.status,
    headers: respHeaders,
  });
}
