# AGENTS.md — RRHH Capstone

> Sistema Web de Gestión de Recursos Humanos para Grupo Mendoza.
> Este documento está escrito en español porque todo el código, comentarios, documentación e interfaz del proyecto usan español como idioma principal.

---

## Visión general del proyecto

Este es un monorepo full-stack para un sistema de RR. HH. (Recursos Humanos). Se encuentra en etapa temprana de desarrollo (Sprint 0 completado, con funcionalidad base de autenticación y esquema de datos inicial).

- **Frontend:** SPA con React 19, TypeScript, Vite 8, Tailwind CSS v4 y shadcn/ui.
- **Backend:** API REST con Spring Boot 3.5, Java 21, Maven y JPA/Hibernate.
- **Base de datos:** PostgreSQL 16 en desarrollo local (Docker); H2 en memoria para tests.
- **Migraciones:** Flyway.
- **Infraestructura local:** Docker Compose con tres servicios (frontend, backend, PostgreSQL).

---

## Estructura del repositorio

```text
RRHH-Capstone/
├── backend/           # Aplicación Spring Boot (Java 21 + Maven)
├── frontend/          # Aplicación React (TypeScript + Vite)
├── docker-compose.yml # Orquestación local de todos los servicios
├── .env.example       # Plantilla de variables de entorno
├── README.md          # Documentación de arranque y Sprint 0
├── Backlog-inicial.md # Épicas, historias de usuario y plan de sprints
└── AGENTS.md          # Este archivo
```

---

## Stack tecnológico detallado

### Backend

| Tecnología | Versión / Detalle |
|------------|-------------------|
| Java | 21 (LTS) |
| Spring Boot | 3.5.0 |
| Maven | 3.9.9 (wrapper incluido: `mvnw` / `mvnw.cmd`) |
| Spring Security | Con JWT stateless |
| JPA / Hibernate | `ddl-auto: validate` (nunca genera esquema automáticamente) |
| Flyway | Migraciones versionadas en `src/main/resources/db/migration` |
| PostgreSQL | Driver en runtime |
| H2 | Solo para tests (`scope: test`) |
| jjwt | 0.12.6 (API + impl + Jackson) |
| Validation | Jakarta Bean Validation |

### Frontend

| Tecnología | Versión / Detalle |
|------------|-------------------|
| React | 19.2.5 |
| React DOM | 19.2.5 |
| React Router DOM | 7.14.2 |
| TypeScript | ~6.0.2 |
| Vite | 8.0.10 |
| Tailwind CSS | 4.2.4 (vía plugin `@tailwindcss/vite`) |
| shadcn/ui | 4.5.0 (estilo `radix-nova`, `baseColor: neutral`) |
| Radix UI | 1.4.3 |
| Lucide React | 1.11.0 (biblioteca de iconos) |
| Sonner | 2.0.7 (notificaciones tipo toast) |
| Fontsource | Geist Variable |

---

## Arquitectura del backend

### Organización de paquetes

El backend sigue una organización **por dominio/feature** bajo `com.grupomendoza.rrhh`:

```text
com.grupomendoza.rrhh
├── RrhhApplication.java
├── auth/              # Login, JWT, /auth/me
├── user/              # Gestión de usuarios del sistema
├── role/              # Roles (ADMIN, HR, MANAGER, EMPLOYEE)
├── employee/          # Fichas de empleados
├── area/              # Áreas organizacionales
├── position/          # Cargos (relacionados a área)
├── site/              # Sedes / ubicaciones
├── attendance/        # Control de asistencia
├── leave/             # Solicitudes de permisos y licencias
├── health/            # Endpoint de salud (/api/v1/health)
├── common/            # api/, exception/, roles/, status/
├── config/            # Properties, seeders, CORS
└── security/          # Filtros JWT, UserDetails, configuración de seguridad
```

### Convenciones por módulo

Cada dominio típicamente incluye:
- **Entidad JPA:** Clase anotada con `@Entity`.
- **Repository:** Interfaz que extiende `JpaRepository`.
- **Service:** Lógica de negocio anotada con `@Service` y `@Transactional`.
- **Controller:** `@RestController` con `@RequestMapping("/api/v1/...")`.
- **DTOs:** Usualmente `record` para requests y responses.

### Respuestas API

Todas las respuestas del backend usan un envoltorio estandarizado:

```java
public record ApiResponse<T>(
    boolean success,
    T data,
    ApiError error,
    Instant timestamp
)
```

- Éxito: `ApiResponse.success(datos)` → HTTP 200
- Error: `ApiResponse.failure(código, mensaje, detalles_opcionales)`

