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

```
src/
  ├── components/
  │   ├── auth/
  │   │   ├── Login.tsx
  │   │   └── PrivateRoute.tsx
  │   ├── admin/
  │   │   ├── CreateUser.tsx
  │   │   ├── CreateInvoice.tsx
  │   │   └── AdminDashboard.tsx
  │   ├── client/
  │   │   └── ClientDashboard.tsx
  │   └── shared/
  │       └── InvoiceList.tsx
  ├── types/
  │   ├── user.ts
  │   └── invoice.ts
  ├── services/
  │   ├── auth.ts
  │   └── storage.ts
  └── App.tsx
```

## Uso

### Como Administrador

1. Inicia sesión con credenciales de administrador
2. Accede al panel de administración donde puedes:
   - Crear nuevos usuarios (clientes o administradores)
   - Crear nuevas facturas
   - Ver todas las facturas en el sistema

### Como Cliente

1. Inicia sesión con las credenciales proporcionadas por el administrador
2. Accede al panel de cliente donde puedes:
   - Ver tus facturas
   - Ver los detalles de cada factura

## Almacenamiento

Por el momento, la aplicación utiliza almacenamiento local (localStorage) para guardar los datos. En una versión futura, se implementará una base de datos persistente.

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

Este proyecto está bajo la Licencia MIT. Ver el archivo `LICENSE` para más detalles.
