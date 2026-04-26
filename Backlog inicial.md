# Backlog Inicial

## Proyecto
**Sistema Web de Gestión de Recursos Humanos para Grupo Mendoza**

## Objetivo del documento
Este backlog inicial organiza el trabajo del MVP del sistema web de RR. HH. a partir del business case y del documento de requerimientos. El objetivo es convertir los requisitos del proyecto en épicas, historias de usuario, criterios de aceptación, prioridades técnicas y una propuesta de implementación incremental.

## Stack definido
- Frontend: React
- UI: Tailwind CSS + shadcn/ui
- Backend: Java Spring Boot
- Base de datos: PostgreSQL
- Infraestructura local y despliegue base: Docker

## Alcance del MVP
Este backlog considera como MVP:
- Autenticación y autorización por roles
- Gestión de usuarios
- Gestión de empleados
- Gestión de áreas, cargos y sedes
- Control de asistencia
- Gestión de permisos y licencias
- Gestión de vacaciones
- Gestión de contratos laborales
- Reportes básicos
- Auditoría de acciones críticas

Queda fuera del MVP inicial:
- Cálculo de planillas
- Integración directa con biométricos
- App móvil nativa
- Flujos avanzados de notificación multicanal
- Analítica avanzada o BI

## Roles del sistema
- `Administrador`: acceso total, configuración general, usuarios, roles, parámetros.
- `RRHH`: gestión operativa del personal, asistencia, permisos, vacaciones, contratos y reportes.
- `Jefe de área`: consulta de su equipo y aprobación/rechazo de solicitudes.
- `Empleado`: consulta de información personal, asistencia, vacaciones y registro de solicitudes.

## Prioridades
- `P0`: imprescindible para que el MVP funcione
- `P1`: importante para operación real y demo sólida
- `P2`: deseable, puede entrar al cierre del MVP o siguiente iteración

## Supuestos de trabajo
- La autenticación será interna con correo y contraseña.
- La autorización se implementará con control por rol y permisos por módulo.
- La asistencia será registrada manualmente o por carga administrativa en esta primera versión.
- Los adjuntos de empleados y solicitudes se almacenarán mediante una estrategia simple desacoplada del dominio.
- El sistema usará API REST entre frontend y backend.
- El despliegue inicial se apoyará en contenedores Docker.

## Arquitectura funcional inicial
- Frontend SPA con rutas protegidas y vistas según rol.
- Backend modular con capas `controller`, `service`, `repository`, `security` y `audit`.
- PostgreSQL como fuente única de datos.
- Docker Compose para levantar frontend, backend y base de datos.
- Migraciones de base de datos para versionar el esquema.

## Backlog por épicas

---

## Épica 0. Base técnica, arquitectura y DevOps
**Objetivo:** dejar lista la base técnica para desarrollar y desplegar el producto de forma ordenada.

### Historia E0-H1
**Como** equipo de desarrollo  
**quiero** contar con una estructura base de frontend y backend desacoplados  
**para** trabajar de forma paralela y mantenible.

**Prioridad:** P0  
**Criterios de aceptación:**
- Existe una estructura inicial de proyecto para frontend y backend.
- El frontend arranca localmente con configuración base.
- El backend arranca localmente con configuración base.
- La conexión entre frontend y backend queda definida vía variables de entorno.

### Historia E0-H2
**Como** equipo de desarrollo  
**quiero** levantar todo el entorno con Docker  
**para** reducir problemas de configuración entre máquinas.

**Prioridad:** P0  
**Criterios de aceptación:**
- Existe `docker-compose` para frontend, backend y PostgreSQL.
- Los servicios levantan con un solo comando.
- La base de datos persiste información mediante volumen.
- La configuración sensible se gestiona con variables de entorno.

### Historia E0-H3
**Como** equipo de desarrollo  
**quiero** definir migraciones de base de datos  
**para** versionar el esquema y evitar cambios manuales.

**Prioridad:** P0  
**Criterios de aceptación:**
- El esquema inicial se crea mediante migraciones.
- Las tablas base pueden recrearse desde cero.
- Hay datos semilla mínimos para roles y usuario administrador.

### Historia E0-H4
**Como** equipo de desarrollo  
**quiero** una política base de errores y respuestas API  
**para** mantener consistencia entre módulos.

