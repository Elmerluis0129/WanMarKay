# 📋 Sistema de Registro de Facturas Mary Kay

**FacturaMK** es una aplicación web SPA construida en React + TypeScript que ofrece:

- Autenticación y gestión de roles (administrador y cliente).
- CRUD de usuarios, facturas y pagos con base de datos en Supabase.
- Panel de administrador para crear y listar facturas, usuarios y pagos.
- Panel de cliente para consultar sus propias facturas y historial de pagos.
- Subida y vista de imágenes (facturas y comprobantes).
- Exportación de factura a PDF desde el modal de detalles.
- Filtros avanzados, resaltado de texto, gráficos de resumen y diseño responsivo.
- Gestión de sesiones y seguridad avanzada.

---

## 📦 Tecnologías

- React 18
- TypeScript
- Material UI (MUI)
- Supabase (PostgreSQL + Storage)
- Vercel (despliegue frontend)
- jsPDF + html2canvas (exportar a PDF)
- Recharts (gráficos)
- React Router v6 (enrutamiento)
- React Query (gestión de estado y caché)
- React Hook Form (formularios)
- Yup (validaciones)

---

## 🚀 Instalación y puesta en marcha

### Requisitos previos
- Node.js 16.x o superior
- npm 7.x o superior
- Cuenta en Supabase (gratuita o de pago)

### Pasos de instalación

1. Clona el repositorio:
   ```bash
   git clone https://github.com/tu-usuario/FacturaMK.git
   cd FacturaMK
   ```

2. Instala dependencias:
   ```bash
   npm install
   ```

3. Renombra `.env.local.example` a `.env.local` y configura:
   ```dotenv
   REACT_APP_SUPABASE_URL=your_supabase_url
   REACT_APP_SUPABASE_ANON_KEY=your_anon_key
   ```

4. Ejecuta en modo desarrollo:
   ```bash
   npm start
   ```
   La app estará disponible en `http://localhost:3000`.

### Despliegue en producción
Para producción, genera el build y despliega en Vercel:
```bash
npm run build
```

---

## 📂 Estructura del proyecto

```text
src/
├─ components/
│  ├─ auth/           # Login y rutas protegidas
│  ├─ admin/          # Dashboard admin, formularios CRUD
│  ├─ client/         # Dashboard cliente
│  └─ shared/         # Navegación, listas, modales, gráficos
├─ routes/            # Configuración de rutas React Router
├─ services/          # Lógica de acceso a Supabase (auth, user, invoice, payment)
├─ types/             # Definición de interfaces y tipos
├─ utils/             # Utilidades (fechas, validaciones)
└─ App.tsx            # Proveedor de tema, CssBaseline y rutas
```

---

## 🧑‍💼 Casos de uso

### 1. Administrador

**Objetivo**: Gestionar usuarios, facturas y pagos.

1. Iniciar sesión con credenciales de administrador.
2. Acceder al **Panel de Administrador**:
   - **Crear Usuario**: Registrar nuevos clientes o administradores.
   - **Crear Factura**: Completar datos (cliente, fecha, items, plan de pagos).
   - **Listar Facturas**: Filtrar por estado, tipo, cliente o fecha.
     - Abrir **Detalle** en modal para:
       - Cambiar estado (Pendiente → Pagada/Cancelada) con confirmación.
       - Registrar pago de cuotas (subir comprobante).
       - Ver historial de pagos de esa factura.
       - **Exportar a PDF** todo el detalle.
   - **Listar Usuarios**: Buscar, filtrar y ver datos de usuarios.
   - **Listar Pagos**: Revisión global de todos los pagos registrados.

### 2. Cliente

**Objetivo**: Consultar facturas y pagos.

1. Iniciar sesión con credenciales de cliente.
2. Acceder al **Panel de Cliente**:
   - **Mis Facturas**: Solo las facturas asociadas al cliente.
   - Visualizar estado, totales y plan de pagos.
   - Abrir modal de detalles de factura:
     - Ver historial de pagos.
     - Descargar factura en PDF.

---

## 🔧 Funcionalidades destacadas

### Autenticación y Seguridad
- Autenticación basada en JWT con Supabase
- Protección de rutas por rol (admin/cliente)
- Sesiones persistentes con refresh token
- Validación de formularios con Yup
- Sanitización de inputs


### Gestión de Archivos
- Subida de imágenes con preview
- Almacenamiento en Supabase Storage
- Optimización de imágenes antes de subir
- Validación de tipos y tamaños de archivo
- Generación de URLs seguras

### Sistema de Notificaciones
- Notificaciones temporales (Snackbars) para feedback de acciones
- Alertas de estado de operaciones
- Mensajes de confirmación para acciones importantes

### Filtros y Búsqueda
- Filtros avanzados en tablas
- Resaltado dinámico de coincidencias
- Búsqueda por múltiples campos
- Ordenamiento por columnas
- Paginación de resultados

### Exportación y Reportes
- Exportación a PDF con diseño responsivo
- Generación de reportes personalizados
- Gráficos interactivos de resumen
- Estadísticas de ventas y pagos

### UI/UX
- Diseño responsivo con Material UI
- Modo oscuro/claro
- Animaciones suaves
- Feedback visual de acciones
- Accesibilidad WCAG 2.1

---

## 🌈 Temas y estilos

- Rosa Mary Kay: `#E31C79` (primario), `#C4156A` (oscuro).
- Tipografía: Roboto, sans-serif.
- Configurado en `App.tsx` con `createTheme` de MUI.
- Soporte para modo oscuro/claro.
- Diseño consistente en toda la aplicación.

---

## 🔍 Troubleshooting

### Problemas comunes y soluciones

1. **Error de conexión a Supabase**
   - Verificar las variables de entorno
   - Comprobar la conexión a internet
   - Validar las credenciales de Supabase

2. **Problemas con la subida de archivos**
   - Verificar el tamaño máximo permitido
   - Comprobar los tipos de archivo soportados
   - Validar los permisos de Storage en Supabase

3. **Errores de autenticación**
   - Limpiar el caché del navegador
   - Verificar la validez del token
   - Comprobar las políticas de seguridad en Supabase

---

## 📖 Contribución

1. Haz un _fork_ del repositorio.
2. Crea una rama para tu feature:
   ```bash
   git checkout -b feature/nombre-de-feature
   ```
3. Haz commit de tus cambios y sube la rama:
   ```bash
   git commit -m "Agrega nueva funcionalidad"
   git push origin feature/nombre-de-feature
   ```
4. Abre un Pull Request describiendo los cambios.

### Guías de contribución
- Sigue las convenciones de código existentes
- Escribe tests para nuevas funcionalidades
- Documenta los cambios en el código
- Actualiza la documentación cuando sea necesario

---

## 📄 Licencia

MIT © Wanda Mary Kay - Elmer Saint-Hilare - Lisa Encarnación


