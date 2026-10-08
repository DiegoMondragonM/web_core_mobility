# Ruta Core

React + Vite construye el front en `dist/`; Express lo sirve y persiste metas en `data/temas.json`. Requiere Node.js 22.12 o posterior. El proyecto ya estaba inicializado y tenía Express instalado.

```sh
npm ci
npm run dev
```

Abrir http://127.0.0.1:5173. `npm run dev` inicia Vite y Express juntos; Vite reenvía `/api` a Express en el puerto 3000. `npm test` compila el front y verifica CRUD, validación, cambios concurrentes y persistencia usando datos temporales.

Para producción local: `npm run build` y `npm start`; abrir http://127.0.0.1:3000.

El front se edita en `src/App.jsx`, `src/Stage.jsx`, `src/StudyContent.jsx` y `src/styles.css`. `index.html` es la entrada de Vite. `index (1).html` es solo la referencia original.

## Datos y API

La interfaz muestra una etapa a la vez, primero ROUTE y después ATP, ordenadas por `orden` dentro de cada grupo. Los controles Anterior/Siguiente y el total de etapas se calculan con los datos cargados. El avance total incluye todos los temas. Las notas y descripciones se conservan en el JSON aunque no se muestran en las tarjetas. El diseño usa todo el ancho y organiza los temas en columnas adaptables.

## Actualizar el servidor existente (Ubuntu)

Sitio: https://rutacore.duckdns.org. Ejecutar como `ubuntu` después de subir los cambios al repositorio. Estos comandos actualizan `/home/ubuntu/mi-web` y reinician únicamente el proceso existente `web-core`. No se necesitan cambios de nginx ni nuevas rutas.

```bash
(
  set -e
  export NVM_DIR="$HOME/.nvm"
  . "$NVM_DIR/nvm.sh"
  nvm use 22
  cd /home/ubuntu/mi-web
  test -s /home/ubuntu/mi-web-data/temas.json
  cp -p /home/ubuntu/mi-web-data/temas.json "/home/ubuntu/mi-web-data/temas.backup-$(date +%Y%m%d-%H%M%S).json"
  git pull --ff-only
  npm ci --include=dev
  npm run build
  node --test
  DATA_FILE=/home/ubuntu/mi-web-data/temas.json pm2 restart web-core --update-env
  pm2 save
  pm2 status web-core
)
```

Node 22 debe estar instalado con NVM y ser 22.12 o superior; `pm2` debe estar disponible con esa versión. Se conserva el puerto configurado en el proceso existente. No copiar `data/temas.json` del repositorio sobre `/home/ubuntu/mi-web-data/temas.json`. Después, abrir el dominio y comprobar el avance autenticándose normalmente. No se ha ejecutado este despliegue desde el entorno local.

Migrados los 44 temas de `index (1).html`: 34 de ROUTE en siete etapas y 10 de ATP, todos con `hecho: false`. Se conservan IDs, descripciones, notas, orden y tipografía de las etapas. El front React conserva el diseño original, el mapa, los reflejos y el reinicio de avance. El archivo original queda como referencia.

Formato actual de cada tema:

```json
{ "id": "identificador-unico", "grupo": "ROUTE", "titulo": "Nombre del tema", "hecho": false }
```

| Método | Ruta | Resultado |
| --- | --- | --- |
| GET | `/api/temas` | Lista completa |
| POST | `/api/temas` | Crea con `titulo`, `grupo` (ROUTE o ATP) y `hecho: false` |
| PATCH | `/api/temas/:id` | Actualiza `hecho`, `titulo` o `grupo` |
| DELETE | `/api/temas/:id` | Elimina un tema |

Los campos opcionales `descripcion`, `etapa`, `orden`, `nota` y `mono` preservan la presentación original. El formulario permite agregar metas a cualquier etapa. El avance es compartido por todos los usuarios autenticados; no hay cuentas con progreso separado.

No se usa localStorage. Las escrituras se serializan y reemplazan el archivo mediante rename. Ejecutar **una sola instancia**, sin modo cluster ni varios procesos escritores. Hacer copias de seguridad del JSON. `DATA_FILE` permite guardar los datos fuera del código; `PORT` cambia el puerto. El servidor escucha solamente en loopback para que el acceso público pase por nginx.

## Despliegue por Git en Oracle Cloud (Ubuntu/Debian)