**Prioridad:** P0  
**Criterios de aceptación:**
- Existe una estructura estándar para respuestas exitosas y errores.
- Las validaciones devuelven mensajes legibles.
- Los errores de autenticación, autorización y negocio tienen códigos diferenciables.

### Historia E0-H5
**Como** equipo de desarrollo  
**quiero** documentación base de instalación y ejecución  
**para** que cualquier integrante pueda iniciar el proyecto.

**Prioridad:** P1  
**Criterios de aceptación:**
- Existe documentación de prerequisitos.
- Existe guía de arranque local con Docker.
- Se documentan variables de entorno.
- Se documenta el flujo de migraciones.

---

## Épica 1. Autenticación, autorización, usuarios y roles
**Objetivo:** permitir acceso seguro al sistema y restringir funcionalidades según perfil.

### Historia E1-H1
**Como** usuario del sistema  
**quiero** iniciar sesión con correo y contraseña  
**para** acceder a mi espacio según mi rol.

**Prioridad:** P0  
**Requisitos relacionados:** REQ-001, REQ-002, REQ-003  
**Criterios de aceptación:**
- El login valida credenciales contra usuarios registrados.
- Si las credenciales son válidas, el sistema crea sesión autenticada.
- Si son inválidas, muestra un mensaje claro sin exponer datos sensibles.
- El usuario es redirigido a una vista acorde a su rol.

### Historia E1-H2
**Como** usuario autenticado  
**quiero** cerrar sesión de forma segura  
**para** proteger mi acceso.

**Prioridad:** P0  
**Requisitos relacionados:** REQ-004  
**Criterios de aceptación:**
- El sistema permite cerrar sesión desde la interfaz.
- El token o mecanismo de sesión queda invalidado del lado cliente.
- Las rutas protegidas dejan de ser accesibles tras el cierre.

### Historia E1-H3
**Como** administrador  
**quiero** gestionar usuarios del sistema  
**para** controlar quién puede ingresar.

**Prioridad:** P0  
**Criterios de aceptación:**
- Se puede registrar un usuario con correo, nombre, rol y estado.
- Se puede editar información no sensible del usuario.
- Se puede activar o desactivar usuarios.
- No se permite duplicidad de correo.

### Historia E1-H4
**Como** administrador  
**quiero** asignar roles y permisos por módulo  
**para** restringir el acceso según responsabilidades.

**Prioridad:** P0  
**Requisitos relacionados:** REQ-005, REQ-042, REQ-043, REQ-044  
**Criterios de aceptación:**
- Los módulos visibles cambian según el rol.
- Un usuario sin permiso no puede acceder ni por UI ni por API.
- Los permisos pueden asociarse a roles.
- Existe al menos la configuración inicial de `ADMIN`, `HR`, `MANAGER` y `EMPLOYEE`.

### Historia E1-H5
**Como** administrador  
**quiero** recuperar o resetear credenciales de usuarios  
**para** no depender de cambios manuales en base de datos.

**Prioridad:** P1  
**Criterios de aceptación:**
- El administrador puede reiniciar la contraseña de un usuario.
- El sistema obliga al usuario a cambiar la contraseña temporal al ingresar, si esa política se activa.

### Tareas técnicas sugeridas
- Configurar Spring Security.
- Definir JWT o mecanismo equivalente.
- Crear guards de rutas en React.
- Implementar almacenamiento seguro del token en frontend.
- Sembrar roles base en base de datos.

---

## Épica 2. Gestión de empleados
**Objetivo:** centralizar la información personal y laboral del colaborador.

### Historia E2-H1
**Como** personal de RRHH  
**quiero** registrar un empleado  
**para** mantener su información en el sistema.

**Prioridad:** P0  
**Requisitos relacionados:** REQ-006  
**Criterios de aceptación:**
- Se registran datos personales básicos.
- Se registran datos laborales básicos.
- El empleado queda asociado a sede, área y cargo.
- El sistema valida campos obligatorios antes de guardar.

### Historia E2-H2
**Como** personal de RRHH  
**quiero** editar la información de un empleado  
**para** mantenerla actualizada.

**Prioridad:** P0  
**Requisitos relacionados:** REQ-007  
**Criterios de aceptación:**
- Se puede editar información personal y laboral.
- El sistema registra la última modificación y el usuario que la realizó.
- Los cambios se reflejan inmediatamente en la ficha del empleado.

