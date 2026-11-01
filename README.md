# jjskaffee-frontend

Aplicación web (interfaz de usuario) del sistema de gestión financiera **multi-tenant** para cafeterías pequeñas e independientes, desarrollado por **JJSKaffee**.

> Repositorios hermanos: [jjskaffee-backend](https://github.com/JJSKaaffe/jjskaffee-backend) · [jjskaffee-docs](https://github.com/JJSKaaffe/jjskaffee-docs) (documentación)

## Stack

- **Vue 3** con **TypeScript** y **Vite**
- **Vue Router** (pantallas y guardas por permiso) y **Pinia** (estado)
- **Firebase Authentication** (SDK web) para iniciar sesión
- **Vitest** para pruebas, **ESLint** y **Oxlint** para revisar el código, **Prettier** para el formato

## Requisitos

- **Node.js 24 LTS** (o 22.18 en adelante) con **npm 11**. Revisa con `node -v` y `npm -v`.
  - Si `npm -v` muestra 10.x, actualízalo con `npm install -g npm@11`: npm 10 falla al instalar estas dependencias.
- **Visual Studio Code**. Al abrir la carpeta, VS Code sugiere las extensiones recomendadas del proyecto (Vue - Official, ESLint, Prettier, Vitest, EditorConfig y Oxc): instálalas.
- El **backend** corriendo en local (`http://localhost:8080`, perfil `local`) para probar contra la API.

## Cómo correrlo en VS Code

1. Abre la carpeta `jjskaffee-frontend` en VS Code y abre la terminal (`` Ctrl+` ``).
2. Instala las dependencias:
   ```sh
   npm install
   ```
3. Copia `.env.example` como `.env.local` y llena la configuración web de Firebase
   (Consola de Firebase → Configuración del proyecto → General → Tus apps → app web). `.env.local` no se sube a GitHub.
4. Arranca el servidor de desarrollo:
   ```sh
   npm run dev
   ```
5. Abre `http://localhost:5173`.

En local, las peticiones a `/api/...` las reenvía Vite al backend sin el prefijo `/api`, igual que hace el API Gateway en la nube. Por eso no hace falta configurar CORS en el backend.

## Comandos

| Comando | Qué hace |
|---|---|
| `npm run dev` | Servidor de desarrollo con recarga automática |
| `npm test` | Corre las pruebas una vez (`npm run test:unit` las deja vigilando cambios) |
| `npm run lint` | Revisa el código con Oxlint y ESLint, incluidas las reglas de paquetes |
| `npm run format` | Formatea `src/` con Prettier |
| `npm run build` | Revisa los tipos y genera la versión de producción en `dist/` |

## Despliegue

Se publica en **Firebase Hosting** (proyecto `jjskafee`): **https://jjskafee.web.app**.

1. Crea `.env.production.local` (no se sube) con `VITE_API_URL=https://<url-del-gateway>/api` y las mismas `VITE_FIREBASE_*` de `.env.local`. La URL del API queda fija al compilar.
2. `npm run build`
3. `firebase deploy --only hosting`

`https://jjskafee.web.app` debe estar en `JJSKAFFEE_CORS_ORIGENES` del backend y en los dominios autorizados de Firebase Authentication. Pasos completos, qué hace `firebase.json` y qué cambiar cuando se active el WAF: [docs/despliegue.md](docs/despliegue.md).

## Estructura

Se organiza por **módulo de negocio**, igual que el backend. Es la estructura del [diagrama de paquetes](https://github.com/JJSKaaffe/jjskaffee-docs/blob/main/diseno/03-diagrama-paquetes.md).

```text
src
├── main.ts · App.vue          (arranque y barra de navegación según el rol)
├── router/index.ts            (rutas y guardas: sesión, cafetería elegida y permiso)
├── compartido/
│   ├── api/clienteHttp.ts     (único que hace peticiones: token, X-Cafeteria-Id, Idempotency-Key, errores)
│   ├── sesion/                (sesionStore: persona, cafetería elegida, rol y permisos)
│   ├── auth/firebase.ts       (inicio y cierre de sesión con Firebase Authentication)
│   ├── componentes/           (MarcaJJSKaffee, MensajeAviso, MontoDinero)
│   ├── estilos/tema.css       (paleta de café y piezas comunes: tarjetas, campos, botones)
│   └── utils/formato.ts       (pesos colombianos y fechas en hora de Colombia)
└── modulos/
    ├── acceso/                (iniciar sesión y elegir cafetería)
    ├── ingresos/              (venta e ingreso libre)
    └── movimientos/           (listado con filtros y totales)
        └── vistas · componentes · store · api · tipos   (cada módulo tiene las mismas carpetas)
```

**Egresos no está en esta entrega.** Esta entrega cubre registrar ingresos; registrar egresos queda fuera de alcance y el backend no expone sus categorías. Movimientos sí muestra los egresos que devuelva el backend.

## Diseño

Un solo diseño para todas las cafeterías, sin configuración por cafetería. Los colores están como variables en [`tema.css`](src/compartido/estilos/tema.css) y los componentes usan solo esas variables:

| Variable | Color | Uso |
|---|---|---|
| `--color-espresso` | `#3b2a20` | Textos fuertes y barra superior |
| `--color-cafe` | `#6f4e37` | Marca y botones principales |
| `--color-caramelo` | `#c08552` | Acentos (menú activo, vapor de la taza); no se usa como texto |
| `--color-crema` | `#f5ede3` | Fondo de la página |
| `--color-leche` | `#fffaf4` | Fondo de tarjetas |
| `--color-borde` | `#e6d9cc` | Bordes |

Los ingresos van en verde y los errores y egresos en rojo. Todos los textos cumplen contraste WCAG AA. La marca (`MarcaJJSKaffee`: taza en SVG + "JJSKaffee") aparece grande al iniciar sesión y al elegir cafetería, y pequeña en la barra junto al nombre de la cafetería, que también va en el título de la pestaña. El favicon es la misma taza (`public/favicon.svg`).

## Reglas del código

ESLint hace cumplir las reglas del diagrama de paquetes, igual que ArchUnit en el backend:

1. **Un módulo no importa otro módulo**: lo común va en `compartido`.
2. **`compartido` no depende de ningún módulo.**
3. **Solo `compartido/api/clienteHttp.ts` hace peticiones** (`fetch`): así el token y la cafetería se agregan en un solo lugar.
4. Las vistas usan su **store**, el store usa su **api** y la api usa sus **tipos**.
5. Entre carpetas se importa siempre con `@/` (por ejemplo `@/compartido/api/clienteHttp`).
6. Ocultar un botón no es seguridad: el backend vuelve a revisar el permiso en cada petición.

## Validaciones en GitHub

El workflow [Calidad y Seguridad](.github/workflows/calidad-y-seguridad.yml) corre en cada push y pull request, con dos jobs en paralelo:

- **Lint, tipos, pruebas y build**: Oxlint y ESLint sin `--fix` (incluidas las reglas del diagrama de paquetes, el equivalente de ArchUnit en el backend), revisión de tipos con `vue-tsc`, pruebas con Vitest y build de producción.
- **Escaneo Trivy**: busca vulnerabilidades en las dependencias (`package-lock.json`), secretos en el código y configuraciones inseguras. Falla si encuentra algo de severidad alta o crítica que ya tenga corrección.

Dependabot revisa cada semana si hay versiones nuevas de los paquetes npm y de las acciones de GitHub.

Para correr Trivy en local, igual que en GitHub:

```sh
trivy fs --scanners vuln,secret,misconfig --severity HIGH,CRITICAL --ignore-unfixed --skip-dirs node_modules --skip-files .env.local .
```

## Estado

- **Listo**: estructura, Firebase, cliente HTTP, sesión, guardas por permiso, stores y api de los tres módulos con los tipos de los DTO del backend, y pruebas del cliente HTTP y los formatos.
- **Por construir**: las pantallas. Cada vista indica qué store y qué funciones usar.

## Criterios de calidad que guían la interfaz

- **Usabilidad:** registrar una venta en menos de 5 segundos y máximo 3 clics; botón de *deshacer* tras cada venta (60 s).
- **Accesibilidad:** flujo de cobro completo solo con teclado (Tab, Enter, Esc), HTML semántico y ARIA.
- **Portabilidad:** compatible con Chrome, Firefox y Edge.
- **Capacidad:** listas largas (50+ categorías) con scroll interno o paginación.
- **Rendimiento:** dashboard en 2–3 segundos; no es en tiempo real, se actualiza al consultar.
- **Seguridad:** toda autorización la valida el backend.

## Equipo

JJSKaffee — Proyecto de Ingeniería de Software II.
