export async function api(url = '/api/temas', method = 'GET', body, signal) {
  const response = await fetch(url, {
    method,
    signal,
    headers: body ? { 'Content-Type': 'application/json' } : {},
    body: body ? JSON.stringify(body) : undefined,
  });
  if (!response.ok) {
    const detail = await response.json().catch(() => ({}));
    throw new Error(detail.error || `Error del servidor (${response.status}).`);
  }
  return response.status === 204 ? undefined : response.json();
}
