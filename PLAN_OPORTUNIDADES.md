# Plan técnico — FASE 1: split Contacto/Oportunidad + equipos en PREVENTA

> Deriva de `DOMINIO_OPORTUNIDADES.md` (Parte E). **Reemplazo completo en código**
> (refactor de raíz Lead→Contacto/Oportunidad) + **migración de datos no destructiva**
> (la tabla `lead` se conserva como rollback hasta verificar). Cambios en lead-service y
> auth-service. Objetivo: separar PREVENTA por equipos sin que el equipo 1 note diferencia
> (DTOs preservados), dejando el cimiento Contacto/Oportunidad.
> Última actualización: 2026-06-15.

---

## 1. Arquitectura de equipos (cruza dos microservicios)

Cada servicio posee su parte. **No** hay FK entre servicios; el `idEquipo` es una
referencia lógica que viaja en el JWT.

| Servicio | Posee | Detalle |
|---|---|---|
| **auth-service** | `Equipo` (identidad) + membresía usuario↔equipo + claim JWT | Quién es de qué equipo |
| **lead-service** | mapping `equipo_proveedor` + `idEquipo` en Oportunidad | Qué proveedores ve cada equipo |

Flujo: ADMIN asigna usuario→equipo (auth) y proveedores→equipo (lead). El usuario hace
login → JWT trae `equipos`. lead-service filtra por `equipos` y, para campañas/planes,
resuelve los proveedores del equipo vía su tabla `equipo_proveedor`.

---

## 2. Cambios en auth-service

1. **Entidad `Equipo`**: `id`, `nombre`, `activo`, timestamps.
2. **Membresía**: `Usuario` → `@ManyToMany` con `Equipo` (tabla `usuario_equipo`).
   - Hoy se usa **0..1 equipo** por usuario (operativos = 1; ADMIN/COMMUNITY = 0).
   - Se modela como colección desde el inicio para no migrar si en el futuro se necesita
     multi-equipo. La regla "operativos = 1 equipo" se valida en el servicio.
3. **Claim JWT**: en [JWTUtil.generateToken](auth-service/src/main/java/pe/albrugroup/auth_service/security/JWTUtil.java)
   agregar `claims.put("equipos", List<Long> idsEquipo)`. Array vacío = sin equipo.
4. **Permiso global**: definir `VER_TODOS_LOS_EQUIPOS` (o reusar rol ADMIN) que en
   lead-service salta el filtro. Asignable a ADMIN y a quien necesite panorama completo.
   - **Membresía obligatoria** para roles operativos (GTR/ASESOR/SUPERVISOR/BACKOFFICE):
     auth valida que no se pueda tener un rol operativo sin equipo.
   - **Fail-closed**: sin equipo y sin permiso global ⇒ filtro con lista vacía ⇒ no ve
     nada. "Sin equipo" jamás abre acceso global (eso evita fuga de alcance por mala config).
5. **Endpoints ADMIN**: CRUD de `Equipo` + asignar/retirar usuarios de un equipo.
6. **Flyway auth**: migración para `equipo`, `usuario_equipo` y el permiso nuevo.

> Roles como tabla centralizada (sacar el enum de los demás MS) NO entra en Fase 1; va en
> paralelo si hay tiempo. No bloquea esto.

---

## 3. Cambios en lead-service — modelo de datos

### 3.1 Entidades nuevas
- **`Contacto`**: `id`, `prefijo`, `lead` (UNIQUE `prefijo+lead`), `nombreConocido` (cache),
  timestamps. Identidad del teléfono.
- **`Oportunidad`**: es el `Lead` actual **renombrado**, menos la identidad del teléfono,
  más:
  - `@ManyToOne Contacto contacto`
  - `Long idEquipo` (referencia lógica al equipo de auth)
  - conserva: `etapa`, `estado` (EstadoSeguimiento), asesor asignado, `campana` (nullable),
    `base`, tipificaciones, `DatosPreventa`, `Direccion`, oferta (plan/promo/adicionales),
    snapshots, atribución por etapa, `lastEntryAt`, y **por ahora** los campos de
    postventa/cobranza (Contrato se difiere).
- **`equipo_proveedor`**: mapping `idEquipo` (lógico) → `Proveedor`. Resuelve qué
  campañas/planes/promos ve cada equipo.

### 3.2 Migración (backfill, no destructivo)
- DDL en Flyway (`V5`): crear `contacto`, `oportunidad`, `equipo_proveedor`, columna
  `id_equipo`. **No** se toca/borra la tabla `lead` todavía.
- Backfill (job/endpoint idempotente, fuera de horario):
  1. Cada fila `lead` → 1 `contacto` (dedup por `prefijo+lead`) + 1 `oportunidad`.
  2. `idEquipo` de cada oportunidad: vía `campana → proveedor → equipo` (mapping seed);
     si `campana` es la BASE actual o null → equipo por defecto (Equipo 1).
  3. Eventos re-asociados a la oportunidad.