### Historia E2-H3
**Como** personal de RRHH o jefe autorizado  
**quiero** consultar la ficha completa de un empleado  
**para** revisar su información consolidada.

**Prioridad:** P0  
**Requisitos relacionados:** REQ-008  
**Criterios de aceptación:**
- La ficha muestra datos personales, laborales y estado.
- La ficha muestra relaciones con contratos, asistencia, permisos y vacaciones.
- El acceso respeta permisos por rol.

### Historia E2-H4
**Como** personal de RRHH  
**quiero** desactivar un empleado sin borrar su historial  
**para** conservar trazabilidad.

**Prioridad:** P0  
**Requisitos relacionados:** REQ-009  
**Criterios de aceptación:**
- La desactivación cambia el estado del empleado.
- El historial asociado permanece disponible.
- El empleado desactivado ya no aparece en flujos operativos activos, salvo filtros específicos.

### Historia E2-H5
**Como** sistema  
**quiero** validar que no se repita el DNI  
**para** evitar duplicidad de empleados.

**Prioridad:** P0  
**Requisitos relacionados:** REQ-010  
**Criterios de aceptación:**
- No se puede registrar un empleado con DNI existente.
- La validación aplica también en edición cuando corresponda.
- Se muestra un mensaje claro al usuario.

### Historia E2-H6
**Como** personal de RRHH  
**quiero** adjuntar documentos del empleado  
**para** mantener expediente digital.

**Prioridad:** P1  
**Requisitos relacionados:** REQ-011  
**Criterios de aceptación:**
- Se pueden adjuntar al menos contrato y CV.
- Los documentos pueden visualizarse o descargarse.
- El acceso a documentos respeta permisos.

### Historia E2-H7
**Como** personal de RRHH  
**quiero** listar y filtrar empleados  
**para** encontrar información rápidamente.

**Prioridad:** P1  
**Criterios de aceptación:**
- La lista permite búsqueda por nombre o DNI.
- La lista permite filtro por sede, área, cargo y estado.
- La lista soporta paginación o carga eficiente.

### Tareas técnicas sugeridas
- Definir modelo `Employee`.
- Relacionar empleado con sede, área y cargo.
- Implementar validaciones backend y frontend.
- Diseñar ficha de empleado y tabla de listado con shadcn.

---

## Épica 3. Gestión de áreas, cargos y sedes
**Objetivo:** administrar la estructura organizacional utilizada por los demás módulos.

### Historia E3-H1
**Como** administrador o RRHH  
**quiero** registrar áreas  
**para** clasificar al personal.

**Prioridad:** P0  
**Requisitos relacionados:** REQ-012  
**Criterios de aceptación:**
- Se puede crear, editar y desactivar áreas.
- El sistema evita áreas duplicadas por nombre si así se define.

### Historia E3-H2
**Como** administrador o RRHH  
**quiero** registrar cargos  
**para** asignar funciones a los empleados.

**Prioridad:** P0  
**Requisitos relacionados:** REQ-013  
**Criterios de aceptación:**
- Se puede crear, editar y desactivar cargos.
- Un cargo puede asociarse a un área si el modelo lo requiere.

### Historia E3-H3
**Como** administrador o RRHH  
**quiero** registrar sedes  
**para** ubicar al personal en su centro de trabajo.

**Prioridad:** P0  
**Requisitos relacionados:** REQ-015  
**Criterios de aceptación:**
- Se puede crear, editar y desactivar sedes.
- La sede puede seleccionarse al registrar empleados.

### Historia E3-H4
**Como** RRHH  
**quiero** asignar área y cargo a un empleado  
**para** definir su ubicación organizacional.

**Prioridad:** P0  
**Requisitos relacionados:** REQ-014  
**Criterios de aceptación:**
- El empleado debe quedar relacionado a un área y cargo válidos.
- No se permite asignar catálogos inactivos en nuevos registros.

---

## Épica 4. Control de asistencia
**Objetivo:** registrar asistencia, controlar tardanzas e identificar inasistencias.

### Historia E4-H1
**Como** RRHH o usuario autorizado  
**quiero** registrar la hora de ingreso  
**para** llevar control diario de asistencia.

