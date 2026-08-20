-- Correccion manual: intercambiar la identidad telefonica/usermeta entre
-- William192491 y jeffersoncz10.
--
-- Estado observado en local el 2026-08-20:
-- - William192491 quedo asociado por error al lead +51 982479266.
-- - Ese mismo lead tiene numero_para_llamar = 983691088.
-- - jeffersoncz10 existe en un contacto/lead separado, pero sin telefono.
--
-- Resultado esperado:
-- - William192491 => +51 983691088
-- - jeffersoncz10 => +51 982479266
--
-- Importante:
-- - Este script corrige contacto y lead para mantener congruencia.
-- - lead_etapa_resumen y evento no guardan telefono/usermeta, por eso no requieren update.
-- - Si en produccion el usermeta correcto fuera William19249 (sin el 1 final),
--   ajusta solo la constante v_usermeta_william antes de ejecutar.

BEGIN;

DO $$
DECLARE
    v_prefijo CONSTANT text := '+51';
    v_usermeta_william CONSTANT text := 'William192491';
    v_usermeta_jefferson CONSTANT text := 'jeffersoncz10';
    v_lead_william CONSTANT text := '983691088';
    v_lead_jefferson CONSTANT text := '982479266';

    v_contacto_jefferson_actual bigint;
    v_contacto_william_actual bigint;
    v_lead_jefferson_actual bigint;
    v_lead_william_actual bigint;
    v_tmp_usermeta text := format('__tmp_swap_%s__', floor(extract(epoch from clock_timestamp()) * 1000)::bigint);
BEGIN
    SELECT c.id
      INTO v_contacto_jefferson_actual
      FROM contacto c
     WHERE c.prefijo = v_prefijo
       AND c.lead = v_lead_jefferson
       AND lower(c.usermeta) = lower(v_usermeta_william);

    IF v_contacto_jefferson_actual IS NULL THEN
        RAISE EXCEPTION 'No se encontro el contacto erroneo de William con telefono % %', v_prefijo, v_lead_jefferson;
    END IF;

    SELECT l.id
      INTO v_lead_jefferson_actual
      FROM lead l
     WHERE l.id_contacto = v_contacto_jefferson_actual
       AND l.prefijo = v_prefijo
       AND l.lead = v_lead_jefferson
       AND lower(l.usermeta) = lower(v_usermeta_william)
       AND l.numero_para_llamar = v_lead_william;

    IF v_lead_jefferson_actual IS NULL THEN
        RAISE EXCEPTION 'No se encontro el lead erroneo con usermeta % y telefono %', v_usermeta_william, v_lead_jefferson;
    END IF;

    SELECT c.id
      INTO v_contacto_william_actual
      FROM contacto c
     WHERE lower(c.usermeta) = lower(v_usermeta_jefferson)
       AND (c.prefijo IS NULL OR c.prefijo = '')
       AND (c.lead IS NULL OR c.lead = '');

    IF v_contacto_william_actual IS NULL THEN
        RAISE EXCEPTION 'No se encontro el contacto actual de jeffersoncz10 sin telefono para convertirlo en William';
    END IF;

    SELECT l.id
      INTO v_lead_william_actual
      FROM lead l
     WHERE l.id_contacto = v_contacto_william_actual
       AND lower(l.usermeta) = lower(v_usermeta_jefferson)
       AND (l.prefijo IS NULL OR l.prefijo = '')
       AND (l.lead IS NULL OR l.lead = '')
       AND (l.numero_para_llamar IS NULL OR l.numero_para_llamar = '');

    IF v_lead_william_actual IS NULL THEN
        RAISE EXCEPTION 'No se encontro el lead actual de jeffersoncz10 sin telefono para convertirlo en William';
    END IF;

    IF EXISTS (
        SELECT 1
          FROM contacto c
         WHERE c.prefijo = v_prefijo
           AND c.lead = v_lead_william
           AND c.id <> v_contacto_william_actual
    ) THEN
        RAISE EXCEPTION 'Ya existe otro contacto con el telefono destino de William % %', v_prefijo, v_lead_william;
    END IF;

    IF EXISTS (
        SELECT 1
          FROM lead l
         WHERE l.prefijo = v_prefijo
           AND l.lead = v_lead_william
           AND l.id <> v_lead_william_actual
    ) THEN
        RAISE EXCEPTION 'Ya existe otro lead con el telefono destino de William % %', v_prefijo, v_lead_william;
    END IF;

    UPDATE contacto
       SET usermeta = v_tmp_usermeta,
           updated_at = now()
     WHERE id = v_contacto_william_actual;

    UPDATE contacto
       SET usermeta = v_usermeta_jefferson,
           updated_at = now()
     WHERE id = v_contacto_jefferson_actual;

    UPDATE contacto
       SET prefijo = v_prefijo,
           lead = v_lead_william,
           usermeta = v_usermeta_william,
           updated_at = now()
     WHERE id = v_contacto_william_actual;

    UPDATE lead
       SET prefijo = v_prefijo,
           lead = v_lead_jefferson,
           numero_para_llamar = v_lead_jefferson,
           usermeta = v_usermeta_jefferson,
           updated_at = now()
     WHERE id_contacto = v_contacto_jefferson_actual;

    UPDATE lead
       SET prefijo = v_prefijo,
           lead = v_lead_william,
           numero_para_llamar = v_lead_william,
           usermeta = v_usermeta_william,
           updated_at = now()
     WHERE id_contacto = v_contacto_william_actual;

    RAISE NOTICE 'Correccion completada. contacto jefferson %, contacto william %, lead jefferson %, lead william %',
        v_contacto_jefferson_actual, v_contacto_william_actual, v_lead_jefferson_actual, v_lead_william_actual;
END $$;

SELECT
    c.id AS contacto_id,
    c.prefijo AS contacto_prefijo,
    c.lead AS contacto_lead,
    c.usermeta AS contacto_usermeta,
    l.id AS lead_id,
    l.prefijo AS lead_prefijo,
    l.lead AS lead_numero,
    l.numero_para_llamar,
    l.usermeta AS lead_usermeta,
    l.id_contacto,
    l.etapa,
    l.estado,
    l.id_campana,
    l.created_at,
    l.updated_at
FROM contacto c
JOIN lead l
  ON l.id_contacto = c.id
WHERE lower(c.usermeta) IN (lower('William192491'), lower('jeffersoncz10'))
   OR lower(l.usermeta) IN (lower('William192491'), lower('jeffersoncz10'))
   OR c.lead IN ('983691088', '982479266')
   OR l.lead IN ('983691088', '982479266')
   OR l.numero_para_llamar IN ('983691088', '982479266')
ORDER BY c.id, l.id;

COMMIT;