Códigos de error comunes manejados por `GlobalExceptionHandler`:
- `VALIDATION_ERROR` → 400
- `AUTHENTICATION_FAILED` → 401
- `UNAUTHORIZED` → 401 (falta token)
- `FORBIDDEN` → 403
- `NOT_FOUND` → 404
- `CONFLICT` → 409 (incluye violaciones de integridad)
- `BAD_REQUEST` → 400
- `INTERNAL_ERROR` → 500

### Seguridad

- **Spring Security** con sesiones stateless (`SessionCreationPolicy.STATELESS`).
- **JWT** para autenticación. El filtro `JwtAuthenticationFilter` se ejecuta antes de `UsernamePasswordAuthenticationFilter`.
- **BCrypt** para hash de contraseñas.
- **CORS** configurado dinámicamente vía variable de entorno `APP_CORS_ALLOWED_ORIGIN`.
- **Method Security** habilitada (`@EnableMethodSecurity`). Se pueden usar anotaciones como `@PreAuthorize` en controllers o services.
- Rutas públicas:
  - `POST /api/v1/auth/login`
  - `GET /api/v1/health`
- Todo lo demás requiere autenticación.

### Roles del sistema

| Rol | Descripción |
|-----|-------------|
| `ADMIN` | Acceso total, configuración, usuarios |
| `HR` | Gestión operativa de personal, catálogos, asistencia, permisos |
| `MANAGER` | Consulta de equipo y aprobación de solicitudes |
| `EMPLOYEE` | Consulta propia, registro de solicitudes |

Los roles se almacenan en la tabla `roles` y se vinculan a usuarios mediante `user_roles`.

### Seed de datos

`AuthDataSeeder` (implementa `ApplicationRunner`) se ejecuta al iniciar la aplicación:
1. Crea los 4 roles base si no existen (a partir del enum `RoleName`).
2. Crea un usuario administrador inicial si no existe, usando las propiedades configurables vía entorno (`APP_SEED_ADMIN_*`).

### Migraciones de base de datos (Flyway)

Las migraciones están en `backend/src/main/resources/db/migration/`:

| Archivo | Contenido |
|---------|-----------|
| `V1__init_auth_schema.sql` | Tablas `roles`, `users`, `user_roles` |
| `V2__add_organization_and_employees.sql` | Tablas `areas`, `sites`, `positions`, `employees` |
| `V3__add_attendance_and_leave_requests.sql` | Tablas `attendance_settings`, `attendance_records`, `leave_requests` |

> **Regla:** Nunca modificar una migración ya aplicada. Siempre crear una nueva versión.

---

## Arquitectura del frontend

### Organización de carpetas

```text
frontend/src/
├── main.tsx              # Punto de entrada, BrowserRouter, Toaster
├── App.tsx               # Definición de rutas y guards
├── index.css             # Tailwind + estilos globales
├── assets/               # Imágenes y recursos estáticos
├── components/
│   ├── ui/               # Componentes shadcn/ui (Button, Input, Card, etc.)
│   └── app/              # Componentes propios de la app (data-table, page-header, etc.)
├── contexts/
│   └── auth-context.tsx  # Estado global de autenticación
├── layout/
│   └── app-shell.tsx     # Shell con sidebar, header y navegación por rol
├── lib/
│   ├── auth-storage.ts   # localStorage para token/sesión
│   ├── env.ts            # Variables de entorno tipadas
│   ├── format.ts         # Formateadores (fechas, moneda, etc.)
│   ├── http.ts           # Cliente fetch wrapper con manejo de errores
│   ├── roles.ts          # Helpers de roles y etiquetas
│   ├── utils.ts          # `cn()` para clases de Tailwind
│   ├── use-debounce.ts   # Hook de debounce
│   └── validation.ts     # Validaciones de formulario
├── pages/                # Vistas por ruta (login, dashboard, employees, etc.)
├── routes/
│   ├── protected-route.tsx  # Guard de rutas autenticadas + roles
│   └── public-route.tsx     # Guard de rutas públicas
└── types/
    ├── api.ts            # Tipos del envelope de API
    ├── auth.ts           # Tipos de autenticación
    └── domain.ts         # Tipos del dominio (empleados, áreas, etc.)
```

### Sistema de rutas

- `/login` → Página de inicio de sesión (pública).
- `/app/*` → Área protegida dentro de `AppShell`.
  - `/app/dashboard` → Panel principal (todos los roles).
  - `/app/attendance` → Asistencia.
  - `/app/leave-requests` → Permisos y licencias.
  - `/app/users` → Gestión de usuarios (solo `ADMIN`).
  - `/app/employees` → Gestión de empleados (`ADMIN`, `HR`).
  - `/app/settings/areas` → Áreas (`ADMIN`, `HR`).
  - `/app/settings/cargos` → Cargos (`ADMIN`, `HR`).
  - `/app/settings/sedes` → Sedes (`ADMIN`, `HR`).

