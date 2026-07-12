-- Backfill de leads existentes en VENTA inconsistente.
--
-- Uso recomendado desde psql dentro del contenedor o con una ruta visible
-- para el servidor PostgreSQL:
--   \set csv_path '/tmp/backfill_existentes_limpio.csv'
--   \i OLD/BackfillPOSTVENTA/backfill_existentes_venta.sql
--
-- Por defecto este archivo solo carga staging y muestra conteos.
-- Para aplicar cambios, ejecutar con:
--   -v apply_backfill=1
-- Para probar toda la sección mutadora y revertir al final:
--   -v apply_backfill=1 -v rollback_backfill=1

\set ON_ERROR_STOP on

\if :{?csv_path}
\else
\set csv_path '/tmp/backfill_existentes_limpio.csv'
\endif

drop table if exists stg_backfill_existentes;

create temp table stg_backfill_existentes (
    accion_backfill text,
    lead_id_bd text,
    telefono text,
    prefijo text,
    proveedor text,
    id_proveedor text,
    id_equipo text,
    estado_actual_bd text,
    etapa_actual_bd text,
    base text,
    id_campana text,
    id_plan_resuelto text,
    tipo_documento text,
    numero_documento_titular_servicio text,
    nombre_titular_servicio text,
    celular_registro text,
    celular_referencia text,
    correo text,
    ubigeo_nacimiento text,
    numero_documento_titular_celular_registro text,
    nombre_titular_celular_registro text,
    ubigeo_domicilio text,
    distrito_domicilio_fuente text,
    tipo_domicilio text,
    tipo_via text,
    via text,
    direccion text,
    referencia text,
    piso text,
    interior text,
    latitud text,
    longitud text,
    nombre_plan_snapshot text,
    nombre_proveedor_snapshot text,
    precio_plan_snapshot text,
    precio_final text,
    precio_adicionales_snapshot text,
    dia_corte_facturacion text,
    meses_permanencia_snapshot text,
    estado_postventa text,
    fecha_gestion_at text,
    fecha_instalacion text,
    asesor_preventa_nombre text,
    asesor_preventa_id text,
    asesor_backoffice_nombre text,
    asesor_backoffice_id text,
    tipificacion_evento text,
    subtipificacion_evento text,
    fila_excel text,
    duplicado_excel text,
    errores_validacion text,
    warnings text
);

copy stg_backfill_existentes from :'csv_path' with (format csv, header true, encoding 'UTF8');

create temp table stg_backfill_aplicable as
select
    s.*,
    nullif(btrim(s.lead_id_bd), '')::bigint as lead_id,
    nullif(btrim(s.id_plan_resuelto), '')::bigint as id_plan,
    nullif(btrim(s.id_equipo), '')::bigint as equipo_id,
    nullif(btrim(s.asesor_preventa_id), '')::bigint as asesor_preventa_id_bigint,
    nullif(btrim(s.asesor_backoffice_id), '')::bigint as asesor_backoffice_id_bigint,
    nullif(btrim(s.precio_plan_snapshot), '')::numeric as precio_plan_num,
    nullif(btrim(s.precio_final), '')::numeric as precio_final_num,
    coalesce(nullif(btrim(s.precio_adicionales_snapshot), '')::numeric, 0) as precio_adicionales_num,
    nullif(btrim(s.dia_corte_facturacion), '')::integer as dia_corte_int,
    nullif(btrim(s.meses_permanencia_snapshot), '')::integer as meses_permanencia_int,
    nullif(btrim(s.fecha_gestion_at), '')::timestamptz as fecha_gestion_ts,
    nullif(btrim(s.fecha_instalacion), '')::date as fecha_instalacion_date
from stg_backfill_existentes s
where s.accion_backfill in ('PASAR_POSTVENTA', 'DEVOLVER_PREVENTA')
  and coalesce(nullif(btrim(s.errores_validacion), ''), '') = '';

create temp table stg_backfill_targets as
select
    s.*,
    l.id_contacto,
    l.id_datos_preventa as lead_id_datos_preventa_actual,
    l.id_direccion as lead_id_direccion_actual,
    coalesce(s.fecha_gestion_ts, l.last_entry_at, l.updated_at, l.created_at, now() - interval '1 day') as ref_at,
    coalesce(s.fecha_instalacion_date, coalesce(s.fecha_gestion_ts, l.last_entry_at, l.updated_at, l.created_at, now())::date) as install_date