- Seed: crear Equipo 1 = {WIN, PERUFIBRA, MIFIBRA}, Equipo 2 = {CLARO}; asignar usuarios
  actuales a Equipo 1; eliminar la campaña BASE (los leads BASE quedan con `campana=null`).

---

## 4. Filtrado por equipo — mecanismo central (clave)

`LeadRepository` tiene ~55 queries. **No** editarlas una por una. Opciones (recomendada la 1):

1. **Hibernate `@Filter`** estilo multi-tenant: un filtro `equipoFilter` sobre
   `Oportunidad`, habilitado por request con los `equipos` del usuario (interceptor que lee
   el JWT). Las queries derivadas y la mayoría de `@Query` quedan filtradas automáticamente.
   ADMIN/permiso global → no se habilita el filtro.
2. Spring Data **Specifications** + base repository (más invasivo).
3. Parámetro `equipos` explícito hilado por el service (último recurso; 55 cambios).

Casos a revisar a mano igual: queries nativas con agregaciones (rankings, resúmenes por
proveedor) — ahí el filtro `@Filter` puede no aplicar y hay que añadir el `WHERE` explícito.

---

## 5. Intake y dedup
- `registrarIngresoLead` ([LeadService](lead-service/src/main/java/pe/albrugroup/lead_service/service/LeadService.java:1073)):
  resolver `Contacto` por `prefijo+lead` (crear si no existe) → buscar **oportunidad activa**
  de `(contacto, equipo)` → REGISTRO + `lastEntryAt` si existe, o crear oportunidad.
- Equipo: `campana → proveedor → equipo`; si `campana=null`, equipo = del usuario (JWT).
- **Sin** constraint `UNIQUE(contacto+equipo)`. La "oportunidad activa" se resuelve por
  lógica (la abierta más reciente del equipo). Multi-titular = Fase 1.5.
- Masivo (Excel): misma derivación; soporta `campana=null`.

---

## 6. Frontend
- Listados/bandejas: sin cambios visibles para equipo 1 (mismo contrato de API + filtro
  por equipo transparente vía JWT).
- Campañas/planes/promos: el backend ya devuelve solo las del equipo → el frontend las
  muestra tal cual.
- **Equipo 2 (CLARO)**: el modal de ASESOR_VENTAS habilita **todos** los campos de
  `DatosPreventa`/`Direccion` (hoy ocultos), condicional al equipo/proveedor.
- ADMIN: vista nueva para gestionar equipos (usuarios y proveedores).

---

## 7. Orden de implementación
1. auth: `Equipo` + membresía + claim `equipos` + permiso global + endpoints ADMIN.
2. lead: entidades `Contacto`/`Oportunidad` + `equipo_proveedor` + DDL Flyway (sin tocar
   `lead`).
3. lead: `JWTUtil`/`UserSession` leen `equipos`; interceptor que habilita el `@Filter`.
4. lead: refactor service/controllers `Lead`→`Oportunidad` preservando DTOs.
5. lead: ajustar intake/dedup + eliminación de campaña BASE.
6. Backfill idempotente + seed de equipos/proveedores.
7. Frontend: modal equipo 2 + vista ADMIN de equipos.
8. **Verificación** sobre copia local (ver §8).

---

## 8. Verificación (la red de seguridad)
- Antes del refactor: capturar respuestas de los endpoints de PREVENTA clave con un usuario
  de equipo 1 (listado diario, históricos, agendados, recuperación, asignación, rankings).
- Después: mismas llamadas → mismos resultados para equipo 1 (regresión).
- Crear usuario de equipo 2, asignar CLARO, verificar aislamiento: equipo 1 no ve datos de
  equipo 2 y viceversa; campañas/planes correctos por equipo; modal equipo 2 completo.
- ADMIN: ve ambos equipos.

---

## 9. Riesgos y mitigaciones
| Riesgo | Mitigación |
|---|---|
| Romper queries de PREVENTA al renombrar/extraer | DTOs preservados + regresión sobre copia local antes del cutover |
| ~55 queries con filtro | Filtro central (`@Filter`), no edición masiva |
| Rankings/nativas sin filtrar | Revisión manual de queries agregadas |
| Migración en prod | Ensayo en staging + backup + no destructivo + backfill idempotente |
| Acoplamiento auth↔lead por equipos | Referencia lógica por id en JWT, sin FK cruzada |

---

## 10. Pendientes a confirmar antes de codear
- ¿`Equipo` vive físicamente en auth y lead solo guarda `idEquipo` + mapping? (asumido sí)
- ¿La vista ADMIN de equipos es una sola pantalla que habla con auth (membresía) y lead
  (proveedores), o dos pantallas? (UX)
- Confirmar `@Filter` de Hibernate como mecanismo (vs Specifications) tras un spike corto.

---

## Anexo — Mini-plan T9 (split Contacto/Oportunidad)

Basado en la superficie real: `LeadRepository` ~55 queries, casi todas `FROM Lead l`
usando `l.lead`, `l.prefijo`, `l.campana`, `l.etapa`, `l.estado`, `l.idAsesorAsignado`,
`l.datosPreventa`, etc. `Evento.idLead`, `PagoPostventa.leadId`, `EncuestaPostventa.leadId`
referencian `lead.id` por id suelto (sin FK JPA).