**Prioridad:** P0  
**Requisitos relacionados:** REQ-016  
**Criterios de aceptación:**
- Se puede registrar ingreso para un empleado activo.
- El registro guarda fecha y hora exacta.
- El registro queda asociado al usuario que lo creó si fue carga manual.

### Historia E4-H2
**Como** RRHH o usuario autorizado  
**quiero** registrar la hora de salida  
**para** completar la jornada laboral del empleado.

**Prioridad:** P0  
**Requisitos relacionados:** REQ-017  
**Criterios de aceptación:**
- Se puede registrar salida para un ingreso existente o según la política definida.
- El sistema evita inconsistencias obvias de horario.

### Historia E4-H3
**Como** sistema  
**quiero** calcular tardanzas e inasistencias  
**para** facilitar el control administrativo.

**Prioridad:** P0  
**Requisitos relacionados:** REQ-018  
**Criterios de aceptación:**
- El sistema compara la hora registrada con el horario definido.
- Marca tardanza cuando se supera el límite configurado.
- Marca inasistencia cuando no existe registro válido según la regla definida.

### Historia E4-H4
**Como** RRHH, jefe o empleado autorizado  
**quiero** consultar el historial de asistencia  
**para** revisar comportamiento por periodo.

**Prioridad:** P0  
**Requisitos relacionados:** REQ-019  
**Criterios de aceptación:**
- Se puede consultar asistencia por empleado y rango de fechas.
- La consulta muestra ingreso, salida, tardanza, observaciones y estado.

### Historia E4-H5
**Como** sistema  
**quiero** impedir registros duplicados  
**para** preservar la integridad de la asistencia.

**Prioridad:** P0  
**Requisitos relacionados:** REQ-020  
**Criterios de aceptación:**
- No se permite duplicar ingreso o salida según la regla del día.
- El sistema muestra mensaje claro cuando intenta registrarse duplicado.

### Historia E4-H6
**Como** RRHH  
**quiero** justificar tardanzas e inasistencias  
**para** dejar registro formal de excepciones.

**Prioridad:** P1  
**Requisitos relacionados:** REQ-021  
**Criterios de aceptación:**
- Se puede agregar justificación a un evento de tardanza o inasistencia.
- Se conserva historial de quién justificó y cuándo.

### Historia E4-H7
**Como** jefe de área  
**quiero** ver el resumen de asistencia de mi equipo  
**para** detectar incidencias rápidamente.

**Prioridad:** P1  
**Criterios de aceptación:**
- El jefe solo ve empleados de su ámbito.
- Se muestran indicadores básicos de tardanzas e inasistencias.

### Tareas técnicas sugeridas
- Definir reglas simples de horario por empleado o por área.
- Crear tabla de asistencia y estados.
- Diseñar vistas de registro rápido e historial.
- Evaluar si la marca de inasistencia se genera en consulta o por proceso diario.

---

## Épica 5. Permisos y licencias
**Objetivo:** permitir la autogestión y aprobación de solicitudes de permiso.

### Historia E5-H1
**Como** empleado  
**quiero** registrar una solicitud de permiso o licencia  
**para** formalizar mi requerimiento.

**Prioridad:** P0  
**Requisitos relacionados:** REQ-022  
**Criterios de aceptación:**
- El empleado puede ingresar tipo, fechas, motivo y observación.
- La solicitud queda en estado pendiente.
- El sistema registra fecha de creación.

### Historia E5-H2
**Como** empleado  
**quiero** adjuntar sustento documental  
**para** respaldar mi solicitud.

**Prioridad:** P1  
**Requisitos relacionados:** REQ-023  
**Criterios de aceptación:**
- La solicitud permite adjuntar archivo cuando aplica.
- El archivo queda asociado al registro y es accesible para revisores autorizados.

### Historia E5-H3
**Como** jefe de área  
**quiero** aprobar o rechazar solicitudes  
**para** gestionar permisos del equipo.

**Prioridad:** P0  
**Requisitos relacionados:** REQ-024  
**Criterios de aceptación:**
- El jefe puede revisar solicitudes pendientes de su equipo.
- Puede aprobar o rechazar con comentario opcional u obligatorio según política.
- El estado final queda persistido.

### Historia E5-H4
**Como** empleado  
**quiero** ser notificado del estado de mi solicitud  
**para** saber si fue aceptada o rechazada.