El `ProtectedRoute` valida:
1. Que exista sesión autenticada.
2. Que el usuario tenga al menos uno de los `allowedRoles` si se especifican.

Si no cumple, redirige a `/login` o al dashboard según corresponda.

### Autenticación en frontend

- El token JWT se almacena en `localStorage` (decisión temporal documentada en README).
- Al cargar la aplicación, `AuthContext` intenta validar el token con `GET /auth/me`.
- Si el token es inválido o expiró, limpia la sesión automáticamente.
- Las peticiones HTTP incluyen el header `Authorization: Bearer <token>`.

### Consumo de API

Todas las llamadas al backend usan `apiRequest<T>(path, options)` definido en `lib/http.ts`:
- Base URL: `VITE_API_BASE_URL` (default: `http://localhost:8080/api/v1`).
- Maneja automáticamente headers `Content-Type` y `Authorization`.
- Parsea el `ApiEnvelope<T>` del backend.
- Lanza `ApiClientError` en caso de error, con `status`, `code` y `details`.

### Estilos y UI

- Tailwind CSS v4 con configuración mínima en `tailwind.config.ts`.
- shadcn/ui como sistema de componentes base. Los componentes UI viven en `src/components/ui/`.
- Función `cn(...)` de `lib/utils.ts` para combinar clases con `clsx` + `tailwind-merge`.
- Paleta base: `warm professional` (tonos ámbar/piedra) con acento primario ámbar y fondo stone-50.
- Fuente: Geist Variable (`@fontsource-variable/geist`).
- Iconos: Lucide React.
- Notificaciones: Sonner (`<Toaster richColors position="top-right" />`).

---

## Variables de entorno

Copiar `.env.example` a `.env` y ajustar valores:

```dotenv
# Frontend
VITE_APP_NAME=RRHH Grupo Mendoza
VITE_API_BASE_URL=http://localhost:8080/api/v1

# Database
POSTGRES_DB=rrhh
POSTGRES_USER=rrhh
POSTGRES_PASSWORD=rrhh123

# Backend
APP_CORS_ALLOWED_ORIGIN=http://localhost:5173
APP_JWT_SECRET=change-this-secret-key-with-at-least-thirty-two-chars
APP_JWT_EXPIRATION_MS=86400000
APP_SEED_ADMIN_FULL_NAME=Administrador
APP_SEED_ADMIN_EMAIL=admin@grupomendoza.com
APP_SEED_ADMIN_PASSWORD=Admin12345!
```

> **Seguridad:** El JWT secret debe tener al menos 32 caracteres. Las credenciales seed son configurables y deben cambiarse en producción.

---

## Comandos de construcción y desarrollo

### Backend

```bash
cd backend

# Compilar y ejecutar en desarrollo
./mvnw spring-boot:run
# o en Windows
mvnw.cmd spring-boot:run

# Compilar
./mvnw clean compile

# Ejecutar tests
./mvnw test

# Empaquetar JAR
./mvnw clean package
```

### Frontend

```bash
cd frontend

# Instalar dependencias
npm install

# Servidor de desarrollo
npm run dev

# Lint
npm run lint

# Construir para producción
npm run build

# Previsualizar build
npm run preview
```

### Docker Compose (recomendado para desarrollo)

Desde la raíz del proyecto:

```bash
docker compose up --build
```

Servicios expuestos:
- Frontend: http://localhost:5173
- Backend: http://localhost:8080
- API Health: http://localhost:8080/api/v1/health
- PostgreSQL: localhost:5432

---

## Estrategia de testing

### Backend

- **Framework:** JUnit 5 + Spring Boot Test + MockMvc.
- **Base de datos de tests:** H2 en memoria con perfil `test` (`application-test.yml`).
- **Perfil activo:** Todos los tests deben usar `@ActiveProfiles("test")`.
- **Convención:** Tests de controller usan `MockMvc` para validar status, estructura JSON y códigos de error.
- Tests existentes cubren:
  - Login exitoso y fallido.
  - Acceso a `/auth/me` sin token.
  - Health check.
  - Gestión administrativa de usuarios.

### Frontend

- Actualmente **no hay framework de testing instalado** (no Vitest, Jest ni Playwright).
- Si se agrega testing, la convención del proyecto sugiere colocar archivos de test junto a los componentes o en una carpeta `__tests__` coherente con la estructura existente.

---

## Guías de estilo de código

### General (`.editorconfig`)

- Charset: UTF-8
- Fin de línea: LF
- Indentación: espacios
- Tamaño: 2 espacios (frontend, config), 4 espacios (Java)
- `insert_final_newline = true`
- `trim_trailing_whitespace = true`

### Backend (Java)

