-- Reordena la matriz de VENTA para que los RECHAZOS queden por debajo de todo el embudo real, y
-- reconstruye el "mayor rango" (high-water mark) de cada fila VENTA de lead_etapa_resumen DESDE EL LOG
-- DE EVENTOS.
--
-- Por que. El orden viejo intercalaba los rechazos por ENCIMA de INGRESADO:
--     SIN INGRESAR 1 · INGRESADO 2 · SUBSANABLE 3 · NO RECUPERABLE 4 · PROGRAMADO 5 · INSTALADO 6
-- Como mayor_rango es un high-water mark por orden, un lead INGRESADO que luego era rechazado quedaba con
-- mayor_rango = SUBSANABLE/NO RECUPERABLE: el sistema leia el rechazo como si fuera un avance. Eso
-- contaminaba el contador de "Preventas", que no puede distinguir un lead que al menos llego a INGRESADO
-- (preventa real que se cayo despues) de uno rechazado sin haber avanzado nunca.
--
-- Orden nuevo (los dos rechazos al fondo, debajo del embudo):
--     NO RECUPERABLE 1 · SUBSANABLE 2 · SIN INGRESAR 3 · INGRESADO 4 · PROGRAMADO 5 · INSTALADO 6
-- Asi un rechazo solo puede quedar como mayor_rango cuando el lead REALMENTE nunca avanzo mas alla de el;
-- y "preventa genuina" = mayor_rango >= INGRESADO (orden 4).
--
-- Reordenar la matriz arregla el write-side hacia adelante (registrarTipificacion compara orden: con el
-- orden nuevo, un rechazo ya no pisa un INGRESADO previo). Pero NO alcanza para lo historico: el
-- mayor_rango guardado se mantuvo bajo el orden viejo y, para los leads "ingresados y luego rechazados sin
-- programar", ya sobrescribio el INGRESADO con el rechazo. Esa evidencia se perdio del resumen y NO se
-- puede recuperar desde los tres puntos guardados (primera/ultima/mayor). Si se recupera del log de
-- eventos, que tras V23 tiene la historia completa en el vocabulario nuevo: el high-water verdadero es el
-- MAX(orden) sobre todos los eventos de tipificacion de la etapa VENTA de cada lead.
--
-- La matriz de PREVENTA no se toca. Recordar que este cambio toca el catalogo de tipificaciones: al
-- desplegar hay que limpiar la cache de Redis (catalogo:tipificaciones::*) con el servicio abajo
-- (ver CLAUDE.md), o los asesores verian la matriz vieja hasta 12 h.

-- ---------------------------------------------------------------------------
-- 0. Guarda previa: la matriz de VENTA debe tener exactamente los 6 codigos conocidos. Si aparece otro,
--    abortar antes de tocar nada (preferimos fallar ruidoso a dejar un orden a medias / NULL).
-- ---------------------------------------------------------------------------
DO $$
DECLARE
    desconocidos TEXT;
BEGIN
    SELECT string_agg(DISTINCT format('equipo %s / %s', id_equipo, codigo), ', ')
    INTO desconocidos
    FROM tipificacion
    WHERE etapa = 'VENTA'
      AND codigo NOT IN ('NO RECUPERABLE','SUBSANABLE','SIN INGRESAR','INGRESADO','PROGRAMADO','INSTALADO');
    IF desconocidos IS NOT NULL THEN
        RAISE EXCEPTION 'La matriz de VENTA tiene codigos no contemplados por el reorden: %', desconocidos;
    END IF;

    -- Todo lead con ultima tipificacion de VENTA tiene que tener al menos un evento de tipificacion de
    -- VENTA (el log es la fuente para reconstruir el mayor rango). Si no lo tuviera, el rebuild dejaria un
    -- mayor_rango viejo/incoherente en silencio: mejor abortar.
    IF EXISTS (
        SELECT 1
        FROM lead_etapa_resumen r
        WHERE r.etapa = 'VENTA'
          AND r.ultima_codigo_tipificacion IS NOT NULL
          AND NOT EXISTS (
              SELECT 1 FROM evento e
              WHERE e.id_lead = r.id_lead AND e.etapa = 'VENTA' AND e.tipificacion IS NOT NULL
          )
    ) THEN
        RAISE EXCEPTION 'Hay filas VENTA con ultima tipificacion pero sin ningun evento de tipificacion de VENTA; no se puede reconstruir el mayor rango desde el log.';
    END IF;
END $$;

