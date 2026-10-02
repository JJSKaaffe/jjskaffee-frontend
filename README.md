# jjskaffee-frontend

Aplicación web (interfaz de usuario) del sistema de gestión financiera **multi-tenant** para cafeterías pequeñas e independientes, desarrollado por **JJSKaffee**.

> Repositorio hermano: [jjskaffee-backend](https://github.com/JJSKaaffe/jjskaffee-backend)

## Responsabilidades del frontend

- Pantallas para los roles **Administrador** y **Cajero**.
- Registro de ingresos (ventas ligadas al menú, con adiciones) y egresos.
- Inventario, nómina, menú/precios y categorías personalizadas.
- Dashboard y reportes (diarios, semanales, mensuales, anuales) con comparación entre períodos y recomendaciones de IA.
- Configuración de alertas personalizadas.
- Inicio de sesión con **Firebase Authentication**; el token se envía al backend en cada petición.

## Criterios de calidad que guían la interfaz

- **Usabilidad:** registrar una venta en menos de 5 segundos y máximo 3 clics; botón de *deshacer* tras cada acción.
- **Accesibilidad:** flujo de cobro completo solo con teclado (Tab, Enter, Esc), HTML semántico y ARIA.
- **Portabilidad:** compatible con Chrome, Firefox y Edge.
- **Capacidad:** listas largas (50+ categorías) con scroll interno o paginación.
- **Rendimiento:** dashboard en 2-3 segundos; no es en tiempo real, se actualiza al consultar.
- **Seguridad:** ocultar botones no basta; toda autorización la valida el backend.

## Stack

- Framework: *por definir*
- Autenticación: Firebase Authentication (SDK web)

## Estructura

*Pendiente de inicializar cuando se elija el framework.*

## Equipo

JJSKaffee — Proyecto de Ingeniería de Software II.