**Prioridad:** P0  
**Requisitos relacionados:** REQ-025  
**Criterios de aceptación:**
- El estado actualizado es visible en el sistema.
- El historial muestra la fecha de resolución.
- Si se implementa correo en MVP, la notificación debe enviarse correctamente.

### Historia E5-H5
**Como** empleado o RRHH  
**quiero** consultar historial de solicitudes  
**para** dar seguimiento y trazabilidad.

**Prioridad:** P0  
**Requisitos relacionados:** REQ-026  
**Criterios de aceptación:**
- Se puede filtrar por estado, tipo y rango de fechas.
- El historial muestra aprobador o revisor, cuando exista.

---

## Épica 6. Vacaciones
**Objetivo:** gestionar solicitudes de vacaciones y controlar saldo disponible.

### Historia E6-H1
**Como** empleado  
**quiero** consultar mi saldo de vacaciones  
**para** saber cuántos días puedo solicitar.

**Prioridad:** P0  
**Requisitos relacionados:** REQ-028  
**Criterios de aceptación:**
- El empleado visualiza saldo disponible, usado y pendiente.
- RRHH también puede consultar el saldo de cualquier empleado autorizado.

### Historia E6-H2
**Como** empleado  
**quiero** solicitar vacaciones  
**para** gestionar mi descanso de forma formal.

**Prioridad:** P0  
**Requisitos relacionados:** REQ-027  
**Criterios de aceptación:**
- La solicitud registra fechas solicitadas y observación.
- El sistema calcula días solicitados.
- La solicitud queda en estado pendiente.

### Historia E6-H3
**Como** sistema  
**quiero** validar que la solicitud no exceda el saldo disponible  
**para** evitar inconsistencias.

**Prioridad:** P0  
**Requisitos relacionados:** REQ-029  
**Criterios de aceptación:**
- Si la solicitud excede el saldo, el sistema la rechaza antes de guardar o aprobar según la regla elegida.
- El mensaje indica claramente el motivo.

### Historia E6-H4
**Como** jefe de área o RRHH  
**quiero** aprobar o rechazar vacaciones  
**para** controlar la disponibilidad del personal.

**Prioridad:** P0  
**Requisitos relacionados:** REQ-030  
**Criterios de aceptación:**
- La solicitud puede pasar por estados pendiente, aprobada o rechazada.
- La resolución queda trazada con usuario y fecha.

### Historia E6-H5
**Como** sistema  
**quiero** actualizar automáticamente el saldo cuando una solicitud es aprobada  
**para** mantener información consistente.

**Prioridad:** P0  
**Requisitos relacionados:** REQ-031  
**Criterios de aceptación:**
- El saldo se descuenta al aprobar la solicitud.
- Si la solicitud se rechaza, el saldo permanece intacto.

### Historia E6-H6
**Como** empleado o RRHH  
**quiero** consultar historial de vacaciones  
**para** revisar consumo y decisiones previas.

**Prioridad:** P1  
**Criterios de aceptación:**
- El historial permite filtro por estado y rango de fechas.
- Se visualiza cantidad de días y resolución.

### Tareas técnicas sugeridas
- Definir modelo de saldo inicial de vacaciones.
- Elegir regla de cálculo de días hábiles o calendario para MVP.
- Diseñar tablero simple de solicitudes pendientes.

---

## Épica 7. Contratos laborales
**Objetivo:** registrar contratos y controlar vencimientos.

### Historia E7-H1
**Como** RRHH  
**quiero** registrar contratos laborales  
**para** mantener la información contractual del empleado.

**Prioridad:** P1  
**Requisitos relacionados:** REQ-032, REQ-033  
**Criterios de aceptación:**
- Se registra tipo de contrato, fecha de inicio y fecha de fin.
- El contrato queda vinculado al empleado.

### Historia E7-H2
**Como** RRHH  
**quiero** consultar historial de contratos  
**para** conocer la evolución laboral del empleado.

**Prioridad:** P1  
**Requisitos relacionados:** REQ-036  
**Criterios de aceptación:**
- La ficha del empleado muestra contratos anteriores y vigente.

### Historia E7-H3
**Como** RRHH  
**quiero** renovar contratos existentes  
**para** mantener continuidad laboral sin perder historial.