### Decisiones clave (minimizan riesgo)
1. **Oportunidad conserva `prefijo` + `lead` denormalizados** (snapshot del contacto), además
   de `contacto` (FK) + `idEquipo`. → Las ~55 queries cambian SOLO `Lead`→`Oportunidad`
   (rename de clase), sin re-rutear `l.lead`/`l.prefijo` ni agregar joins. `Contacto` es el
   ancla de identidad/dedup y futura multi-titular. (El teléfono es la identidad: no cambia,
   así que denormalizarlo es seguro y estándar.)
2. **El backfill preserva los ids** (`oportunidad.id = lead.id`). → `Evento.idLead`,
   `PagoPostventa.leadId`, `EncuestaPostventa.leadId` y el realtime quedan válidos **sin tocar
   nada**. `Evento.idLead` se mantiene con ese nombre (ahora apunta a oportunidad.id).
3. **Contrato diferido**: los campos de postventa/cobranza/COMISION se quedan en `Oportunidad`
   por ahora → `PostventaController`/`CobranzaController` y su lógica quedan intactos.

### Entidades
- **`Contacto`** (nuevo): `id`, `prefijo`, `lead` (UNIQUE `prefijo+lead`), `nombreConocido`, ts.
- **`Oportunidad`** (= `Lead` renombrado): mismos campos + `@ManyToOne Contacto contacto` +
  `Long idEquipo`. Conserva prefijo/lead/snapshots/postventa por ahora.

### Qué se renombra / qué se preserva
- `LeadRepository` → `OportunidadRepository` (mismas 55 queries, `Lead`→`Oportunidad`).
- `LeadService`, `LeadMapper` → referencias a `Oportunidad`.
- **DTOs conservan nombre** (`LeadResponse`, `LeadGtrResponse`, …) → frontend de PREVENTA
  no se entera. (Renombrarlos sería cosmético y rompería el contrato; se evita.)
- `Lead.java` + `LeadRepository` se eliminan al final, tras compilar.

### Flyway (lead-service `V6`) — DDL + backfill no destructivo
- Crea `contacto` y `oportunidad` (+ índices equivalentes a los de `Lead`). **Conserva `lead`.**
- Backfill SQL (≈26k filas, trivial para `INSERT … SELECT`):
  - `contacto`: distinct `(prefijo, lead)` desde `lead`.
  - `oportunidad`: `INSERT (id, …) SELECT id, …` (preserva id), resuelve `contacto_id` por join,
    deriva `id_equipo` vía `campana → proveedor → equipo_proveedor` (si no hay mapping →
    Equipo por defecto). `setval` de la secuencia tras insertar.
- Sequencing: los equipos (auth) + `equipo_proveedor` (lead) deben existir **antes** del
  backfill para derivar `id_equipo`; sin mapping, default a Equipo 1.

### Orden de refactor (build verde en cada bloque)
1. `Contacto` + `Oportunidad` (entidades).  2. `OportunidadRepository` (copia + rename).
3. `LeadService`/`LeadMapper` → `Oportunidad`.  4. Eliminar `Lead`/`LeadRepository`.
5. Flyway `V6` (DDL + backfill).  6. `@Filter` por `idEquipo` (T10) sobre `Oportunidad`.

### Decisiones a confirmar
- ¿Denormalizar `prefijo`+`lead` en Oportunidad (recomendado) o moverlos solo a Contacto?
- ¿Backfill como SQL en Flyway (recomendado, simple para tu volumen) o job Java aparte?

### Ajuste final (decisión) — SIN rename, la entidad sigue siendo `Lead`
Tras ver el código real: **no se renombra `Lead`→`Oportunidad`**. La entidad `Lead`, una vez
extraído `Contacto`, **ya es la gestión** ("Oportunidad" en el dominio = entidad `Lead` en
código). Beneficios: coherencia total (nada de entidad `Oportunidad` con `LeadRepository`),
cero churn/riesgo en los ~7 archivos, y coincide con el vocabulario del equipo ("lead").

Implementación revisada de T9 (aditiva, no destructiva):
1. `Contacto` (nuevo) — hecho.
2. `Lead` gana `@ManyToOne Contacto contacto` (`id_contacto`) + `Long idEquipo`. Conserva
   `prefijo`/`lead` denormalizados y todos los campos actuales (postventa incluido).
3. Intake: resolver/crear `Contacto` por `prefijo+lead`, asignarlo al `Lead`; derivar
   `idEquipo` (campaña→proveedor→equipo; si no, del usuario).
4. Flyway `V6`: `CREATE TABLE contacto`; `ALTER TABLE lead ADD COLUMN id_contacto`,
   `ADD COLUMN id_equipo` (nullable, FK a contacto); backfill `contacto` + `UPDATE lead`.
   Los ids de `lead` no cambian → Evento/Pago/Encuesta intactos.
5. Filtro `@Filter` por `lead.idEquipo` (T10).
