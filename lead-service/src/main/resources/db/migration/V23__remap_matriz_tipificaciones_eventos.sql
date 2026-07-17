-- Aplica al log de eventos el mismo remapeo que V22 hizo sobre lead y lead_etapa_resumen.
--
-- V22 dejo los eventos sin tocar a proposito, asumiendo que eran historia sin impacto en la gestion.
-- Resulto falso: `evento` alimenta "Mis Preventas" del asesor, los conteos del GTR y el costo por
-- campana. Al quedar con el vocabulario viejo mientras el resto del sistema pasaba al nuevo, esas
-- vistas dejaron de ver las tipificaciones hechas desde el despliegue de V22.
--
-- Con los dos vocabularios conviviendo no habia arreglo limpio: apuntar las consultas al vocabulario
-- nuevo perdia lo historico, y aceptar ambos ensuciaba cada consulta para siempre. Unificarlos aca
-- deja un solo vocabulario y permite que las consultas referencien los codigos nuevos y nada mas.
--
-- El mapeo es el de V22 (mismas celdas, mismas decisiones) mas la familia PROG-*: son subtipificaciones
-- que solo existen en el log y que V22 no vio, porque su mapeo se construyo desde lead y
-- lead_etapa_resumen, y ahi el lead ya habia avanzado. El log tiene un dominio mas amplio.
--
-- Los eventos que ya estan en el vocabulario nuevo (los tipificados despues de V22) no se tocan solos:
-- sus celdas no coinciden con ningun origen del mapeo, asi que el UPDATE no los alcanza.

-- ---------------------------------------------------------------------------
-- 1. Mapeo celda vieja -> celda nueva, por equipo y etapa (identico a V22).
-- ---------------------------------------------------------------------------
CREATE TEMP TABLE remap_evento (
    id_equipo BIGINT NOT NULL,
    etapa     VARCHAR NOT NULL,
    tipi_old  VARCHAR NOT NULL,
    sub_old   VARCHAR,
    tipi_new  VARCHAR NOT NULL,
    sub_new   VARCHAR NOT NULL
) ON COMMIT DROP;

-- WinTeam / PREVENTA
INSERT INTO remap_evento VALUES
 (1,'PREVENTA','SIN_CONTACTO','NO_CONTESTA','SIN CONTACTO','NO CONTESTA'),
 (1,'PREVENTA','SIN_CONTACTO','BUZON_DE_VOZ','SIN CONTACTO','BUZON DE VOZ'),
 (1,'PREVENTA','SIN_CONTACTO','FUERA_DE_SERVICIO','SIN CONTACTO','FUERA DE SERVICIO'),
 (1,'PREVENTA','SIN_CONTACTO','NUMERO_EQUIVOCADO','SIN CONTACTO','NUMERO EQUIVOCADO'),
 (1,'PREVENTA','SIN_FACILIDADES','SERVICIO_ACTIVO','SERVICIO ACTIVO','SERVICIO ACTIVO'),
 (1,'PREVENTA','SIN_FACILIDADES','SIN_COBERTURA','SIN COBERTURA','SIN CTO'),
 (1,'PREVENTA','SIN_FACILIDADES','EDIFICIO_SIN_LIBERAR','SIN COBERTURA','EDIFICIO SIN LIBERAR'),
 (1,'PREVENTA','SIN_FACILIDADES','SIN_CTO','SIN COBERTURA','SIN CTO'),
 (1,'PREVENTA','RECHAZADO','NO_DESEA','NO DESEA','NO DESEA'),
 (1,'PREVENTA','RECHAZADO','CON_PROGRAMACION','NO CALIFICA','CON PROGRAMACION'),
 (1,'PREVENTA','RECHAZADO','NO_CALIFICA','NO CALIFICA','FALTA DE SCORE'),
 (1,'PREVENTA','RECHAZADO','VC_DESAPROBADA','PREVENTA','DESAPROBADA'),
 (1,'PREVENTA','RECHAZADO','ZONA_FRAUDE','NO CALIFICA','ZONA FRAUDE'),
 (1,'PREVENTA','REITERADO','ND_PUBLICIDAD','NO DESEA','NO DESEA PUBLICIDAD'),
 (1,'PREVENTA','REITERADO','DOBLE_CLICK','NO DESEA','SOLO INFORMACION'),
 (1,'PREVENTA','SCORE_PREVENTA','PREVENTA_INCOMPLETA','PREVENTA','INCOMPLETA'),
 (1,'PREVENTA','SCORE_PREVENTA','PDTE_SCORE','PREVENTA','PENDIENTE DE SCORE'),
 (1,'PREVENTA','SEGUIMIENTO','LLAMADA_INTERRUMPIDA','NO DESEA','LLAMADA INTERRUMPIDA'),
 (1,'PREVENTA','SEGUIMIENTO','SOLO_INFORMACION','NO DESEA','SOLO INFORMACION'),
 (1,'PREVENTA','SEGUIMIENTO','SEGUIMIENTO','NO DESEA','SOLO INFORMACION'),
 (1,'PREVENTA','SEGUIMIENTO','GESTION_CHAT','NO DESEA','SOLO INFORMACION'),
 (1,'PREVENTA','AGENDADO','AGENDADO','NO DESEA','AGENDADO'),
 (1,'PREVENTA','AGENDADO','CONSULTARA_CON_FAMILIAR','NO DESEA','CONSULTARA CON FAMILIAR'),
 (1,'PREVENTA','AGENDADO','FIN_DE_MES','NO DESEA','FIN DE MES'),
 (1,'PREVENTA','LISTA_NEGRA','BLACKLIST','NO CALIFICA','LISTA NEGRA'),
 (1,'PREVENTA','PREVENTA_COMPLETA','VENTA_CERRADA','PREVENTA','COMPLETA'),
 (1,'PREVENTA','PREVENTA_COMPLETA','VC_SIGUIENTE_MES','PREVENTA','PENDIENTE DE LIBERAR CLIENTE');