**Prioridad:** P1  
**Requisitos relacionados:** REQ-035  
**Criterios de aceptación:**
- La renovación genera un nuevo registro relacionado.
- El historial previo no se sobrescribe.

### Historia E7-H4
**Como** RRHH  
**quiero** recibir alertas de contratos por vencer  
**para** actuar oportunamente.

**Prioridad:** P1  
**Requisitos relacionados:** REQ-034  
**Criterios de aceptación:**
- El sistema lista contratos próximos a vencer según umbral configurable.
- La alerta es visible en dashboard o reporte.

---

## Épica 8. Reportes
**Objetivo:** entregar información consolidada para control y toma de decisiones.

### Historia E8-H1
**Como** RRHH o administrador  
**quiero** generar reporte de empleados activos e inactivos  
**para** consultar el estado del personal.

**Prioridad:** P1  
**Requisitos relacionados:** REQ-037  
**Criterios de aceptación:**
- El reporte permite filtrar por estado.
- El reporte muestra sede, área, cargo y condición.

### Historia E8-H2
**Como** RRHH o jefe autorizado  
**quiero** generar reporte de asistencia por rango de fechas  
**para** controlar incidencias del personal.

**Prioridad:** P1  
**Requisitos relacionados:** REQ-038  
**Criterios de aceptación:**
- El reporte filtra por rango de fechas.
- El reporte puede segmentarse por empleado, sede o área.

### Historia E8-H3
**Como** RRHH  
**quiero** generar reporte de permisos y vacaciones  
**para** hacer seguimiento administrativo.

**Prioridad:** P1  
**Requisitos relacionados:** REQ-039  
**Criterios de aceptación:**
- El reporte distingue tipo de solicitud y estado.
- El reporte permite filtros por fecha y empleado.

### Historia E8-H4
**Como** RRHH  
**quiero** generar reporte de contratos próximos a vencer  
**para** priorizar renovaciones.

**Prioridad:** P1  
**Requisitos relacionados:** REQ-040  
**Criterios de aceptación:**
- El reporte muestra contratos dentro del umbral de vencimiento.
- El reporte muestra empleado, cargo, sede y fecha fin.

### Historia E8-H5
**Como** usuario autorizado  
**quiero** exportar reportes a PDF o Excel  
**para** compartir y respaldar información.

**Prioridad:** P1  
**Requisitos relacionados:** REQ-041  
**Criterios de aceptación:**
- Los reportes definidos pueden descargarse en al menos un formato del MVP.
- Si se incluyen ambos formatos, los datos deben ser consistentes entre ellos.

### Tareas técnicas sugeridas
- Definir consultas optimizadas para reportes.
- Elegir librería de exportación para Excel y PDF.
- Mantener filtros homogéneos entre UI y API.

---

## Épica 9. Auditoría y trazabilidad
**Objetivo:** registrar acciones críticas del sistema para control y seguimiento.

### Historia E9-H1
**Como** sistema  
**quiero** registrar creación, edición y desactivación de registros críticos  
**para** mantener trazabilidad.

**Prioridad:** P1  
**Requisitos relacionados:** REQ-045  
**Criterios de aceptación:**
- Se auditan acciones al menos en usuarios, empleados, asistencia, permisos, vacaciones y contratos.
- La auditoría no bloquea la operación principal por errores menores de visualización.

### Historia E9-H2
**Como** administrador o RRHH autorizado  
**quiero** consultar bitácora con usuario, fecha y acción  
**para** revisar cambios del sistema.

**Prioridad:** P1  
**Requisitos relacionados:** REQ-046  
**Criterios de aceptación:**
- La bitácora muestra fecha, hora, usuario, módulo y acción.
- La bitácora admite filtros por usuario, módulo y rango de fechas.

---

## Requerimientos no funcionales aterrizados al backlog

### Seguridad
- Contraseñas cifradas.
- Control de acceso por roles y permisos.
- Protección de endpoints backend.
- No exponer datos sensibles en errores.

### Rendimiento
- Operaciones comunes bajo el umbral definido por el SRS.
- Listados con filtros y paginación.
- Consultas optimizadas para reportes y fichas completas.

### Usabilidad
- Interfaz consistente y responsiva.
- Formularios con validación clara.
- Navegación por rol con accesos relevantes.

