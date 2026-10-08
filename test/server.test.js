const { test } = require('node:test');
const assert = require('node:assert/strict');
const { mkdtemp, writeFile, readFile, rm } = require('node:fs/promises');
const { tmpdir } = require('node:os');
const path = require('node:path');
const { once } = require('node:events');
const { createApp } = require('../server');

test('API: CRUD, validación, concurrencia y persistencia', async t => {
  const directory = await mkdtemp(path.join(tmpdir(), 'ruta-core-test-'));
  const file = path.join(directory, 'temas.json');
  await writeFile(file, '[]');
  const server = createApp(file).listen(0, '127.0.0.1');
  await once(server, 'listening');
  t.after(async () => { await new Promise(resolve => server.close(resolve)); await rm(directory, { recursive: true }); });
  const base = `http://127.0.0.1:${server.address().port}`;
  const request = (route, method = 'GET', body) => fetch(base + route, {
    method, headers: { 'Content-Type': 'application/json' }, body: body === undefined ? undefined : JSON.stringify(body),
  });
  assert.equal((await request('/')).status, 200);
  assert.equal((await request('/data/temas.json')).status, 404);
  assert.deepEqual(await (await request('/api/temas')).json(), []);
  assert.equal((await request('/api/temas', 'POST', { titulo: '', grupo: 'ROUTE' })).status, 400);
  assert.equal((await request('/api/temas', 'POST', { titulo: 'Tema', grupo: 'OTRO' })).status, 400);
  const created = await request('/api/temas', 'POST', { titulo: ' Redes ', grupo: 'ROUTE' });
  assert.equal(created.status, 201);
  const tema = await created.json();
  assert.equal(tema.titulo, 'Redes');
  assert.equal(tema.hecho, false);
  assert.equal((await request(`/api/temas/${tema.id}`, 'PATCH', { hecho: 'true' })).status, 400);
  assert.equal((await request(`/api/temas/${tema.id}`, 'PATCH', { id: 'otro' })).status, 400);
  assert.equal((await request('/api/temas/inexistente', 'PATCH', { hecho: true })).status, 404);
  const updates = await Promise.all([
    request(`/api/temas/${tema.id}`, 'PATCH', { hecho: true }),
    ...Array.from({ length: 12 }, (_, index) => request('/api/temas', 'POST', { titulo: `Meta ${index}`, grupo: 'ATP' })),
  ]);
  assert.ok(updates.every(response => response.ok));
  const saved = JSON.parse(await readFile(file, 'utf8'));
  assert.equal(saved.length, 13);
  assert.equal(saved.find(item => item.id === tema.id).hecho, true);
  const second = createApp(file).listen(0, '127.0.0.1');
  await once(second, 'listening');
  try {
    const persisted = await fetch(`http://127.0.0.1:${second.address().port}/api/temas`);
    assert.deepEqual(await persisted.json(), saved);
  } finally { await new Promise(resolve => second.close(resolve)); }
  assert.equal((await request(`/api/temas/${tema.id}`, 'DELETE')).status, 204);
  assert.equal((await request(`/api/temas/${tema.id}`, 'DELETE')).status, 404);
  assert.equal((await (await request('/api/temas')).json()).length, 12);
});
