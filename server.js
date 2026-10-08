const express = require('express');
const { readFile, writeFile, rename, mkdir } = require('node:fs/promises');
const path = require('node:path');
const { randomUUID } = require('node:crypto');

function createApp(dataFile = process.env.DATA_FILE || path.join(__dirname, 'data', 'temas.json')) {
  const app = express();
  let queue = Promise.resolve();
  const read = async () => JSON.parse(await readFile(dataFile, 'utf8'));
  function mutate(action) {
    const operation = queue.then(async () => {
      const temas = await read();
      const result = action(temas);
      const temporary = `${dataFile}.tmp`;
      await writeFile(temporary, `${JSON.stringify(temas, null, 2)}\n`, 'utf8');
      await rename(temporary, dataFile);
      return result;
    });
    queue = operation.catch(() => {});
    return operation;
  }
  const fail = (status, message) => Object.assign(new Error(message), { status });
  function validate(body, partial = false) {
    if (!body || typeof body !== 'object' || Array.isArray(body)) throw fail(400, 'Objeto JSON requerido.');
    const keys = Object.keys(body);
    if (!keys.length || keys.some(key => !['titulo', 'grupo', 'hecho', 'descripcion', 'etapa', 'orden', 'nota', 'mono'].includes(key))) throw fail(400, 'Hay campos vacíos o desconocidos.');
    if ((!partial || 'titulo' in body) && (typeof body.titulo !== 'string' || !body.titulo.trim() || body.titulo.trim().length > 200)) throw fail(400, 'El título debe tener entre 1 y 200 caracteres.');
    if ((!partial || 'grupo' in body) && !['ROUTE', 'ATP'].includes(body.grupo)) throw fail(400, 'El grupo debe ser ROUTE o ATP.');
    if ('hecho' in body && typeof body.hecho !== 'boolean') throw fail(400, 'hecho debe ser booleano.');
    for (const key of ['descripcion', 'etapa', 'nota']) {
      if (key in body && (typeof body[key] !== 'string' || body[key].length > 2000)) throw fail(400, `${key} debe ser texto de hasta 2000 caracteres.`);
    }
    if ('orden' in body && (!Number.isInteger(body.orden) || body.orden < 0 || body.orden > 1000)) throw fail(400, 'orden debe ser un entero entre 0 y 1000.');
    if ('mono' in body && typeof body.mono !== 'boolean') throw fail(400, 'mono debe ser booleano.');
    return { ...body, ...('titulo' in body ? { titulo: body.titulo.trim() } : {}) };
  }
  app.disable('x-powered-by');
  app.use(express.json({ limit: '16kb' }));
  app.use('/api', (req, res, next) => { res.set('Cache-Control', 'no-store'); next(); });
  app.get('/api/temas', async (req, res) => {
    await queue;
    res.json(await read());
  });
  app.post('/api/temas', async (req, res) => {
    const fields = validate(req.body);
    const tema = { ...fields, id: randomUUID(), hecho: false };
    await mutate(temas => temas.push(tema));
    res.status(201).json(tema);
  });
  app.patch('/api/temas/:id', async (req, res) => {
    const fields = validate(req.body, true);
    res.json(await mutate(temas => {
      const tema = temas.find(item => item.id === req.params.id);
      if (!tema) throw fail(404, 'Tema no encontrado.');
      Object.assign(tema, fields);
      return tema;
    }));
  });
  app.delete('/api/temas/:id', async (req, res) => {
    await mutate(temas => {
      const index = temas.findIndex(item => item.id === req.params.id);
      if (index === -1) throw fail(404, 'Tema no encontrado.');
      temas.splice(index, 1);
    });
    res.sendStatus(204);
  });
  app.use('/api', (req, res) => res.status(404).json({ error: 'Ruta no encontrada.' }));
  app.use(express.static(path.join(__dirname, 'dist')));
  app.use((error, req, res, next) => {
    const status = error.status || 500;
    if (status >= 500) console.error(error);
    res.status(status).json({ error: status >= 500 ? 'No se pudieron guardar o leer los temas.' : error.message });
  });
  return app;
}

if (require.main === module) {
  const dataFile = process.env.DATA_FILE || path.join(__dirname, 'data', 'temas.json');
  (async () => {
    await mkdir(path.dirname(dataFile), { recursive: true });
    await writeFile(dataFile, '[]\n', { flag: 'wx' }).catch(error => { if (error.code !== 'EEXIST') throw error; });
    const port = Number(process.env.PORT || 3000);
    createApp(dataFile).listen(port, '127.0.0.1', () => console.log(`Ruta Core: http://127.0.0.1:${port}`));
  })().catch(error => { console.error(error); process.exitCode = 1; });
}
module.exports = { createApp };
