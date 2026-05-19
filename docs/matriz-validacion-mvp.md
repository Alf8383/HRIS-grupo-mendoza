# Matriz de validación MVP

## Objetivo
Checklist manual para validar el sistema antes de una demo, entrega académica o despliegue local de revisión.

## Preparación
- Levantar Docker Desktop.
- Ejecutar `docker compose up --build`.
- Confirmar:
  - Frontend en `http://localhost:5173`
  - Backend en `http://localhost:8080/api/v1/health`
  - Respuesta `ok` del healthcheck

## Credenciales sugeridas
- `admin@grupomendoza.com / Admin12345!`
- `hr.demo@grupomendoza.com / Demo12345!`
- `manager.demo@grupomendoza.com / Demo12345!`
- `ana.demo@grupomendoza.com / Demo12345!`
- `luis.demo@grupomendoza.com / Demo12345!`
- `sofia.demo@grupomendoza.com / Demo12345!`

## Flujo 1. Acceso y navegación
- Login correcto con `ADMIN`.
- Login correcto con `HR`.
- Login correcto con `MANAGER`.
- Login correcto con `EMPLOYEE`.
- Rutas restringidas no visibles ni accesibles fuera del rol permitido.
- Cierre de sesión funcional.

## Flujo 2. Maestro organizacional
- `ADMIN` puede entrar a `Usuarios`.
- `HR` no puede entrar a `Usuarios`.
- `ADMIN` o `HR` puede consultar `Empleados`, `Áreas`, `Cargos` y `Sedes`.
- Listados cargan sin error y muestran datos demo.

## Flujo 3. Asistencia
- `EMPLOYEE` ve su jornada y su historial.
- `MANAGER` ve resumen de su equipo.
- `HR` o `ADMIN` ve resumen global.
- Cierre diario funciona para roles autorizados.
- Justificación de tardanza o inasistencia se refleja en el resumen.

## Flujo 4. Permisos y licencias
- `EMPLOYEE` puede crear solicitud.
- `EMPLOYEE` puede cancelar solo solicitudes pendientes propias.
- `MANAGER` puede aprobar o rechazar solicitudes de su área.
- `HR` consulta solicitudes globales.
- `ADMIN` puede aprobar como respaldo.

## Flujo 5. Vacaciones
- `EMPLOYEE` ve saldo y solicitudes propias.
- `HR` puede ajustar saldo.
- `MANAGER` puede aprobar o rechazar solicitudes de su área.
- `ADMIN` puede aprobar globalmente.
- Los saldos cambian correctamente después de aprobar o rechazar.

## Flujo 6. Contratos
- `HR` o `ADMIN` puede consultar contratos.
- Existen contratos por vencer en el reporte y dashboard.
- La renovación mantiene historial contractual.

## Flujo 7. Reportes
- `ADMIN` y `HR` ven todos los reportes.
- `MANAGER` solo ve reportes permitidos.
- Filtros responden correctamente.
- Exportación Excel funciona en:
  - empleados
  - asistencia
  - solicitudes
  - contratos por vencer

## Flujo 8. Bitácora
- `ADMIN` y `HR` pueden entrar a `Bitácora`.
- `MANAGER` y `EMPLOYEE` no pueden acceder.
- Se observan registros de acciones críticas demo.
- Filtros por usuario, módulo, acción y fechas responden correctamente.

## Criterio de cierre
- No hay errores bloqueantes en navegación o flujos principales.
- La demo puede ejecutarse completa sin crear datos manualmente.
- Los roles ven solo lo que corresponde.
- Exportaciones y auditoría funcionan como evidencia de cierre del MVP.