-- WinTeam / VENTA. La familia PROG-* solo vive en el log: PROG-<X> es la subtipificacion <X> de hoy.
INSERT INTO remap_evento VALUES
 (1,'VENTA','INSTALADO','INSTALADA','INSTALADO','SERVICIO INSTALADO'),
 (1,'VENTA','SIN SUBIR','MAL REGISTRADO','SIN INGRESAR','MAL REGISTRADO'),
 (1,'VENTA','SIN SUBIR','ANULADO','SIN INGRESAR','ANULADO'),
 (1,'VENTA','SIN SUBIR','SIN ING-SIN CTO','SIN INGRESAR','SIN ING - SIN CTO'),
 (1,'VENTA','SIN SUBIR','SIN ING-SIN COBERTURA','SIN INGRESAR','SIN ING - SIN COBERTURA'),
 (1,'VENTA','SIN SUBIR','GRABADO','SIN INGRESAR','GRABADO'),
 (1,'VENTA','SIN SUBIR','PDTE-HABILITAR SCORE','SIN INGRESAR','PDTE HABILITAR SCORE'),
 (1,'VENTA','SIN SUBIR','NO DESEA-GRABAR','SIN INGRESAR','NO DESEA GRABAR'),
 (1,'VENTA','SIN SUBIR','NO CONTESTA','SIN INGRESAR','NO CONTESTA'),
 (1,'VENTA','SIN SUBIR','DUPLICADO','SIN INGRESAR','DUPLICADO'),
 (1,'VENTA','SUBIDO','MANCHADA','INGRESADO','MANCHADA'),
 (1,'VENTA','SUBIDO','EN PROGRESO','INGRESADO','EN PROGRESO'),
 (1,'VENTA','DESAPROBADO','DESAPROBADO','SUBSANABLE','DESAPROBADO'),
 (1,'VENTA','DESAPROBADO','RESCATE','SUBSANABLE','RESCATE'),
 (1,'VENTA','PROGRAMADO','PROGRAMADA','PROGRAMADO','PROGRAMADA'),
 (1,'VENTA','PROGRAMADO','REPROGRAMADA','PROGRAMADO','REPROGRAMADA'),
 (1,'VENTA','PROGRAMADO','PROG-AGENDADA','PROGRAMADO','AGENDADO'),
 (1,'VENTA','PROGRAMADO','PROG-INICIADA','PROGRAMADO','INICIADA'),
 (1,'VENTA','PROGRAMADO','PROG-EN CAMINO','PROGRAMADO','EN CAMINO'),
 (1,'VENTA','PROGRAMADO','PROG-SIN CD','PROGRAMADO','SIN CD'),
 (1,'VENTA','PROGRAMADO','PROG-TEC EN CASA','PROGRAMADO','TECNICO EN CASA'),
 (1,'VENTA','PROGRAMADO','PROGRAMACION_CANCELADA','SUBSANABLE','PROGRAMACION CANCELADA'),
 (1,'VENTA','RECHAZADO','BAJA-NO DESEA','SUBSANABLE','BAJA - NO DESEA'),
 (1,'VENTA','RECHAZADO','BAJA-MALA INFO VENTA','SUBSANABLE','BAJA - MALA INFORMACION VENTA'),
 (1,'VENTA','RECHAZADO','POSIBLE FRAUDE','SUBSANABLE','POSIBLE FRAUDE'),
 (1,'VENTA','RECHAZADO','FLIPPING','NO RECUPERABLE','FLIPPING'),
 (1,'VENTA','RECHAZADO','CTO - SATURADO','SUBSANABLE','CTO - SATURADO'),
 (1,'VENTA','RECHAZADO','CTO - EXCEDE METRAJE','SUBSANABLE','CTO - EXCEDE METRAJE'),
 (1,'VENTA','RECHAZADO','FAC TEC-SIN POSTE DE APOYO','SUBSANABLE','FAC TEC - SIN POSTE DE APOYO'),
 (1,'VENTA','RECHAZADO','FAC TEC-SIN PERMISO VECINOS','SUBSANABLE','FAC TEC - SIN PERMISOS VECINOS'),
 (1,'VENTA','RECHAZADO','FAC TEC-TORRE NO HABILITADA','SUBSANABLE','FAC TEC - TORRE NO HABILITADA'),
 (1,'VENTA','RECHAZADO','FAC TEC-ZONA ELEVADA','SUBSANABLE','FAC TEC - ZONA ELEVADA'),
 (1,'VENTA','RECHAZADO','SIN INSTALAR','SUBSANABLE','DESAPROBADO'),
 (1,'VENTA','RECHAZADO','INGRESADA / CHANCADA','SIN INGRESAR','SIN INGRESAR / CHANCADA');