### Mantenibilidad
- Backend modular por dominios.
- Componentes reutilizables en frontend.
- Migraciones versionadas.
- Configuración centralizada por ambiente.

### Respaldo y operación
- Persistencia de datos en PostgreSQL con volumen.
- Estrategia inicial de backup documentada.
- Variables de entorno para secretos y configuración.

## Dependencias funcionales
- No se puede operar permisos, vacaciones, contratos o asistencia sin empleados activos.
- No se puede registrar empleados sin catálogos mínimos de áreas, cargos y sedes.
- No se puede aplicar restricciones completas sin roles y permisos definidos.
- Los reportes dependen de la disponibilidad de datos operativos previos.
- La auditoría debe integrarse transversalmente con los módulos principales.

## Propuesta de sprints

## Sprint 0. Fundaciones
**Objetivo:** dejar operativo el entorno técnico.

**Incluye:**
- Épica 0 completa
- Base de autenticación técnica
- Diseño base de layout y navegación
- Migraciones iniciales y seed de roles

**Resultado esperado:**
- Proyecto levanta con Docker
- Se puede acceder a frontend y backend
- Existe usuario administrador inicial

## Sprint 1. Seguridad y maestro organizacional
**Objetivo:** habilitar acceso seguro y catálogo organizacional.

**Incluye:**
- Historias principales de Épica 1
- Historias principales de Épica 2
- Historias principales de Épica 3

**Resultado esperado:**
- Login funcional
- Gestión de usuarios, roles, empleados, áreas, cargos y sedes

## Sprint 2. Operación diaria
**Objetivo:** cubrir el corazón operativo del sistema.

**Incluye:**
- Épica 4 principal
- Épica 5 principal
- Vistas por rol para empleado, jefe y RRHH

**Resultado esperado:**
- Se puede registrar asistencia
- Se pueden crear y resolver solicitudes de permisos

## Sprint 3. Gestión administrativa extendida
**Objetivo:** cerrar flujos de vacaciones y contratos.

**Incluye:**
- Épica 6 principal
- Épica 7 principal

**Resultado esperado:**
- Solicitudes de vacaciones operativas
- Contratos registrados y alertas visibles

## Sprint 4. Cierre de MVP
**Objetivo:** consolidar control, evidencia y calidad.

**Incluye:**
- Épica 8 principal
- Épica 9 principal
- Endurecimiento de validaciones y QA integral

**Resultado esperado:**
- Reportes básicos exportables
- Bitácora funcional
- Demo estable del MVP

## Casos de prueba de alto nivel
- Login con credenciales correctas e incorrectas.
- Usuario sin permiso intentando acceder a módulo restringido.
- Registro de empleado con DNI duplicado.
- Desactivación de empleado sin pérdida de historial.
- Registro de ingreso y salida con prevención de duplicados.
- Cálculo correcto de tardanza según regla definida.
- Solicitud de permiso aprobada y rechazada por jefe.
- Solicitud de vacaciones mayor al saldo disponible.
- Actualización automática de saldo tras aprobación de vacaciones.
- Registro y renovación de contratos.
- Visualización de contratos por vencer.
- Exportación de reportes.
- Registro de auditoría ante acciones críticas.
- Levantamiento completo del sistema con Docker.

## Definition of Done sugerida
Una historia se considera terminada cuando:
- Tiene desarrollo frontend y backend completos si aplica.
- Cumple criterios de aceptación funcionales.
- Tiene validaciones de negocio y manejo de errores.
- Respeta permisos por rol.
- Está probada manualmente en entorno local.
- Si impacta base de datos, incluye migración.
- Si impacta configuración, está documentada.

## Riesgos y alertas tempranas
- Definir tarde las reglas de tardanza puede retrasar asistencia.
- No aclarar política de saldo de vacaciones puede generar reprocesos.
- El manejo de archivos adjuntos puede complicarse si no se define temprano.
- Los reportes pueden crecer mucho si no se diseñan filtros desde el inicio.
- Si se posterga auditoría demasiado, luego será más costoso integrarla.

## Recomendación de implementación
Para la primera versión conviene construir primero la base de seguridad, empleados y estructura organizacional, luego asistencia y solicitudes, y finalmente reportes y auditoría. Ese orden reduce bloqueos porque los módulos administrativos dependen directamente de la existencia de empleados, roles y catálogos bien definidos.