from stg_backfill_aplicable s
join lead l on l.id = s.lead_id
where (
    l.etapa = 'VENTA'
    and (
      nullif(btrim(l.numero_documento_titular_servicio_snapshot), '') is null
      or nullif(btrim(l.direccion_snapshot), '') is null
      or l.id_plan is null
    )
  )
  or (
    s.accion_backfill = 'PASAR_POSTVENTA'
    and l.etapa = 'PREVENTA'
  )
  or (
    s.accion_backfill = 'DEVOLVER_PREVENTA'
    and l.etapa = 'PREVENTA'
    and (
      not exists (
        select 1
        from evento e
        where e.id_lead = l.id
          and e.accion = 'TIPIFICACION'
          and e.etapa = 'VENTA'
          and e.tipificacion = 'SIN SUBIR'
          and e.subtipificacion = 'MAL REGISTRADO'
      )
      or not exists (
        select 1
        from lead_etapa_resumen r
        where r.id_lead = l.id
          and r.etapa = 'VENTA'
          and r.ultima_codigo_tipificacion = 'SIN SUBIR'
          and r.ultima_codigo_subtipificacion = 'MAL REGISTRADO'
      )
    )
  );

select accion_backfill, count(*) as filas_csv
from stg_backfill_existentes
group by accion_backfill
order by accion_backfill;

select accion_backfill, count(*) as filas_aplicables_estado_actual
from stg_backfill_targets
group by accion_backfill
order by accion_backfill;

select count(*) as filas_bloqueadas_por_error_validacion
from stg_backfill_existentes
where accion_backfill = 'REVISAR'
   or coalesce(nullif(btrim(errores_validacion), ''), '') <> '';

\if :{?apply_backfill}
\else
\echo 'Dry-run terminado. No se aplicaron cambios. Ejecuta con -v apply_backfill=1 para aplicar.'
\quit
\endif

begin;

create temp table stg_new_datos_preventa as
select t.lead_id, nextval('datos_preventa_id_seq') as id
from stg_backfill_targets t
join lead l on l.id = t.lead_id
where t.accion_backfill = 'PASAR_POSTVENTA'
  and l.id_datos_preventa is null;

insert into datos_preventa (
    id,
    tipo_documento,
    numero_documento_titular_servicio,
    ubigeo_nacimiento,
    nombre_titular_servicio,
    celular_registro,
    celular_referencia,
    correo,
    numero_documento_titular_celular_registro,
    nombre_titular_celular_registro
)
select
    n.id,
    nullif(btrim(t.tipo_documento), ''),
    nullif(btrim(t.numero_documento_titular_servicio), ''),
    nullif(btrim(t.ubigeo_nacimiento), ''),
    nullif(btrim(t.nombre_titular_servicio), ''),
    nullif(btrim(t.celular_registro), ''),
    nullif(btrim(t.celular_referencia), ''),
    nullif(btrim(t.correo), ''),
    nullif(btrim(t.numero_documento_titular_celular_registro), ''),
    nullif(btrim(t.nombre_titular_celular_registro), '')
from stg_new_datos_preventa n
join stg_backfill_targets t on t.lead_id = n.lead_id;

update lead l
set id_datos_preventa = n.id
from stg_new_datos_preventa n
where l.id = n.lead_id;

update datos_preventa dp
set
    tipo_documento = nullif(btrim(t.tipo_documento), ''),
    numero_documento_titular_servicio = nullif(btrim(t.numero_documento_titular_servicio), ''),
    ubigeo_nacimiento = nullif(btrim(t.ubigeo_nacimiento), ''),
    nombre_titular_servicio = nullif(btrim(t.nombre_titular_servicio), ''),
    celular_registro = nullif(btrim(t.celular_registro), ''),
    celular_referencia = nullif(btrim(t.celular_referencia), ''),
    correo = nullif(btrim(t.correo), ''),
    numero_documento_titular_celular_registro = nullif(btrim(t.numero_documento_titular_celular_registro), ''),
    nombre_titular_celular_registro = nullif(btrim(t.nombre_titular_celular_registro), '')
from stg_backfill_targets t
join lead l on l.id = t.lead_id
where t.accion_backfill = 'PASAR_POSTVENTA'
  and dp.id = l.id_datos_preventa;

