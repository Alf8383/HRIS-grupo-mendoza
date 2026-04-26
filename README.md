# RRHH Capstone - Sprint 0

Base técnica inicial del sistema web de Recursos Humanos para Grupo Mendoza.

## Stack
- Frontend: React + TypeScript + Vite
- UI: Tailwind CSS v4 + shadcn/ui
- Backend: Spring Boot 3 + Java 21 + Maven
- Base de datos: PostgreSQL
- Infraestructura local: Docker Compose

## Estructura del proyecto
```text
RRHH-Capstone/
├── backend/
├── frontend/
├── docker-compose.yml
├── .env.example
├── Backlog inicial.md
└── README.md
```

## Qué incluye Sprint 0
- Monorepo funcional con `frontend/` y `backend/`
- Docker Compose para levantar frontend, backend y PostgreSQL
- Migración inicial con Flyway
- Seed de roles `ADMIN`, `HR`, `MANAGER`, `EMPLOYEE`
- Seed de usuario administrador configurable por variables de entorno
- Login con JWT
- Endpoint `/api/v1/auth/me`
- Shell protegido en frontend con visibilidad básica por rol

## Requisitos
- Docker Desktop
- Node.js 22+ para desarrollo local opcional
- Java 21 y Maven para desarrollo local opcional

## Variables de entorno
Usa `.env.example` como referencia. Los valores importantes son:

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

Estas credenciales salen de las variables `APP_SEED_ADMIN_EMAIL` y `APP_SEED_ADMIN_PASSWORD`.

## Cómo funcionan las migraciones
- Flyway corre automáticamente al iniciar el backend.
- La migración actual crea únicamente el esquema mínimo de autenticación:
  - `roles`
  - `users`
  - `user_roles`
- El seed de datos corre al iniciar la aplicación y crea roles base y un admin si no existen.

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

## Sprint 0 done checklist
- `docker compose up --build` levanta los tres servicios
- `GET /api/v1/health` responde `ok`
- El admin seed puede iniciar sesión
- El frontend redirige a `/app/dashboard` después del login
- `/api/v1/auth/me` responde con el usuario autenticado
- Las rutas protegidas bloquean el acceso sin token

## Notas
- Sprint 0 no incluye módulos de negocio todavía.
- La persistencia del token en `localStorage` es una decisión temporal para esta etapa.
- La administración dinámica de permisos por módulo queda para Sprint 1.
