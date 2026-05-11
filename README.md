# RRHH Capstone

Sistema web de Recursos Humanos para Grupo Mendoza.

## Stack
- Frontend: React + TypeScript + Vite
- UI: Tailwind CSS v4 + shadcn/ui
- Backend: Spring Boot 3 + Java 21 + Maven
- Base de datos: PostgreSQL
- Infraestructura local: Docker Compose

## Estado actual
El proyecto ya incluye:

- autenticación con JWT
- gestión de usuarios
- gestión de empleados
- gestión de áreas, cargos y sedes
- control de asistencia con marcación manual
- historial y resumen de asistencia por rol
- cierre diario de inasistencias
- justificación de tardanzas e inasistencias
- solicitudes de permisos y licencias
- aprobación o rechazo de solicitudes por rol

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

## Requisitos
- Docker Desktop
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

## Arranque con Docker
Desde la raíz del proyecto:

```bash
docker compose up --build
```

Servicios disponibles:

- Frontend: [http://localhost:5173](http://localhost:5173)
- Backend: [http://localhost:8080/api/v1/health](http://localhost:8080/api/v1/health)
- PostgreSQL: `localhost:5432`

## Credenciales seed
Por defecto:

- Email: `admin@grupomendoza.com`
- Password: `Admin12345!`

Estas credenciales salen de:

- `APP_SEED_ADMIN_EMAIL`
- `APP_SEED_ADMIN_PASSWORD`

## Migraciones
Flyway corre automáticamente al iniciar el backend.

Migraciones actuales:

- `V1__init_auth_schema.sql`
- `V2__add_organization_and_employees.sql`
- `V3__add_attendance_and_leave_requests.sql`

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

## Notas
- la asistencia biométrica todavía no está integrada; la base quedó preparada para una integración futura
- el token se mantiene en `localStorage` por ahora
- el sistema usa roles fijos en esta etapa; no hay matriz dinámica de permisos por módulo