-- ClaroTeam / PREVENTA: comparte matriz destino con WinTeam.
INSERT INTO remap_evento (id_equipo, etapa, tipi_old, sub_old, tipi_new, sub_new)
SELECT 2, etapa, tipi_old, sub_old, tipi_new, sub_new FROM remap_evento WHERE id_equipo = 1 AND etapa = 'PREVENTA';

-- ClaroTeam / VENTA.
INSERT INTO remap_evento VALUES
 (2,'VENTA','INSTALADO','INSTALADA','INSTALADO','SERVICIO INSTALADO'),
 (2,'VENTA','DESAPROBADO','DESAPROBADO','NO RECUPERABLE','CANCELADA - SIN FACILIDADES CLIENTE'),
 (2,'VENTA','PROGRAMADO','PROGRAMADA','PROGRAMADO','REPROGRAMADA'),
 (2,'VENTA','PROGRAMADO','REPROGRAMADA','PROGRAMADO','REPROGRAMADA'),
 (2,'VENTA','PROGRAMADO','PROGRAMACION_CANCELADA','NO RECUPERABLE','CANCELADA - SIN FACILIDADES CLIENTE'),
 (2,'VENTA','SUBIDO','EN PROGRESO','INGRESADO','CON SOT - EN REVISION'),
 (2,'VENTA','SUBIDO','MANCHADA','SIN INGRESAR','CON SEC - NO CONTESTA'),
 (2,'VENTA','SIN SUBIR','MAL REGISTRADO','SIN INGRESAR','SEC ANULADA'),
 (2,'VENTA','SIN SUBIR','ANULADO','SIN INGRESAR','SEC ANULADA'),
 (2,'VENTA','SIN SUBIR','NO DESEA-GRABAR','SIN INGRESAR','CON SEC - NO DESEA GRABAR'),
 (2,'VENTA','SIN SUBIR','NO CONTESTA','SIN INGRESAR','CON SEC - NO CONTESTA'),
 (2,'VENTA','SIN SUBIR','DUPLICADO','NO RECUPERABLE','CON SOT - DUPLICADO'),
 (2,'VENTA','RECHAZADO','SIN INSTALAR','SUBSANABLE','CANCELADA - FACTIBILIDAD TECNICA'),
 (2,'VENTA','RECHAZADO','BAJA-NO DESEA','SUBSANABLE','CANCELADA - NO DESEA'),
 (2,'VENTA','RECHAZADO','BAJA-MALA INFO VENTA','SUBSANABLE','CANCELADA - MALA OFERTA'),
 (2,'VENTA','RECHAZADO','CTO - EXCEDE METRAJE','SUBSANABLE','CANCELADA - EXCEDE METRAJE'),
 (2,'VENTA','RECHAZADO','CTO - SATURADO','SUBSANABLE','CANCELADA - RED SATURADA'),
 (2,'VENTA','RECHAZADO','FLIPPING','NO RECUPERABLE','POSIBLE FRAUDE'),
 (2,'VENTA','RECHAZADO','FAC TEC-SIN POSTE DE APOYO','SUBSANABLE','CANCELADA - FACTIBILIDAD TECNICA'),
 (2,'VENTA','RECHAZADO','FAC TEC-TORRE NO HABILITADA','SUBSANABLE','CANCELADA - FACTIBILIDAD TECNICA'),
 (2,'VENTA','RECHAZADO','FAC TEC-ZONA ELEVADA','SUBSANABLE','CANCELADA - FACTIBILIDAD TECNICA'),
 (2,'VENTA','RECHAZADO','INGRESADA / CHANCADA','SIN INGRESAR','CHANCADA / SIN INGRESAR');