- Java 21 con sintaxis moderna (records para DTOs, pattern matching cuando aplique).
- Inyección de dependencias por constructor (no usar `@Autowired` en campos).
- Nombres de paquetes en minúscula, clases en PascalCase, métodos/variables en camelCase.
- Constantes de estado y enumeraciones deben definirse como enums (ver `RoleName`, `UserStatus`, `RecordStatus`, etc.).
- Los controllers devuelven siempre `ResponseEntity<ApiResponse<T>>`.
- Las excepciones de negocio usan excepciones estándar de Java (`IllegalStateException`, `IllegalArgumentException`, `EntityNotFoundException`) para que el `GlobalExceptionHandler` las traduzca automáticamente.

### Frontend (TypeScript / React)

- TypeScript estricto (consultar `tsconfig.app.json`).
- Componentes como funciones con tipado explícito de props.
- Hooks personalizados en `lib/` o `hooks/` (aún no hay carpeta `hooks`, usar `lib/`).
- Path alias `@/` para todo import desde `src/`.
- Clases de Tailwind se componen con `cn()`.
- Todo el texto visible al usuario está en español.

### ESLint (frontend)

Configuración en `eslint.config.js`:
- Recomendado de JS + TypeScript + React Hooks + React Refresh.
- Reglas desactivadas para `react-refresh/only-export-components` en `components/ui/` y `contexts/` (porque exportan múltiples componentes/hooks).

---

## Consideraciones de seguridad

- **JWT Secret:** Debe cambiarse inmediatamente en cualquier entorno que no sea desarrollo local. Requiere al menos 32 caracteres.
- **CORS:** `APP_CORS_ALLOWED_ORIGIN` restringe explícitamente el origen permitido. No usar `*` en producción.
- **Contraseñas:** Almacenadas con BCrypt. Nunca en texto plano.
- **SQL Injection:** Mitigada por JPA/Hibernate y uso de repositories.
- **XSS:** El frontend usa React, que escapa contenido por defecto. Aun así, validar inputs antes de renderizar HTML dinámico.
- **LocalStorage:** El token JWT se guarda en `localStorage`. Esto es una decisión temporal para Sprint 0. En producción se debe evaluar `httpOnly` cookies o almacenamiento más seguro.
- **Errores:** El backend nunca expone stack traces ni detalles de base de datos al cliente. Usa códigos de error genéricos para errores 500.

---

## Proceso de despliegue

El despliegue actual está orientado a contenedores Docker:

1. **Build de imágenes:** `docker compose up --build` construye tanto frontend como backend.
2. **Backend:** Dockerfile basado en `maven:3.9.9-eclipse-temurin-21`. Ejecuta `mvn spring-boot:run`.
3. **Frontend:** Dockerfile basado en `node:22-alpine`. Ejecuta `npm run dev -- --host`.
4. **Base de datos:** `postgres:16-alpine` con volumen persistente `postgres_data`.

> **Nota para producción:** Los Dockerfiles actuales están optimizados para desarrollo. Para producción se recomienda:
> - Backend: construir JAR con `mvn clean package` y copiar solo el JAR a una imagen runtime.
> - Frontend: construir archivos estáticos con `npm run build` y servirlos con nginx o similar.

---

## Convenciones para nuevos módulos

### Backend

1. Crear paquete bajo `com.grupomendoza.rrhh.<dominio>`.
2. Definir entidad, repository, service, controller y DTOs.
3. Si requiere tabla nueva, crear migración Flyway con el siguiente número de versión.
4. Agregar pruebas en `src/test/java/...` con `@ActiveProfiles("test")`.
5. Exponer endpoints bajo `/api/v1/<recurso>`.
6. Usar `ApiResponse.success(...)` y `ApiResponse.failure(...)` para respuestas.

### Frontend

1. Agregar tipos en `src/types/domain.ts` si es un nuevo dominio.
2. Crear página en `src/pages/<nombre>-page.tsx`.
3. Registrar ruta en `App.tsx` con el `ProtectedRoute` y roles correspondientes.
4. Si es un módulo de navegación, agregarlo al arreglo `navItems` en `app-shell.tsx`.
5. Consumir API mediante `apiRequest<T>()` de `lib/http.ts`.
6. Usar componentes de `components/ui/` para mantener consistencia visual.

---

## Dependencias funcionales entre módulos

- No se pueden registrar empleados sin áreas, cargos y sedes activas.
- No se puede operar asistencia, permisos o vacaciones sin empleados activos.
- Los reportes dependen de datos operativos previos.
- La auditoría (aún no implementada) debe integrarse transversalmente.

---

## Créditos y contexto adicional

- Proyecto académico tipo capstone para Grupo Mendoza.
- Documento de requerimientos detallado en `Backlog-inicial.md`.
- El proyecto usa comentarios y documentación en español de manera consistente.