create temp table stg_new_direccion as
select t.lead_id, nextval('direccion_id_seq') as id
from stg_backfill_targets t
join lead l on l.id = t.lead_id
where t.accion_backfill = 'PASAR_POSTVENTA'
  and l.id_direccion is null;

insert into direccion (
    id,
    ubigeo_domicilio,
    tipo_domicilio,
    tipo_via,
    via,
    direccion,
    referencia,
    latitud,
    longitud,
    piso,
    interior
)
select
    n.id,
    nullif(btrim(t.ubigeo_domicilio), ''),
    nullif(btrim(t.tipo_domicilio), ''),
    nullif(btrim(t.tipo_via), ''),
    nullif(btrim(t.via), ''),
    nullif(btrim(t.direccion), ''),
    nullif(btrim(t.referencia), ''),
    nullif(btrim(t.latitud), ''),
    nullif(btrim(t.longitud), ''),
    nullif(btrim(t.piso), ''),
    nullif(btrim(t.interior), '')
from stg_new_direccion n
join stg_backfill_targets t on t.lead_id = n.lead_id;

update lead l
set id_direccion = n.id
from stg_new_direccion n
where l.id = n.lead_id;

update direccion d
set
    ubigeo_domicilio = nullif(btrim(t.ubigeo_domicilio), ''),
    tipo_domicilio = nullif(btrim(t.tipo_domicilio), ''),
    tipo_via = nullif(btrim(t.tipo_via), ''),
    via = nullif(btrim(t.via), ''),
    direccion = nullif(btrim(t.direccion), ''),
    referencia = nullif(btrim(t.referencia), ''),
    latitud = nullif(btrim(t.latitud), ''),
    longitud = nullif(btrim(t.longitud), ''),
    piso = nullif(btrim(t.piso), ''),
    interior = nullif(btrim(t.interior), '')
from stg_backfill_targets t
join lead l on l.id = t.lead_id
where t.accion_backfill = 'PASAR_POSTVENTA'
  and d.id = l.id_direccion;

update contacto c
set
    prefijo = nullif(btrim(t.prefijo), ''),
    updated_at = t.ref_at
from stg_backfill_targets t
join lead l on l.id = t.lead_id
where c.id = l.id_contacto
  and t.accion_backfill in ('PASAR_POSTVENTA', 'DEVOLVER_PREVENTA');

update lead l
set
    prefijo = nullif(btrim(t.prefijo), ''),
    etapa = 'POSTVENTA',
    estado = 'NUEVO',
    id_asesor_asignado = null,
    nombre_asesor_asignado = null,
    id_campana = null,
    base = 'RECONTACTO',
    id_tipificacion = null,
    codigo_tipificacion = null,
    id_subtipificacion = null,
    codigo_subtipificacion = null,
    numero_documento_titular_servicio_snapshot = nullif(btrim(t.numero_documento_titular_servicio), ''),
    direccion_snapshot = nullif(btrim(t.direccion), ''),
    id_plan = t.id_plan,
    nombre_plan_snapshot = nullif(btrim(t.nombre_plan_snapshot), ''),
    nombre_proveedor_snapshot = nullif(btrim(t.nombre_proveedor_snapshot), ''),
    precio_plan_snapshot = t.precio_plan_num,
    id_promocion_interna = null,
    nombre_promocion_interna_snapshot = null,
    precio_adicionales_snapshot = t.precio_adicionales_num,
    precio_final = t.precio_final_num,
    dia_corte_facturacion = t.dia_corte_int,
    meses_permanencia_snapshot = t.meses_permanencia_int,
    estado_postventa = 'EN_SEGUIMIENTO',
    last_entry_at = t.ref_at,
    updated_at = t.ref_at,
    id_equipo = t.equipo_id,
    requiere_atencion_gtr = false
from stg_backfill_targets t
where l.id = t.lead_id
  and t.accion_backfill = 'PASAR_POSTVENTA';

update lead l
set
    etapa = 'PREVENTA',
    estado = 'NUEVO',
    id_asesor_asignado = null,
    nombre_asesor_asignado = null,
    id_tipificacion = null,
    codigo_tipificacion = null,
    id_subtipificacion = null,
    codigo_subtipificacion = null,
    estado_postventa = null,
    last_entry_at = t.ref_at,
    updated_at = t.ref_at,
    requiere_atencion_gtr = false
from stg_backfill_targets t
where l.id = t.lead_id
  and t.accion_backfill = 'DEVOLVER_PREVENTA';