-- MiFibraTeam y PeruFibraTeam se gestionan igual que WinTeam.
INSERT INTO remap_evento (id_equipo, etapa, tipi_old, sub_old, tipi_new, sub_new)
SELECT e.id_equipo, r.etapa, r.tipi_old, r.sub_old, r.tipi_new, r.sub_new
FROM remap_evento r CROSS JOIN (VALUES (3),(4)) AS e(id_equipo)
WHERE r.id_equipo = 1;

-- ---------------------------------------------------------------------------
-- 2. Guarda previa. Una celda del log esta bien si se puede mapear (vocabulario viejo) o si ya existe
--    en la matriz actual (tipificada despues de V22). Cualquier otra cosa aborta.
-- ---------------------------------------------------------------------------
DO $$
DECLARE
    sin_mapeo TEXT;
BEGIN
    SELECT string_agg(format('equipo %s / %s / %s / %s (%s eventos)', x.id_equipo, x.etapa, x.tipi, x.sub, x.eventos), E'\n  ')
    INTO sin_mapeo
    FROM (
        SELECT l.id_equipo, e.etapa, e.tipificacion AS tipi,
               coalesce(e.subtipificacion,'(null)') AS sub, count(*) AS eventos
        FROM evento e
        JOIN lead l ON l.id = e.id_lead
        WHERE e.tipificacion IS NOT NULL
          AND NOT EXISTS (
              SELECT 1 FROM remap_evento m
              WHERE m.id_equipo = l.id_equipo AND m.etapa = e.etapa
                AND m.tipi_old = e.tipificacion AND m.sub_old IS NOT DISTINCT FROM e.subtipificacion
          )
          AND NOT EXISTS (
              SELECT 1 FROM tipificacion t
              JOIN subtipificacion s ON s.tipificacion_id = t.id
              WHERE t.id_equipo = l.id_equipo AND t.etapa = e.etapa
                AND t.codigo = e.tipificacion AND s.codigo = e.subtipificacion
          )
        GROUP BY 1,2,3,4
    ) x;
    IF sin_mapeo IS NOT NULL THEN
        RAISE EXCEPTION 'Hay eventos con tipificaciones que no se pueden mapear ni existen en la matriz nueva:%s  %s', E'\n', sin_mapeo;
    END IF;
END $$;

-- ---------------------------------------------------------------------------
-- 3. Remap del log.
-- ---------------------------------------------------------------------------
UPDATE evento e
SET tipificacion = m.tipi_new,
    subtipificacion = m.sub_new
FROM lead l, remap_evento m
WHERE l.id = e.id_lead
  AND m.id_equipo = l.id_equipo
  AND m.etapa = e.etapa
  AND m.tipi_old = e.tipificacion
  AND m.sub_old IS NOT DISTINCT FROM e.subtipificacion;

-- ---------------------------------------------------------------------------
-- 4. Guarda final: ningun evento puede quedar apuntando fuera de la matriz nueva.
-- ---------------------------------------------------------------------------
DO $$
DECLARE
    huerfanos BIGINT;
BEGIN
    SELECT count(*) INTO huerfanos
    FROM evento e
    JOIN lead l ON l.id = e.id_lead
    WHERE e.tipificacion IS NOT NULL
      AND NOT EXISTS (
          SELECT 1 FROM tipificacion t
          JOIN subtipificacion s ON s.tipificacion_id = t.id
          WHERE t.id_equipo = l.id_equipo AND t.etapa = e.etapa
            AND t.codigo = e.tipificacion AND s.codigo = e.subtipificacion
      );
    IF huerfanos > 0 THEN
        RAISE EXCEPTION 'Quedaron % eventos con una tipificacion que no existe en la matriz nueva.', huerfanos;
    END IF;
END $$;