-- ---------------------------------------------------------------------------
-- 1. Reordenar la matriz de VENTA (los 4 equipos). Solo cambia el numero de orden; los codigos y las
--    subtipificaciones quedan igual.
-- ---------------------------------------------------------------------------
UPDATE tipificacion
SET orden = CASE codigo
    WHEN 'NO RECUPERABLE' THEN 1
    WHEN 'SUBSANABLE'     THEN 2
    WHEN 'SIN INGRESAR'   THEN 3
    WHEN 'INGRESADO'      THEN 4
    WHEN 'PROGRAMADO'     THEN 5
    WHEN 'INSTALADO'      THEN 6
END
WHERE etapa = 'VENTA';

-- ---------------------------------------------------------------------------
-- 2. Renumerar el orden de la PRIMERA y la ULTIMA tipificacion en el resumen. Los codigos no cambian
--    (siguen siendo la misma tipificacion), solo su numero de orden segun la matriz nueva. El equipo se
--    resuelve joineando lead (no esta denormalizado en el resumen).
-- ---------------------------------------------------------------------------
UPDATE lead_etapa_resumen r
SET primera_tipificacion_orden = t.orden
FROM lead l, tipificacion t
WHERE l.id = r.id_lead
  AND r.etapa = 'VENTA'
  AND r.primera_codigo_tipificacion IS NOT NULL
  AND t.id_equipo = l.id_equipo AND t.etapa = 'VENTA' AND t.codigo = r.primera_codigo_tipificacion;

UPDATE lead_etapa_resumen r
SET ultima_tipificacion_orden = t.orden
FROM lead l, tipificacion t
WHERE l.id = r.id_lead
  AND r.etapa = 'VENTA'
  AND r.ultima_codigo_tipificacion IS NOT NULL
  AND t.id_equipo = l.id_equipo AND t.etapa = 'VENTA' AND t.codigo = r.ultima_codigo_tipificacion;

-- ---------------------------------------------------------------------------
-- 3. Reconstruir el MAYOR RANGO desde el log de eventos. Para cada fila VENTA, el high-water verdadero es
--    el evento de tipificacion de VENTA con mayor orden (empate: el mas antiguo, que es cuando se alcanzo
--    ese rango por primera vez). Esto recupera el INGRESADO que el orden viejo habia sobrescrito con un
--    rechazo.
-- ---------------------------------------------------------------------------
WITH high_water AS (
    SELECT r.id AS resumen_id,
           e.tipificacion,
           e.subtipificacion,
           t.orden,
           e.created_at,
           ROW_NUMBER() OVER (
               PARTITION BY r.id
               ORDER BY t.orden DESC, e.created_at ASC
           ) AS rn
    FROM lead_etapa_resumen r
    JOIN lead l ON l.id = r.id_lead
    JOIN evento e ON e.id_lead = r.id_lead AND e.etapa = 'VENTA' AND e.tipificacion IS NOT NULL
    JOIN tipificacion t ON t.id_equipo = l.id_equipo AND t.etapa = 'VENTA' AND t.codigo = e.tipificacion
    WHERE r.etapa = 'VENTA'
)
UPDATE lead_etapa_resumen r
SET mayor_rango_codigo_tipificacion = hw.tipificacion,
    mayor_rango_codigo_subtipificacion = hw.subtipificacion,
    mayor_rango_orden = hw.orden,
    mayor_rango_at = hw.created_at
FROM high_water hw
WHERE hw.resumen_id = r.id AND hw.rn = 1;

-- ---------------------------------------------------------------------------
-- 4. Guarda final: el mayor rango tiene que respetar su invariante y ser coherente con la ultima.
-- ---------------------------------------------------------------------------
DO $$
DECLARE
    rotos BIGINT;
BEGIN
    -- mayor_rango >= max(primera, ultima) por definicion del high-water.
    SELECT count(*) INTO rotos
    FROM lead_etapa_resumen r
    WHERE r.etapa = 'VENTA'
      AND r.mayor_rango_orden IS NOT NULL
      AND r.mayor_rango_orden < GREATEST(
          coalesce(r.primera_tipificacion_orden, 0),
          coalesce(r.ultima_tipificacion_orden, 0));
    IF rotos > 0 THEN
        RAISE EXCEPTION 'Quedaron % filas VENTA con mayor_rango por debajo de su primera/ultima tipificacion.', rotos;
    END IF;

    -- Toda fila con ultima tipificacion tiene que haber quedado con mayor rango (se reconstruyo del log).
    SELECT count(*) INTO rotos
    FROM lead_etapa_resumen r
    WHERE r.etapa = 'VENTA'
      AND r.ultima_codigo_tipificacion IS NOT NULL
      AND r.mayor_rango_codigo_tipificacion IS NULL;
    IF rotos > 0 THEN
        RAISE EXCEPTION 'Quedaron % filas VENTA con ultima tipificacion pero sin mayor rango tras el rebuild.', rotos;
    END IF;
END $$;
