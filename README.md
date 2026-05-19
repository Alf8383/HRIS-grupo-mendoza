# RRHH Capstone

Sistema web de Gestión de Recursos Humanos para Grupo Mendoza.

## Stack
- Frontend: React 19 + TypeScript + Vite
- UI: Tailwind CSS v4 + shadcn/ui
- Backend: Spring Boot 3.5 + Java 21 + Maven
- Base de datos: PostgreSQL
- Infraestructura local: Docker Compose

## Estado actual
El proyecto ya incluye:

- autenticación con JWT
- gestión de usuarios
- gestión de empleados
- gestión de áreas, cargos y sedes
- control de asistencia con marcación manual
- permisos y licencias con flujo de aprobación por rol
- vacaciones con saldo manual, solicitudes y aprobación
- contratos laborales con historial, renovación y alertas de vencimiento
- reportes filtrables con exportación a Excel
- bitácora de auditoría para acciones críticas

## Estructura del proyecto
```text
RRHH-Capstone/
├── backend/
├── frontend/
├── docker-compose.yml
├── .env.example
├── Backlog-inicial.md
└── README.md
```

## Módulos backend
Dominios principales disponibles:

- `auth`
- `user`
- `employee`
- `area`
- `position`
- `site`
- `attendance`
- `leave`
- `vacation`
- `contract`
- `report`
- `audit`

## Requisitos
- Docker Desktop para levantar el stack completo
- Node.js 22+ para desarrollo local opcional
- Java 21 y Maven para desarrollo local opcional

## Variables de entorno
Usa `.env.example` como referencia.

### Frontend
- `VITE_APP_NAME`
- `VITE_API_BASE_URL`

### Base de datos
- `POSTGRES_DB`
- `POSTGRES_USER`
- `POSTGRES_PASSWORD`

### Backend
- `APP_CORS_ALLOWED_ORIGIN`
- `APP_JWT_SECRET`
- `APP_JWT_EXPIRATION_MS`
- `APP_SEED_ADMIN_FULL_NAME`
- `APP_SEED_ADMIN_EMAIL`
- `APP_SEED_ADMIN_PASSWORD`
- `APP_SEED_DEMO_ENABLED`
- `APP_SEED_DEMO_DEFAULT_PASSWORD`

## Arranque con Docker
Desde la raíz del proyecto:

```bash
docker compose up --build
```

Servicios disponibles:

- Frontend: [http://localhost:5173](http://localhost:5173)
- Backend: [http://localhost:8080/api/v1/health](http://localhost:8080/api/v1/health)
- PostgreSQL: `localhost:5432`

Si `docker compose` falla con un error del daemon, abre Docker Desktop y vuelve a ejecutar el comando.

Con la configuración actual de `docker-compose`, el backend levanta también un `dataset demo opcional` para dejar el sistema listo para recorrido funcional sin carga manual.

## Credenciales seed
Por defecto:

- Email: `admin@grupomendoza.com`
- Password: `Admin12345!`

Estas credenciales salen de:

- `APP_SEED_ADMIN_EMAIL`
- `APP_SEED_ADMIN_PASSWORD`

## Credenciales demo
Si `APP_SEED_DEMO_ENABLED=true`, se crean además estos usuarios con la contraseña definida en `APP_SEED_DEMO_DEFAULT_PASSWORD`:

- `hr.demo@grupomendoza.com`
- `manager.demo@grupomendoza.com`
- `ana.demo@grupomendoza.com`
- `luis.demo@grupomendoza.com`
- `sofia.demo@grupomendoza.com`

El dataset demo incluye:

- áreas, cargos y sedes activas
- empleados asociados a `MANAGER` y `EMPLOYEE`
- solicitudes de permisos y vacaciones
- saldos de vacaciones
- contratos vigentes y por vencer
- asistencia de ejemplo
- registros de auditoría

## Migraciones
Flyway corre automáticamente al iniciar el backend.

Migraciones actuales:

- `V1__init_auth_schema.sql`
- `V2__add_organization_and_employees.sql`
- `V3__add_attendance_and_leave_requests.sql`
- `V4__add_vacations_and_contracts.sql`
- `V5__add_audit_logs.sql`

El seed inicial crea:

- roles base `ADMIN`, `HR`, `MANAGER`, `EMPLOYEE`
- usuario administrador si no existe

## Desarrollo local sin Docker

### Backend
```bash
cd backend
mvn spring-boot:run
```

### Frontend
```bash
cd frontend
npm install
npm run dev
```

## Verificación rápida
- `docker compose up --build` levanta frontend, backend y base de datos
- `GET /api/v1/health` responde `ok`
- el usuario administrador puede iniciar sesión
- el frontend redirige a `/app/dashboard` después del login
- `/api/v1/auth/me` responde con el usuario autenticado
- las rutas protegidas restringen acceso según rol
- `GET /api/v1/attendance/summary` responde correctamente
- `GET /api/v1/leave-requests/all` responde correctamente para usuarios autorizados
- `GET /api/v1/vacations/requests/all` responde correctamente para `ADMIN` y `HR`
- `GET /api/v1/contracts/expiring` responde correctamente para `ADMIN` y `HR`
- `GET /api/v1/reports/attendance` responde correctamente para roles autorizados
- `GET /api/v1/audit-logs` responde correctamente para `ADMIN` y `HR`

## Recorrido demo recomendado
1. Iniciar sesión con `hr.demo@grupomendoza.com` para recorrer empleados, asistencia, vacaciones, contratos, reportes y bitácora.
2. Iniciar sesión con `manager.demo@grupomendoza.com` para revisar aprobaciones del equipo y reportes acotados.
3. Iniciar sesión con `ana.demo@grupomendoza.com` o `luis.demo@grupomendoza.com` para probar experiencia de colaborador.
4. Usar `admin@grupomendoza.com` para validar gestión de usuarios y fallback operativo.

## Matriz de validación manual
Se incluye un checklist de humo y demo en [docs/matriz-validacion-mvp.md](docs/matriz-validacion-mvp.md).

## Notas
- la asistencia biométrica todavía no está integrada; la base quedó preparada para una integración futura
- el token se mantiene en `localStorage` por ahora
- el sistema usa roles fijos en esta etapa; no hay matriz dinámica de permisos por módulo
- las rutas propias de vacaciones (`/balance/me`, `/requests/my`, creación de solicitud) están orientadas a usuarios con ficha de empleado (`MANAGER` y `EMPLOYEE`)
- las exportaciones del MVP usan `Excel` como formato oficial