insert into lead_etapa_resumen (
    id_lead,
    etapa,
    fecha_ingreso_etapa,
    fecha_salida_etapa,
    numero_pasadas,
    total_tipificaciones,
    total_asignaciones,
    primera_codigo_tipificacion,
    primera_codigo_subtipificacion,
    primera_tipificacion_orden,
    primera_tipificacion_at,
    ultima_codigo_tipificacion,
    ultima_codigo_subtipificacion,
    ultima_tipificacion_orden,
    ultima_tipificacion_at,
    mayor_rango_codigo_tipificacion,
    mayor_rango_codigo_subtipificacion,
    mayor_rango_orden,
    mayor_rango_at,
    id_asesor_merito,
    nombre_asesor_merito,
    fecha_merito,
    id_asesor_ultima_gestion,
    nombre_asesor_ultima_gestion,
    fecha_ultima_gestion,
    created_at,
    updated_at
)
select
    t.lead_id,
    'PREVENTA',
    coalesce(l.created_at, t.ref_at - interval '1 day'),
    t.ref_at,
    1,
    1,
    case when t.asesor_preventa_id_bigint is null and nullif(btrim(t.asesor_preventa_nombre), '') is null then 0 else 1 end,
    'PREVENTA_COMPLETA',
    'VENTA_CERRADA',
    1,
    t.ref_at,
    'PREVENTA_COMPLETA',
    'VENTA_CERRADA',
    1,
    t.ref_at,
    'PREVENTA_COMPLETA',
    'VENTA_CERRADA',
    1,
    t.ref_at,
    t.asesor_preventa_id_bigint,
    nullif(btrim(t.asesor_preventa_nombre), ''),
    t.ref_at,
    t.asesor_preventa_id_bigint,
    nullif(btrim(t.asesor_preventa_nombre), ''),
    t.ref_at,
    coalesce(l.created_at, t.ref_at),
    t.ref_at
from stg_backfill_targets t
join lead l on l.id = t.lead_id
where t.accion_backfill = 'PASAR_POSTVENTA'
on conflict (id_lead, etapa) do update set
    fecha_salida_etapa = excluded.fecha_salida_etapa,
    total_tipificaciones = greatest(lead_etapa_resumen.total_tipificaciones, excluded.total_tipificaciones),
    total_asignaciones = greatest(lead_etapa_resumen.total_asignaciones, excluded.total_asignaciones),
    ultima_codigo_tipificacion = excluded.ultima_codigo_tipificacion,
    ultima_codigo_subtipificacion = excluded.ultima_codigo_subtipificacion,
    ultima_tipificacion_orden = excluded.ultima_tipificacion_orden,
    ultima_tipificacion_at = excluded.ultima_tipificacion_at,
    mayor_rango_codigo_tipificacion = excluded.mayor_rango_codigo_tipificacion,
    mayor_rango_codigo_subtipificacion = excluded.mayor_rango_codigo_subtipificacion,
    mayor_rango_orden = excluded.mayor_rango_orden,
    mayor_rango_at = excluded.mayor_rango_at,
    id_asesor_merito = coalesce(excluded.id_asesor_merito, lead_etapa_resumen.id_asesor_merito),
    nombre_asesor_merito = coalesce(excluded.nombre_asesor_merito, lead_etapa_resumen.nombre_asesor_merito),
    fecha_merito = coalesce(excluded.fecha_merito, lead_etapa_resumen.fecha_merito),
    id_asesor_ultima_gestion = coalesce(excluded.id_asesor_ultima_gestion, lead_etapa_resumen.id_asesor_ultima_gestion),
    nombre_asesor_ultima_gestion = coalesce(excluded.nombre_asesor_ultima_gestion, lead_etapa_resumen.nombre_asesor_ultima_gestion),
    fecha_ultima_gestion = coalesce(excluded.fecha_ultima_gestion, lead_etapa_resumen.fecha_ultima_gestion),
    updated_at = excluded.updated_at;