El usuario subirá el proyecto a Git y lo descargará en Oracle. El despliegue remoto todavía no se ha ejecutado. Sustituir `URL_DEL_REPOSITORIO`, `USUARIO` y `DOMINIO`. Se necesita Node.js compatible, npm y Git en el servidor, un dominio apuntando a él y los puertos 80 y 443 accesibles en la red de Oracle y en el firewall del sistema. Esta receta usa Ubuntu/Debian; si la VM tiene Oracle Linux, hay que adaptar paquetes, rutas y permisos de nginx a ese sistema.

1. Para subir desde esta carpeta a un repositorio vacío:

```sh
git init
git add .
git commit -m "Implementar Ruta Core con Express y persistencia JSON"
git branch -M main
git remote add origin URL_DEL_REPOSITORIO
git push -u origin main
```

`node_modules` está excluido. El JSON del repositorio contiene los temas iniciales; el progreso de producción se guarda fuera del repositorio para conservarlo durante `git pull`.

2. En el servidor, como usuario de la aplicación:

```sh
git clone URL_DEL_REPOSITORIO ~/ruta-core
cd ~/ruta-core
npm ci --include=dev
npm run build
npm install -g pm2
mkdir -p "$HOME/.local/share/ruta-core"
```

Si el archivo persistente todavía no existe, copiar ahí los datos iniciales:

```sh
test -e "$HOME/.local/share/ruta-core/temas.json" || cp data/temas.json "$HOME/.local/share/ruta-core/temas.json"
DATA_FILE="$HOME/.local/share/ruta-core/temas.json" pm2 start server.js --name ruta-core
pm2 save
pm2 startup
```

Ejecutar el comando con sudo que imprima `pm2 startup`, después `pm2 save`. Para actualizar:

```sh
cd ~/ruta-core
git pull --ff-only
npm ci --include=dev
npm run build
pm2 restart ruta-core
```

No copiar nuevamente el JSON inicial sobre el archivo persistente. No ejecutar otro `pm2 start`.

3. Instalar nginx, la herramienta de contraseñas y Certbot:

```sh
sudo apt update
sudo apt install nginx apache2-utils certbot python3-certbot-nginx
sudo htpasswd -c /etc/nginx/.htpasswd-ruta-core USUARIO
sudo chown root:www-data /etc/nginx/.htpasswd-ruta-core
sudo chmod 640 /etc/nginx/.htpasswd-ruta-core
sudo mkdir -p /var/www/letsencrypt
```

`htpasswd` pide la contraseña interactivamente. Usar `-c` solo al crear el archivo; omitirlo para agregar usuarios posteriores.

4. Sustituir `DOMINIO` en `deploy/ruta-core.nginx.conf`, copiarlo y habilitarlo:

```sh
sudo cp deploy/ruta-core.nginx.conf /etc/nginx/sites-available/ruta-core
sudo ln -s /etc/nginx/sites-available/ruta-core /etc/nginx/sites-enabled/ruta-core
sudo nginx -t
sudo systemctl reload nginx
sudo certbot --nginx -d DOMINIO --redirect
```

La plantilla devuelve 503 hasta tener TLS para evitar pedir contraseñas por HTTP. Después de que Certbot termine, quitar `return 503;` del bloque HTTPS en `/etc/nginx/sites-available/ruta-core`. Conservar la redirección de HTTP a HTTPS que agrega Certbot.

```sh
sudo nginx -t
sudo systemctl reload nginx
sudo certbot renew --dry-run
curl -I http://DOMINIO
curl -I https://DOMINIO
curl -u USUARIO https://DOMINIO/api/temas
```

Comprobar redirección a HTTPS, respuesta 401 sin credenciales y respuesta JSON autenticada. Revisar también la renovación automática instalada por el paquete (`systemctl list-timers`). El puerto 3000 no necesita estar abierto al exterior.

Documentación: [nginx auth_basic](https://nginx.org/en/docs/http/ngx_http_auth_basic_module.html), [PM2 startup](https://pm2.keymetrics.io/docs/usage/startup/), [Certbot con nginx](https://certbot.eff.org/instructions?ws=nginx&os=snap).

La compilación requiere las dependencias de desarrollo. `dist/` se genera en el servidor y no se sube a Git. PM2 sigue ejecutando `server.js`; nginx sigue apuntando al puerto 3000. [Documentación de compilación de Vite](https://vite.dev/guide/build).
