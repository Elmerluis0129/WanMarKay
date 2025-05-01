# Sistema de Registro de Facturas Mary Kay

Este proyecto es una aplicación web para gestionar facturas de productos Mary Kay, permitiendo a los administradores crear facturas y usuarios, mientras que los clientes pueden ver sus propias facturas.

## Características

- Sistema de autenticación para administradores y clientes
- Creación y gestión de usuarios
- Creación de facturas con múltiples productos
- Cálculo automático de subtotales, ITBIS y totales
- Vista de facturas filtrada por rol (administrador ve todas, cliente ve solo las suyas)
- Interfaz moderna y fácil de usar con los colores corporativos de Mary Kay

## Requisitos Previos

- Node.js (versión 14 o superior)
- npm (incluido con Node.js)

## Instalación

1. Clona el repositorio:
```bash
git clone [URL_DEL_REPOSITORIO]
cd registrar-facturas-mk
```

2. Instala las dependencias:
```bash
npm install
```

## Ejecución

Para iniciar la aplicación en modo desarrollo:

```bash
npm start
```

La aplicación se abrirá automáticamente en tu navegador predeterminado en `http://localhost:3000`.

## Estructura del Proyecto

```plaintext
src/
  ├── components/
  │   ├── auth/
  │   │   ├── Login.tsx
  │   │   └── PrivateRoute.tsx
  │   ├── admin/
  │   │   ├── AdminDashboard.tsx
  │   │   ├── CreateUser.tsx
  │   │   ├── CreateInvoice.tsx
  │   │   └── RegisterPayment.tsx      # Formulario para registrar pagos de cuotas
  │   ├── client/
  │   │   └── ClientDashboard.tsx
  │   └── shared/
  │       ├── InvoiceList.tsx         # Lista de facturas con filtros y acciones
  │       ├── Navigation.tsx           # Barra de navegación y título de sección
  │       └── PaymentDetailsModal.tsx  # Modal de detalles de factura y registro de pagos (admin)
  ├── routes/
  │   └── AppRoutes.tsx               # Definición de rutas protegidas y públicas
  ├── services/
  │   └── auth.ts                     # Lógica de autenticación y roles
  ├── utils/
  │   ├── storage.ts                  # Wrapper de localStorage para usuarios y facturas
  │   └── dateUtils.ts                # Utilidades para cálculo de fechas y días restantes
  ├── types/
  │   ├── invoice.ts                  # Tipos y enums de facturas y plan de pago
  │   ├── user.ts                     # Tipo de usuario
  │   ├── index.ts                    # Reexportación de tipos
  │   └── autosuggest-highlight.d.ts  # Declaraciones de módulos para autosuggest-highlight
  ├── App.tsx                         # Componente raíz y proveedor de tema
  ├── index.tsx                       # Punto de entrada de React
  ├── App.test.tsx                    # Test de renderizado básico de App
  └── utils/
      └── dateUtils.test.ts           # Tests unitarios de utilidades de fecha
```

## Uso

### Como Administrador

1. Inicia sesión con credenciales de administrador.
2. En el panel de administrador podrás:
   - Crear usuarios (clientes o administradores).
   - Crear facturas con plan de pagos (configurar frecuencia y cuotas).
   - Ver todas las facturas con filtros por estado, tipo, cliente o rango de fechas.
   - Registrar pagos de cada cuota directamente desde el modal de detalles de factura.
   - Cambiar el estado de la factura a "Pagada" o "Cancelada" cuando corresponda.

### Como Cliente

1. Inicia sesión con las credenciales proporcionadas por el administrador.
2. En tu panel de cliente podrás:
   - Ver la lista de tus facturas filtradas.
   - Consultar detalles de cada factura (productos, totales y plan de pagos).
   - Ver el historial de pagos realizados y los días restantes para tu siguiente cuota.

## Almacenamiento

Actualmente los datos se conservan en `localStorage` usando los servicios y utilidades de `storage.ts`. En futuras versiones se integrará una API REST con base de datos.

## Colores Corporativos

- Rosa Principal: #E31C79
- Rosa Secundario: #C4156A
- Blanco: #FFFFFF
- Gris Texto: #666666

## Contribución

Para contribuir al proyecto:

1. Haz un fork del repositorio
2. Crea una rama para tu característica (`git checkout -b feature/AmazingFeature`)
3. Haz commit de tus cambios (`git commit -m 'Add some AmazingFeature'`)
4. Push a la rama (`git push origin feature/AmazingFeature`)
5. Abre un Pull Request

## Licencia