insert into lead_etapa_resumen (
    id_lead,
    etapa,
    fecha_ingreso_etapa,
    fecha_salida_etapa,
    numero_pasadas,
    total_tipificaciones,
    total_asignaciones,
    primera_codigo_tipificacion,
    primera_codigo_subtipificacion,
    primera_tipificacion_orden,
    primera_tipificacion_at,
    ultima_codigo_tipificacion,
    ultima_codigo_subtipificacion,
    ultima_tipificacion_orden,
    ultima_tipificacion_at,
    mayor_rango_codigo_tipificacion,
    mayor_rango_codigo_subtipificacion,
    mayor_rango_orden,
    mayor_rango_at,
    id_asesor_merito,
    nombre_asesor_merito,
    fecha_merito,
    id_asesor_ultima_gestion,
    nombre_asesor_ultima_gestion,
    fecha_ultima_gestion,
    created_at,
    updated_at
)
select
    t.lead_id,
    'VENTA',
    coalesce((select pr.fecha_salida_etapa from lead_etapa_resumen pr where pr.id_lead = t.lead_id and pr.etapa = 'PREVENTA'), t.ref_at - interval '1 hour'),
    t.ref_at,
    1,
    1,
    case when t.asesor_backoffice_id_bigint is null and nullif(btrim(t.asesor_backoffice_nombre), '') is null then 0 else 1 end,
    t.tipificacion_evento,
    t.subtipificacion_evento,
    case when t.accion_backfill = 'PASAR_POSTVENTA' then 7 else 1 end,
    t.ref_at,
    t.tipificacion_evento,
    t.subtipificacion_evento,
    case when t.accion_backfill = 'PASAR_POSTVENTA' then 7 else 1 end,
    t.ref_at,
    t.tipificacion_evento,
    t.subtipificacion_evento,
    case when t.accion_backfill = 'PASAR_POSTVENTA' then 7 else 1 end,
    t.ref_at,
    t.asesor_backoffice_id_bigint,
    nullif(btrim(t.asesor_backoffice_nombre), ''),
    t.ref_at,
    t.asesor_backoffice_id_bigint,
    nullif(btrim(t.asesor_backoffice_nombre), ''),
    t.ref_at,
    t.ref_at,
    t.ref_at
from stg_backfill_targets t
where t.accion_backfill in ('PASAR_POSTVENTA', 'DEVOLVER_PREVENTA')
on conflict (id_lead, etapa) do update set
    fecha_salida_etapa = excluded.fecha_salida_etapa,
    total_tipificaciones = greatest(lead_etapa_resumen.total_tipificaciones, excluded.total_tipificaciones),
    total_asignaciones = greatest(lead_etapa_resumen.total_asignaciones, excluded.total_asignaciones),
    primera_codigo_tipificacion = coalesce(lead_etapa_resumen.primera_codigo_tipificacion, excluded.primera_codigo_tipificacion),
    primera_codigo_subtipificacion = coalesce(lead_etapa_resumen.primera_codigo_subtipificacion, excluded.primera_codigo_subtipificacion),
    primera_tipificacion_orden = coalesce(lead_etapa_resumen.primera_tipificacion_orden, excluded.primera_tipificacion_orden),
    primera_tipificacion_at = coalesce(lead_etapa_resumen.primera_tipificacion_at, excluded.primera_tipificacion_at),
    ultima_codigo_tipificacion = excluded.ultima_codigo_tipificacion,
    ultima_codigo_subtipificacion = excluded.ultima_codigo_subtipificacion,
    ultima_tipificacion_orden = excluded.ultima_tipificacion_orden,
    ultima_tipificacion_at = excluded.ultima_tipificacion_at,
    mayor_rango_codigo_tipificacion = excluded.mayor_rango_codigo_tipificacion,
    mayor_rango_codigo_subtipificacion = excluded.mayor_rango_codigo_subtipificacion,
    mayor_rango_orden = excluded.mayor_rango_orden,
    mayor_rango_at = excluded.mayor_rango_at,
    id_asesor_merito = coalesce(excluded.id_asesor_merito, lead_etapa_resumen.id_asesor_merito),
    nombre_asesor_merito = coalesce(excluded.nombre_asesor_merito, lead_etapa_resumen.nombre_asesor_merito),
    fecha_merito = coalesce(excluded.fecha_merito, lead_etapa_resumen.fecha_merito),
    id_asesor_ultima_gestion = coalesce(excluded.id_asesor_ultima_gestion, lead_etapa_resumen.id_asesor_ultima_gestion),
    nombre_asesor_ultima_gestion = coalesce(excluded.nombre_asesor_ultima_gestion, lead_etapa_resumen.nombre_asesor_ultima_gestion),
    fecha_ultima_gestion = coalesce(excluded.fecha_ultima_gestion, lead_etapa_resumen.fecha_ultima_gestion),
    updated_at = excluded.updated_at;

