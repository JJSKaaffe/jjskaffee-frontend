# Despliegue en Firebase Hosting

El frontend se publica en **Firebase Hosting** del proyecto `jjskafee`. Es una aplicación estática:
`npm run build` genera `dist/` y Firebase sirve esos archivos.

- URL: **https://jjskafee.web.app**
- Configuración: [`firebase.json`](../firebase.json) y [`.firebaserc`](../.firebaserc) (proyecto por defecto `jjskafee`).

## Requisitos

- Las dependencias instaladas (`npm install`).
- Firebase CLI con permisos de despliegue en el proyecto `jjskafee`:
  ```sh
  npm install -g firebase-tools
  firebase login
  ```
  La CLI se instala de forma global y no es una dependencia del proyecto.

## 1. Crear `.env.production.local`

La URL del API y la configuración de Firebase se fijan **al compilar**: Vite las escribe dentro de
los archivos de `dist/`. Crea `.env.production.local` en la raíz del proyecto. Este archivo **no se
sube** a GitHub (`.gitignore` ya lo excluye).

```dotenv
VITE_API_URL=https://<url-del-gateway>/api

VITE_FIREBASE_API_KEY=<la misma de .env.local>
VITE_FIREBASE_AUTH_DOMAIN=jjskafee.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=jjskafee
VITE_FIREBASE_APP_ID=<el mismo de .env.local>
```

- `VITE_API_URL` termina en `/api`, igual que en local: el API Gateway quita ese prefijo antes de
  pasar la petición al backend.
- Al compilar, Vite también lee `.env.local`, pero `.env.production.local` tiene prioridad. Si te
  falta una variable en `.env.production.local`, se usa la de `.env.local` (por ejemplo
  `VITE_API_URL=/api`, que en producción no funciona). Por eso pon las cinco variables.
- `VITE_BACKEND_LOCAL` no hace falta: solo la usa el servidor de desarrollo.

## 2. Compilar

```sh
npm run build
```

Revisa los tipos y deja la versión de producción en `dist/`. Los archivos de `dist/assets/` llevan
un hash en el nombre.

Para revisar el resultado antes de publicarlo, `npm run preview` sirve `dist/` en local.

## 3. Publicar

```sh
firebase deploy --only hosting
```

Al terminar, la CLI muestra la URL: **https://jjskafee.web.app** (también responde
`https://jjskafee.firebaseapp.com`).

## 4. Configuración fuera de este repositorio (una sola vez)

1. **CORS en el backend.** La aplicación llama al API desde otro origen, así que
   `https://jjskafee.web.app` debe estar en la variable `JJSKAFFEE_CORS_ORIGENES` del backend. Si
   falta, el navegador bloquea todas las peticiones al API (error de CORS en la consola).
2. **Dominio autorizado en Firebase Authentication.** En Firebase Console → **Authentication** →
   **Settings** → **Authorized domains**, revisa que `jjskafee.web.app` esté en la lista (Firebase
   suele agregar `jjskafee.web.app` y `jjskafee.firebaseapp.com` solo; si no está, agrégalo).

## Qué hace `firebase.json`

| Regla | Para qué |
|---|---|
| `public: "dist"` | Publica lo que genera `npm run build`. |
| Rewrite de `**` a `/index.html` | El router usa `createWebHistory`: al abrir o recargar `/movimientos`, Firebase entrega `index.html` y Vue Router muestra la pantalla. Los archivos que sí existen en `dist/` se sirven tal cual. |
| `Cache-Control: no-cache` en todo | El navegador vuelve a preguntar por `index.html` (y las rutas de la aplicación) en cada visita, así toma la versión nueva apenas se publica. |
| `Cache-Control: public, max-age=31536000, immutable` en `/assets/**` | Esta regla va después y reemplaza la anterior para `/assets/`. Esos archivos llevan hash: si cambian, cambia el nombre, así que se pueden guardar un año. |
| `X-Content-Type-Options: nosniff` | El navegador no adivina el tipo de archivo. |
| `Referrer-Policy: strict-origin-when-cross-origin` | A otros sitios solo se envía el dominio, no la ruta completa. |
| `X-Frame-Options: DENY` | Nadie puede mostrar la aplicación dentro de un `iframe` (evita *clickjacking*). |

Para revisar los encabezados después de publicar:

```sh
curl -I https://jjskafee.web.app/movimientos
curl -I https://jjskafee.web.app/assets/<un-archivo-de-dist/assets>.js
```

La primera debe mostrar `cache-control: no-cache` y la segunda `max-age=31536000, immutable`.

## Cuando se active el WAF

Con el WAF, el API ya no se llama por la URL del gateway sino por un dominio de `sslip.io` con la IP
pública escrita con guiones (por ejemplo, la IP `203.0.113.10` queda `203-0-113-10.sslip.io`):

1. En `.env.production.local` cambia la URL:
   ```dotenv
   VITE_API_URL=https://<ip-con-guiones>.sslip.io/api
   ```
2. Vuelve a compilar y a publicar. La URL queda fija en `dist/` al compilar, así que cambiar solo el
   archivo no basta:
   ```sh
   npm run build
   firebase deploy --only hosting
   ```

`JJSKAFFEE_CORS_ORIGENES` no cambia: el origen sigue siendo `https://jjskafee.web.app`.