insert into lead_etapa_resumen (
    id_lead,
    etapa,
    fecha_ingreso_etapa,
    fecha_salida_etapa,
    numero_pasadas,
    total_tipificaciones,
    total_asignaciones,
    created_at,
    updated_at
)
select
    t.lead_id,
    'POSTVENTA',
    t.ref_at,
    null,
    1,
    0,
    0,
    t.ref_at,
    t.ref_at
from stg_backfill_targets t
where t.accion_backfill = 'PASAR_POSTVENTA'
on conflict (id_lead, etapa) do update set
    fecha_ingreso_etapa = coalesce(lead_etapa_resumen.fecha_ingreso_etapa, excluded.fecha_ingreso_etapa),
    fecha_salida_etapa = null,
    total_tipificaciones = 0,
    primera_codigo_tipificacion = null,
    primera_codigo_subtipificacion = null,
    primera_tipificacion_orden = null,
    primera_tipificacion_at = null,
    ultima_codigo_tipificacion = null,
    ultima_codigo_subtipificacion = null,
    ultima_tipificacion_orden = null,
    ultima_tipificacion_at = null,
    mayor_rango_codigo_tipificacion = null,
    mayor_rango_codigo_subtipificacion = null,
    mayor_rango_orden = null,
    mayor_rango_at = null,
    updated_at = excluded.updated_at;

insert into lead_etapa_resumen (
    id_lead,
    etapa,
    fecha_ingreso_etapa,
    fecha_salida_etapa,
    numero_pasadas,
    total_tipificaciones,
    total_asignaciones,
    created_at,
    updated_at
)
select
    t.lead_id,
    'PREVENTA',
    t.ref_at,
    null,
    2,
    0,
    0,
    t.ref_at,
    t.ref_at
from stg_backfill_targets t
where t.accion_backfill = 'DEVOLVER_PREVENTA'
on conflict (id_lead, etapa) do update set
    fecha_ingreso_etapa = excluded.fecha_ingreso_etapa,
    fecha_salida_etapa = null,
    numero_pasadas = greatest(lead_etapa_resumen.numero_pasadas, excluded.numero_pasadas),
    total_tipificaciones = 0,
    primera_codigo_tipificacion = null,
    primera_codigo_subtipificacion = null,
    primera_tipificacion_orden = null,
    primera_tipificacion_at = null,
    ultima_codigo_tipificacion = null,
    ultima_codigo_subtipificacion = null,
    ultima_tipificacion_orden = null,
    ultima_tipificacion_at = null,
    mayor_rango_codigo_tipificacion = null,
    mayor_rango_codigo_subtipificacion = null,
    mayor_rango_orden = null,
    mayor_rango_at = null,
    updated_at = excluded.updated_at;

insert into evento (
    id_lead,
    id_actor,
    nombre_actor,
    rol_actor,
    id_asesor_asignado,
    nombre_asesor_asignado,
    id_plan_ofrecido,
    accion,
    etapa,
    tipificacion,
    subtipificacion,
    fecha_instalacion,
    comentario,
    created_at
)
select
    t.lead_id,
    t.asesor_backoffice_id_bigint,
    nullif(btrim(t.asesor_backoffice_nombre), ''),
    'ASESOR_BACKOFFICE',
    null,
    null,
    t.id_plan,
    'TIPIFICACION',
    'VENTA',
    t.tipificacion_evento,
    t.subtipificacion_evento,
    case when t.accion_backfill = 'PASAR_POSTVENTA' then t.install_date else null end,
    'Backfill histórico VENTA inconsistente',
    t.ref_at
from stg_backfill_targets t
where t.accion_backfill in ('PASAR_POSTVENTA', 'DEVOLVER_PREVENTA')
  and not exists (
      select 1
      from evento e
      where e.id_lead = t.lead_id
        and e.accion = 'TIPIFICACION'
        and e.etapa = 'VENTA'
        and e.tipificacion = t.tipificacion_evento
        and e.subtipificacion = t.subtipificacion_evento
  );

\if :{?rollback_backfill}
rollback;
\echo 'Ensayo completo terminado con ROLLBACK. No quedaron cambios persistidos.'
\else
commit;
\endif

select accion_backfill, count(*) as filas_aplicadas
from stg_backfill_targets
group by accion_backfill
order by accion_backfill;
