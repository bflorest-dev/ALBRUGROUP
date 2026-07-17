-- Reemplaza la matriz de tipificaciones de PREVENTA y VENTA por la definitiva y remapea todo lo ya
-- tipificado a su equivalente en ella.
--
-- Contexto: la matriz vieja se disenio antes de la particion por equipo. La nueva se consolido en una
-- copia local y se sube aqui (no se carga a mano por el admin). Hay dos variantes:
--   * WinTeam  -> equipos 1 (WinTeam), 3 (MiFibraTeam) y 4 (PeruFibraTeam), que la reciben clonada.
--   * ClaroTeam -> equipo 2. Comparte PREVENTA con WinTeam (identica) y difiere en VENTA, donde sus
--     subtipificaciones giran alrededor de SEC/SOT.
--
-- El orden importa: el remap de los datos es texto->texto y no depende de la matriz, asi que corre
-- ANTES de tocarla. Recien despues se puede borrar la vieja (los codigos PROGRAMADO e INSTALADO
-- existen en ambas matrices y chocarian contra el unique (etapa, id_equipo, codigo)) e insertar la
-- nueva. Los ids nunca se escriben a mano: se resuelven por clave natural, porque en produccion la
-- secuencia IDENTITY asigna otros.
--
-- Los eventos NO se remapean a proposito: son un log historico append-only que no alimenta la gestion
-- diaria ni la reporteria (esa sale de lead_etapa_resumen).

-- ---------------------------------------------------------------------------
-- 1. Mapeo celda vieja -> celda nueva, por equipo y etapa.
--    La celda es (tipificacion, subtipificacion): un mismo codigo de subtipificacion significa cosas
--    distintas segun su tipificacion, asi que el par viaja junto.
-- ---------------------------------------------------------------------------
CREATE TEMP TABLE remap (
    id_equipo BIGINT NOT NULL,
    etapa     VARCHAR NOT NULL,
    tipi_old  VARCHAR NOT NULL,
    sub_old   VARCHAR,
    tipi_new  VARCHAR NOT NULL,
    sub_new   VARCHAR NOT NULL
) ON COMMIT DROP;

-- WinTeam / PREVENTA
INSERT INTO remap VALUES
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

-- WinTeam / VENTA
INSERT INTO remap VALUES
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
INSERT INTO remap (id_equipo, etapa, tipi_old, sub_old, tipi_new, sub_new)
SELECT 2, etapa, tipi_old, sub_old, tipi_new, sub_new FROM remap WHERE id_equipo = 1 AND etapa = 'PREVENTA';

-- ClaroTeam / VENTA: su matriz nueva gira alrededor de SEC/SOT, asi que los codigos genericos viejos
-- caen en las subtipificaciones equivalentes de ese vocabulario.
INSERT INTO remap VALUES
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

-- MiFibraTeam y PeruFibraTeam: se gestionan igual que WinTeam.
INSERT INTO remap (id_equipo, etapa, tipi_old, sub_old, tipi_new, sub_new)
SELECT e.id_equipo, r.etapa, r.tipi_old, r.sub_old, r.tipi_new, r.sub_new
FROM remap r CROSS JOIN (VALUES (3),(4)) AS e(id_equipo)
WHERE r.id_equipo = 1;

-- ---------------------------------------------------------------------------
-- 2. Guardas previas. Prefieren abortar a dejar datos huerfanos en silencio:
--    produccion sigue tipificando con la matriz vieja hasta el despliegue, asi que puede aparecer
--    una celda que no existia cuando se armo el mapeo.
-- ---------------------------------------------------------------------------
DO $$
DECLARE
    equipo_extra TEXT;
    sin_mapeo    TEXT;
BEGIN
    SELECT string_agg(DISTINCT id_equipo::text, ', ') INTO equipo_extra
    FROM tipificacion WHERE id_equipo NOT IN (1,2,3,4);
    IF equipo_extra IS NOT NULL THEN
        RAISE EXCEPTION 'Hay matriz para equipos no contemplados (%). Esta migracion solo define WinTeam(1), ClaroTeam(2), MiFibraTeam(3) y PeruFibraTeam(4).', equipo_extra;
    END IF;

    WITH origen AS (
        SELECT l.id_equipo, l.etapa AS etapa, l.codigo_tipificacion AS tipi, l.codigo_subtipificacion AS sub
          FROM lead l WHERE l.codigo_tipificacion IS NOT NULL
        UNION
        SELECT l.id_equipo, r.etapa, r.primera_codigo_tipificacion, r.primera_codigo_subtipificacion
          FROM lead_etapa_resumen r JOIN lead l ON l.id = r.id_lead WHERE r.primera_codigo_tipificacion IS NOT NULL
        UNION
        SELECT l.id_equipo, r.etapa, r.ultima_codigo_tipificacion, r.ultima_codigo_subtipificacion
          FROM lead_etapa_resumen r JOIN lead l ON l.id = r.id_lead WHERE r.ultima_codigo_tipificacion IS NOT NULL
        UNION
        SELECT l.id_equipo, r.etapa, r.mayor_rango_codigo_tipificacion, r.mayor_rango_codigo_subtipificacion
          FROM lead_etapa_resumen r JOIN lead l ON l.id = r.id_lead WHERE r.mayor_rango_codigo_tipificacion IS NOT NULL
    )
    SELECT string_agg(format('equipo %s / %s / %s / %s', o.id_equipo, o.etapa, o.tipi, coalesce(o.sub,'(null)')), E'\n  ') INTO sin_mapeo
    FROM origen o
    WHERE NOT EXISTS (
        SELECT 1 FROM remap m
        WHERE m.id_equipo = o.id_equipo AND m.etapa = o.etapa
          AND m.tipi_old = o.tipi AND m.sub_old IS NOT DISTINCT FROM o.sub
    );
    IF sin_mapeo IS NOT NULL THEN
        RAISE EXCEPTION 'Hay tipificaciones sin equivalente en la matriz nueva:%s  %s', E'\n', sin_mapeo;
    END IF;
END $$;

-- ---------------------------------------------------------------------------
-- 3. Remap de los datos. Va antes de tocar la matriz: es texto->texto y no la necesita.
-- ---------------------------------------------------------------------------
UPDATE lead l
SET codigo_tipificacion = m.tipi_new,
    codigo_subtipificacion = m.sub_new
FROM remap m
WHERE m.id_equipo = l.id_equipo
  AND m.etapa = l.etapa
  AND m.tipi_old = l.codigo_tipificacion
  AND m.sub_old IS NOT DISTINCT FROM l.codigo_subtipificacion;

-- lead_etapa_resumen guarda tres puntos historicos por etapa; cada uno se remapea por separado.
-- El equipo no esta denormalizado aqui, se resuelve joineando lead.
UPDATE lead_etapa_resumen r
SET primera_codigo_tipificacion = m.tipi_new,
    primera_codigo_subtipificacion = m.sub_new
FROM lead l, remap m
WHERE l.id = r.id_lead
  AND m.id_equipo = l.id_equipo
  AND m.etapa = r.etapa
  AND m.tipi_old = r.primera_codigo_tipificacion
  AND m.sub_old IS NOT DISTINCT FROM r.primera_codigo_subtipificacion;

UPDATE lead_etapa_resumen r
SET ultima_codigo_tipificacion = m.tipi_new,
    ultima_codigo_subtipificacion = m.sub_new
FROM lead l, remap m
WHERE l.id = r.id_lead
  AND m.id_equipo = l.id_equipo
  AND m.etapa = r.etapa
  AND m.tipi_old = r.ultima_codigo_tipificacion
  AND m.sub_old IS NOT DISTINCT FROM r.ultima_codigo_subtipificacion;

UPDATE lead_etapa_resumen r
SET mayor_rango_codigo_tipificacion = m.tipi_new,
    mayor_rango_codigo_subtipificacion = m.sub_new
FROM lead l, remap m
WHERE l.id = r.id_lead
  AND m.id_equipo = l.id_equipo
  AND m.etapa = r.etapa
  AND m.tipi_old = r.mayor_rango_codigo_tipificacion
  AND m.sub_old IS NOT DISTINCT FROM r.mayor_rango_codigo_subtipificacion;

-- ---------------------------------------------------------------------------
-- 4. Fuera la matriz vieja. Nada la referencia por FK salvo sus propias hijas, y tras el remap
--    ningun lead apunta ya a sus codigos.
-- ---------------------------------------------------------------------------
DELETE FROM subtipificacion_comportamiento
WHERE subtipificacion_id IN (
    SELECT s.id FROM subtipificacion s
    JOIN tipificacion t ON t.id = s.tipificacion_id
    WHERE t.etapa IN ('PREVENTA','VENTA')
);
DELETE FROM subtipificacion
WHERE tipificacion_id IN (SELECT id FROM tipificacion WHERE etapa IN ('PREVENTA','VENTA'));
DELETE FROM tipificacion WHERE etapa IN ('PREVENTA','VENTA');

-- ---------------------------------------------------------------------------
-- 5. Matriz nueva. PREVENTA es identica en ambas variantes; VENTA no.
-- ---------------------------------------------------------------------------
INSERT INTO tipificacion (id_equipo, etapa, codigo, descripcion, orden, activo) VALUES
 (1,'PREVENTA','SIN CONTACTO','No se logra la comunicacion',1,true),
 (1,'PREVENTA','NO CALIFICA','NO CALIFICA',2,true),
 (1,'PREVENTA','SIN COBERTURA','SIN COBERTURA',3,true),
 (1,'PREVENTA','SERVICIO ACTIVO','SERVICIO ACTIVO',4,true),
 (1,'PREVENTA','NO DESEA','NO DESEA',5,true),
 (1,'PREVENTA','PREVENTA','Gestion de preventa finalizada',6,true),
 (1,'VENTA','SIN INGRESAR','SIN INGRESAR',1,true),
 (1,'VENTA','INGRESADO','INGRESADO',2,true),
 (1,'VENTA','SUBSANABLE','SUBSANABLE',3,true),
 (1,'VENTA','NO RECUPERABLE','NO RECUPERABLE',4,true),
 (1,'VENTA','PROGRAMADO','PROGRAMADO',5,true),
 (1,'VENTA','INSTALADO','INSTALADO',6,true),
 (2,'PREVENTA','SIN CONTACTO','No se logra la comunicacion',1,true),
 (2,'PREVENTA','NO CALIFICA','NO CALIFICA',2,true),
 (2,'PREVENTA','SIN COBERTURA','SIN COBERTURA',3,true),
 (2,'PREVENTA','SERVICIO ACTIVO','SERVICIO ACTIVO',4,true),
 (2,'PREVENTA','NO DESEA','NO DESEA',5,true),
 (2,'PREVENTA','PREVENTA','Gestion de preventa finalizada',6,true),
 (2,'VENTA','SIN INGRESAR','SIN INGRESAR',1,true),
 (2,'VENTA','INGRESADO','INGRESADO',2,true),
 (2,'VENTA','SUBSANABLE','SUBSANABLE',3,true),
 (2,'VENTA','NO RECUPERABLE','NO RECUPERABLE',4,true),
 (2,'VENTA','PROGRAMADO','PROGRAMADO',5,true),
 (2,'VENTA','INSTALADO','INSTALADO',6,true);

INSERT INTO subtipificacion (tipificacion_id, codigo, descripcion, orden, etapa_cambio, estado_postventa_cambio, activo)
SELECT t.id, v.sub, v.sub_desc, v.sub_orden, v.etapa_cambio, v.epc, true
FROM (VALUES
 (1,'PREVENTA','SIN CONTACTO','NO CONTESTA','No responde llamadas o chat',1,'PREVENTA',NULL),
 (1,'PREVENTA','SIN CONTACTO','NUMERO EQUIVOCADO','Numero invalido o incorrecto',2,'PREVENTA',NULL),
 (1,'PREVENTA','SIN CONTACTO','FUERA DE SERVICIO','Numero sin servicio de red',3,'PREVENTA',NULL),
 (1,'PREVENTA','SIN CONTACTO','BUZON DE VOZ','Numero desvia llamadas al buzon de voz',4,'PREVENTA',NULL),
 (1,'PREVENTA','NO CALIFICA','FALTA DE SCORE','FALTA DE SCORE',1,'PREVENTA',NULL),
 (1,'PREVENTA','NO CALIFICA','ZONA FRAUDE','ZONA FRAUDE',2,'PREVENTA',NULL),
 (1,'PREVENTA','NO CALIFICA','CON PROGRAMACION','CON PROGRAMACION',3,'PREVENTA',NULL),
 (1,'PREVENTA','NO CALIFICA','LISTA NEGRA','LISTA NEGRA',4,'PREVENTA',NULL),
 (1,'PREVENTA','SIN COBERTURA','SIN CTO','SIN CTO',1,'PREVENTA',NULL),
 (1,'PREVENTA','SIN COBERTURA','EDIFICIO SIN LIBERAR','EDIFICIO SIN LIBERAR',2,'PREVENTA',NULL),
 (1,'PREVENTA','SERVICIO ACTIVO','SERVICIO ACTIVO','SERVICIO ACTIVO',1,'PREVENTA',NULL),
 (1,'PREVENTA','NO DESEA','NO DESEA PUBLICIDAD','NO DESEA PUBLICIDAD',1,'PREVENTA',NULL),
 (1,'PREVENTA','NO DESEA','FIN DE MES','FIN DE MES - requiere fecha',2,'PREVENTA',NULL),
 (1,'PREVENTA','NO DESEA','CONSULTARA CON FAMILIAR','CONSULTARA CON FAMILIAR',3,'PREVENTA',NULL),
 (1,'PREVENTA','NO DESEA','AGENDADO','AGENDADO',4,'PREVENTA',NULL),
 (1,'PREVENTA','NO DESEA','SOLO INFORMACION','SOLO INFORMACION',5,'PREVENTA',NULL),
 (1,'PREVENTA','NO DESEA','LLAMADA INTERRUMPIDA','LLAMADA INTERRUMPIDA',6,'PREVENTA',NULL),
 (1,'PREVENTA','NO DESEA','NO DESEA','NO DESEA',7,'PREVENTA',NULL),
 (1,'PREVENTA','PREVENTA','COMPLETA','Venta cerrada en la gestion actual',1,'VENTA',NULL),
 (1,'PREVENTA','PREVENTA','INCOMPLETA','Venta pendiente de informacion para completarse',2,'PREVENTA',NULL),
 (1,'PREVENTA','PREVENTA','DESAPROBADA','DESAPROBADA',3,'PREVENTA',NULL),
 (1,'PREVENTA','PREVENTA','PENDIENTE DE SCORE','PENDIENTE DE SCORE',4,'VENTA',NULL),
 (1,'PREVENTA','PREVENTA','PENDIENTE DE HABILITAR EDIFICIO','PENDIENTE DE HABILITAR EDIFICIO',5,'VENTA',NULL),
 (1,'PREVENTA','PREVENTA','PENDIENTE DE LIBERAR CLIENTE','PENDIENTE DE LIBERAR CLIENTE',6,'VENTA',NULL),
 (1,'VENTA','SIN INGRESAR','ANULADO','ANULADO',1,'VENTA',NULL),
 (1,'VENTA','SIN INGRESAR','SIN INGRESAR / CHANCADA','SIN INGRESAR / CHANCADA',2,'VENTA',NULL),
 (1,'VENTA','SIN INGRESAR','DUPLICADO','DUPLICADO',3,'VENTA',NULL),
 (1,'VENTA','SIN INGRESAR','GRABADO','GRABADO',4,'VENTA',NULL),
 (1,'VENTA','SIN INGRESAR','MAL REGISTRADO','MAL REGISTRADO',5,'VENTA',NULL),
 (1,'VENTA','SIN INGRESAR','NO CONTESTA','NO CONTESTA',6,'VENTA',NULL),
 (1,'VENTA','SIN INGRESAR','NO DESEA DAR DNI','NO DESEA DAR DNI',7,'VENTA',NULL),
 (1,'VENTA','SIN INGRESAR','NO DESEA GRABAR','NO DESEA GRABAR',8,'VENTA',NULL),
 (1,'VENTA','SIN INGRESAR','PDTE HABILITAR CONDOMINIO','PDTE-HABILITAR CONDOMINIO',9,'VENTA',NULL),
 (1,'VENTA','SIN INGRESAR','PDTE HABILITAR SCORE','PDTE-HABILITAR SCORE',10,'VENTA',NULL),
 (1,'VENTA','SIN INGRESAR','PDTE PAGO ADELANTADO','PDTE-PAGO ADELANTADO',11,'VENTA',NULL),
 (1,'VENTA','SIN INGRESAR','SIN ING - EDIFICIO EXCLUSIVIDAD','SIN ING-EDIFICIO EXCLUSIVIDAD',12,'VENTA',NULL),
 (1,'VENTA','SIN INGRESAR','SIN ING - SIN COBERTURA','SIN ING-SIN COBERTURA',13,'VENTA',NULL),
 (1,'VENTA','SIN INGRESAR','SIN ING - SIN CTO','SIN ING-SIN CTO',14,'VENTA',NULL),
 (1,'VENTA','INGRESADO','EN PROGRESO','EN PROGRESO',1,'VENTA',NULL),
 (1,'VENTA','INGRESADO','MANCHADA','MANCHADA',2,'VENTA',NULL),
 (1,'VENTA','SUBSANABLE','DESAPROBADO','DESAPROBADO',1,'VENTA',NULL),
 (1,'VENTA','SUBSANABLE','RESCATE','RESCATE',2,'VENTA',NULL),
 (1,'VENTA','SUBSANABLE','PROGRAMACION CANCELADA','PROGRAMACION CANCELADA',3,'VENTA',NULL),
 (1,'VENTA','SUBSANABLE','BAJA - MALA INFORMACION VENTA','BAJA - MALA INFORMACION VENTA',4,'VENTA',NULL),
 (1,'VENTA','SUBSANABLE','FAC TEC - TORRE NO HABILITADA','FAC TEC - TORRE NO HABILITADA',5,'VENTA',NULL),
 (1,'VENTA','SUBSANABLE','BAJA - NO DESEA','BAJA - NO DESEA',6,'VENTA',NULL),
 (1,'VENTA','SUBSANABLE','CTO - ROBADO','CTO - ROBADO',7,'VENTA',NULL),
 (1,'VENTA','SUBSANABLE','CTO - SATURADO','CTO - SATURADO',8,'VENTA',NULL),
 (1,'VENTA','SUBSANABLE','CTO - SIN POTENCIA','CTO - SIN POTENCIA',9,'VENTA',NULL),
 (1,'VENTA','SUBSANABLE','FAC TEC - DUCTOS OBSTRUIDOS','FAC TEC - DUCTOS OBSTRUIDOS',10,'VENTA',NULL),
 (1,'VENTA','SUBSANABLE','FAC TEC - SIN PERMISOS VECINOS','FAC TEC - SIN PERMISOS VECINOS',11,'VENTA',NULL),
 (1,'VENTA','SUBSANABLE','FAC TEC - SIN POSTE DE APOYO','FAC TEC - SIN POSTE DE APOYO',12,'VENTA',NULL),
 (1,'VENTA','SUBSANABLE','FAC TEC - ZONA ELEVADA','FAC TEC - ZONA ELEVADA',13,'VENTA',NULL),
 (1,'VENTA','SUBSANABLE','CHANCADA / PROGRAMADA','CHANCADA / PROGRAMADA',14,'VENTA',NULL),
 (1,'VENTA','SUBSANABLE','POSIBLE FRAUDE','POSIBLE FRAUDE',15,'VENTA',NULL),
 (1,'VENTA','SUBSANABLE','ZONA PELIGROSA','ZONA PELIGROSA',16,'VENTA',NULL),
 (1,'VENTA','SUBSANABLE','CTO - EXCEDE METRAJE','CTO - EXCEDE METRAJE',17,'VENTA',NULL),
 (1,'VENTA','SUBSANABLE','BAJA - MULTIPLES DEUDAS','BAJA - MULTIPLES DEUDAS',18,'VENTA',NULL),
 (1,'VENTA','NO RECUPERABLE','BAJA NO RECUPERABLE','BAJA NO RECUPERABLE',1,'PREVENTA',NULL),
 (1,'VENTA','NO RECUPERABLE','FACTIBILIDAD TECNICA','FACTIBILIDAD TECNICA',2,'PREVENTA',NULL),
 (1,'VENTA','NO RECUPERABLE','FACILIDADES CLIENTE','FACILIDADES CLIENTE',3,'PREVENTA',NULL),
 (1,'VENTA','NO RECUPERABLE','FLIPPING','FLIPPING',4,'PREVENTA',NULL),
 (1,'VENTA','NO RECUPERABLE','CHANCADA / INSTALADA','CHANCADA / INSTALADA',5,'PREVENTA',NULL),
 (1,'VENTA','NO RECUPERABLE','BLACKLIST OPERADOR','BLACKLIST OPERADOR',6,'PREVENTA',NULL),
 (1,'VENTA','NO RECUPERABLE','BLACKLIST ESTAFADOR','BLACKLIST ESTAFADOR',7,'PREVENTA',NULL),
 (1,'VENTA','PROGRAMADO','AGENDADO','PROG-AGENDADA',1,'VENTA',NULL),
 (1,'VENTA','PROGRAMADO','EN CAMINO','PROG-EN CAMINO',2,'VENTA',NULL),
 (1,'VENTA','PROGRAMADO','INICIADA','PROG-INICIADA',3,'VENTA',NULL),
 (1,'VENTA','PROGRAMADO','SIN CD','PROG-SIN CD',4,'VENTA',NULL),
 (1,'VENTA','PROGRAMADO','TECNICO EN CASA','PROG-TEC EN CASA',5,'VENTA',NULL),
 (1,'VENTA','PROGRAMADO','PROGRAMADA','PROGRAMADA',6,'VENTA',NULL),
 (1,'VENTA','PROGRAMADO','REPROGRAMADA','REPROGRAMADA',7,'VENTA',NULL),
 (1,'VENTA','INSTALADO','SERVICIO INSTALADO','SERVICIO INSTALADO',1,'POSTVENTA','EN_SEGUIMIENTO'),
 (2,'PREVENTA','SIN CONTACTO','NO CONTESTA','No responde llamadas o chat',1,'PREVENTA',NULL),
 (2,'PREVENTA','SIN CONTACTO','NUMERO EQUIVOCADO','Numero invalido o incorrecto',2,'PREVENTA',NULL),
 (2,'PREVENTA','SIN CONTACTO','FUERA DE SERVICIO','Numero sin servicio de red',3,'PREVENTA',NULL),
 (2,'PREVENTA','SIN CONTACTO','BUZON DE VOZ','Numero desvia llamadas al buzon de voz',4,'PREVENTA',NULL),
 (2,'PREVENTA','NO CALIFICA','FALTA DE SCORE','FALTA DE SCORE',1,'PREVENTA',NULL),
 (2,'PREVENTA','NO CALIFICA','ZONA FRAUDE','ZONA FRAUDE',2,'PREVENTA',NULL),
 (2,'PREVENTA','NO CALIFICA','CON PROGRAMACION','CON PROGRAMACION',3,'PREVENTA',NULL),
 (2,'PREVENTA','NO CALIFICA','LISTA NEGRA','LISTA NEGRA',4,'PREVENTA',NULL),
 (2,'PREVENTA','SIN COBERTURA','SIN CTO','SIN CTO',1,'PREVENTA',NULL),
 (2,'PREVENTA','SIN COBERTURA','EDIFICIO SIN LIBERAR','EDIFICIO SIN LIBERAR',2,'PREVENTA',NULL),
 (2,'PREVENTA','SERVICIO ACTIVO','SERVICIO ACTIVO','SERVICIO ACTIVO',1,'PREVENTA',NULL),
 (2,'PREVENTA','NO DESEA','NO DESEA PUBLICIDAD','NO DESEA PUBLICIDAD',1,'PREVENTA',NULL),
 (2,'PREVENTA','NO DESEA','FIN DE MES','FIN DE MES - requiere fecha',2,'PREVENTA',NULL),
 (2,'PREVENTA','NO DESEA','CONSULTARA CON FAMILIAR','CONSULTARA CON FAMILIAR',3,'PREVENTA',NULL),
 (2,'PREVENTA','NO DESEA','AGENDADO','AGENDADO',4,'PREVENTA',NULL),
 (2,'PREVENTA','NO DESEA','SOLO INFORMACION','SOLO INFORMACION',5,'PREVENTA',NULL),
 (2,'PREVENTA','NO DESEA','LLAMADA INTERRUMPIDA','LLAMADA INTERRUMPIDA',6,'PREVENTA',NULL),
 (2,'PREVENTA','NO DESEA','NO DESEA','NO DESEA',7,'PREVENTA',NULL),
 (2,'PREVENTA','PREVENTA','COMPLETA','Venta cerrada en la gestion actual',1,'VENTA',NULL),
 (2,'PREVENTA','PREVENTA','INCOMPLETA','Venta pendiente de informacion para completarse',2,'PREVENTA',NULL),
 (2,'PREVENTA','PREVENTA','DESAPROBADA','DESAPROBADA',3,'PREVENTA',NULL),
 (2,'PREVENTA','PREVENTA','PENDIENTE DE SCORE','PENDIENTE DE SCORE',4,'VENTA',NULL),
 (2,'PREVENTA','PREVENTA','PENDIENTE DE HABILITAR EDIFICIO','PENDIENTE DE HABILITAR EDIFICIO',5,'VENTA',NULL),
 (2,'PREVENTA','PREVENTA','PENDIENTE DE LIBERAR CLIENTE','PENDIENTE DE LIBERAR CLIENTE',6,'VENTA',NULL),
 (2,'VENTA','SIN INGRESAR','SEC ANULADA','SEC ANULADA',1,'VENTA',NULL),
 (2,'VENTA','SIN INGRESAR','CHANCADA / SIN INGRESAR','CHANCADA / SIN INGRESAR',2,'VENTA',NULL),
 (2,'VENTA','SIN INGRESAR','SIN SEC','SIN SEC',3,'VENTA',NULL),
 (2,'VENTA','SIN INGRESAR','SIN SEC - NO APLICA','SIN SEC - NO APLICA',4,'VENTA',NULL),
 (2,'VENTA','SIN INGRESAR','CON SEC','CON SEC',5,'VENTA',NULL),
 (2,'VENTA','SIN INGRESAR','CON SEC - GRABADO','CON SEC - GRABADO',6,'VENTA',NULL),
 (2,'VENTA','SIN INGRESAR','CON SEC - NO CONTESTA','CON SEC - NO CONTESTA',7,'VENTA',NULL),
 (2,'VENTA','SIN INGRESAR','CON SEC - NO DESEA - MALA OFERTA','CON SEC - NO DESEA - MALA OFERTA',8,'VENTA',NULL),
 (2,'VENTA','SIN INGRESAR','CON SEC - NO DESEA GRABAR','CON SEC - NO DESEA GRABAR',9,'VENTA',NULL),
 (2,'VENTA','SIN INGRESAR','CON SEC - PENDIENTE CREDITOS','CON SEC - PENDIENTE CREDITOS',10,'VENTA',NULL),
 (2,'VENTA','SIN INGRESAR','CON SEC - PENDIENTE AUTORIZACION','CON SEC - PENDIENTE AUTORIZACION',11,'VENTA',NULL),
 (2,'VENTA','SIN INGRESAR','CON SEC - PENDIENTE PAGO INSTALACION','CON SEC - PENDIENTE PAGO INSTALACION',12,'VENTA',NULL),
 (2,'VENTA','SIN INGRESAR','CON SEC - SIN ING - NO CALIFICA','CON SEC - SIN ING - NO CALIFICA',13,'VENTA',NULL),
 (2,'VENTA','SIN INGRESAR','CON SEC - SIN ING - SIN COBERTURA','CON SEC - SIN ING - SIN COBERTURA',14,'VENTA',NULL),
 (2,'VENTA','SIN INGRESAR','CON SEC - SIN ING - SERVICIO ACTIVO','CON SEC - SIN ING - SERVICIO ACTIVO',15,'VENTA',NULL),
 (2,'VENTA','SIN INGRESAR','CON SEC - PENDIENTE HABILITAR EDIFICIO','CON SEC - PENDIENTE HABILITAR EDIFICIO',16,'VENTA',NULL),
 (2,'VENTA','INGRESADO','CON SOT - EN REVISION','CON SOT - EN REVISION',1,'VENTA',NULL),
 (2,'VENTA','SUBSANABLE','CON SOT - TRANSACCION N/A','CON SOT - TRANSACCION N/A',1,'VENTA',NULL),
 (2,'VENTA','SUBSANABLE','CON SOT - AUDIO OBSERVADO','CON SOT - AUDIO OBSERVADO',2,'VENTA',NULL),
 (2,'VENTA','SUBSANABLE','CANCELADA - NO CONTESTA','CANCELADA - NO CONTESTA',3,'VENTA',NULL),
 (2,'VENTA','SUBSANABLE','CANCELADA - SIN FACILIDADES TECNICAS CLIENTE','CANCELADA - SIN FACILIDADES TECNICAS CLIENTE',4,'VENTA',NULL),
 (2,'VENTA','SUBSANABLE','CANCELADA - NO DESEA','CANCELADA - NO DESEA',5,'VENTA',NULL),
 (2,'VENTA','SUBSANABLE','CANCELADA - MALA OFERTA','CANCELADA - MALA OFERTA',6,'VENTA',NULL),
 (2,'VENTA','SUBSANABLE','CON SOT - EN REASIGNACION','CON SOT - EN REASIGNACION',7,'VENTA',NULL),
 (2,'VENTA','SUBSANABLE','CANCELADA - DIRECCION ERRADA','CANCELADA - DIRECCION ERRADA',8,'VENTA',NULL),
 (2,'VENTA','SUBSANABLE','CANCELADA - PLAN ERRADO','CANCELADA - PLAN ERRADO',9,'VENTA',NULL),
 (2,'VENTA','SUBSANABLE','CANCELADA - FACTIBILIDAD TECNICA','CANCELADA - FACTIBILIDAD TECNICA',10,'VENTA',NULL),
 (2,'VENTA','SUBSANABLE','CANCELADA - ZONA PELIGROSA','CANCELADA - ZONA PELIGROSA',11,'VENTA',NULL),
 (2,'VENTA','SUBSANABLE','CANCELADA - INFRAESTRUCTURA RED','CANCELADA - INFRAESTRUCTURA RED',12,'VENTA',NULL),
 (2,'VENTA','SUBSANABLE','CANCELADA - RED SATURADA','CANCELADA - RED SATURADA',13,'VENTA',NULL),
 (2,'VENTA','SUBSANABLE','CANCELADA - SOT CON ERROR EN EL SISTEMA','CANCELADA - SOT CON ERROR EN EL SISTEMA',14,'VENTA',NULL),
 (2,'VENTA','SUBSANABLE','CANCELADA - PORTABILIDAD NO EFECTUADA','CANCELADA - PORTABILIDAD NO EFECTUADA',15,'VENTA',NULL),
 (2,'VENTA','SUBSANABLE','CANCELADA - MUDANZA/VIAJE','CANCELADA - MUDANZA/VIAJE',16,'VENTA',NULL),
 (2,'VENTA','SUBSANABLE','CANCELADA - RECUPERADO','CANCELADA - RECUPERADO',17,'VENTA',NULL),
 (2,'VENTA','SUBSANABLE','CANCELADA - EXCEDE METRAJE','CANCELADA - EXCEDE METRAJE',18,'VENTA',NULL),
 (2,'VENTA','NO RECUPERABLE','CANCELADA - SIN FACILIDADES TECNICAS','CANCELADA - SIN FACILIDADES TECNICAS',1,'PREVENTA',NULL),
 (2,'VENTA','NO RECUPERABLE','CANCELADA - CARRUSEL','CANCELADA - CARRUSEL',2,'PREVENTA',NULL),
 (2,'VENTA','NO RECUPERABLE','CON SOT - DUPLICADO','CON SOT - DUPLICADO',3,'PREVENTA',NULL),
 (2,'VENTA','NO RECUPERABLE','CANCELADA - SIN FACILIDADES CLIENTE','CANCELADA - SIN FACILIDADES CLIENTE',4,'PREVENTA',NULL),
 (2,'VENTA','NO RECUPERABLE','POSIBLE FRAUDE','POSIBLE FRAUDE',5,'PREVENTA',NULL),
 (2,'VENTA','NO RECUPERABLE','BLACKLIST OPERADOR','BLACKLIST OPERADOR',6,'PREVENTA',NULL),
 (2,'VENTA','NO RECUPERABLE','BLACKLIST ESTAFADOR','BLACKLIST ESTAFADOR',7,'PREVENTA',NULL),
 (2,'VENTA','PROGRAMADO','EJECUCION','EJECUCION',1,'VENTA',NULL),
 (2,'VENTA','PROGRAMADO','EN CAMINO','EN CAMINO',2,'VENTA',NULL),
 (2,'VENTA','PROGRAMADO','INICIADA','INICIADA',3,'VENTA',NULL),
 (2,'VENTA','PROGRAMADO','SIN CD','SIN CD',4,'VENTA',NULL),
 (2,'VENTA','PROGRAMADO','TECNICO EN CASA','TECNICO EN CASA',5,'VENTA',NULL),
 (2,'VENTA','PROGRAMADO','REPROGRAMADA','REPROGRAMADA',6,'VENTA',NULL),
 (2,'VENTA','PROGRAMADO','TARDANZA TECNICA','TARDANZA TECNICA',7,'VENTA',NULL),
 (2,'VENTA','PROGRAMADO','RECUPERADO','RECUPERADO',8,'VENTA',NULL),
 (2,'VENTA','INSTALADO','SERVICIO INSTALADO','SERVICIO INSTALADO',1,'POSTVENTA','EN_SEGUIMIENTO')
) AS v(id_equipo, etapa, tipi, sub, sub_desc, sub_orden, etapa_cambio, epc)
JOIN tipificacion t ON t.id_equipo = v.id_equipo AND t.etapa = v.etapa AND t.codigo = v.tipi;

INSERT INTO subtipificacion_comportamiento (subtipificacion_id, comportamiento)
SELECT s.id, v.comp
FROM (VALUES
 (1,'PREVENTA','NO DESEA','FIN DE MES','APARECE_EN_AGENDADOS_GTR'),
 (1,'PREVENTA','NO DESEA','CONSULTARA CON FAMILIAR','APARECE_EN_AGENDADOS_GTR'),
 (1,'PREVENTA','NO DESEA','CONSULTARA CON FAMILIAR','REQUIERE_HORA_PROGRAMADA'),
 (1,'PREVENTA','NO DESEA','AGENDADO','APARECE_EN_AGENDADOS_GTR'),
 (1,'PREVENTA','NO DESEA','AGENDADO','REQUIERE_HORA_PROGRAMADA'),
 (1,'PREVENTA','PREVENTA','COMPLETA','ES_CIERRE_PREVENTA'),
 (1,'PREVENTA','PREVENTA','COMPLETA','RECIBE_MERITO'),
 (1,'PREVENTA','PREVENTA','PENDIENTE DE SCORE','ES_CIERRE_PREVENTA'),
 (1,'PREVENTA','PREVENTA','PENDIENTE DE SCORE','RECIBE_MERITO'),
 (1,'PREVENTA','PREVENTA','PENDIENTE DE HABILITAR EDIFICIO','ES_CIERRE_PREVENTA'),
 (1,'PREVENTA','PREVENTA','PENDIENTE DE HABILITAR EDIFICIO','RECIBE_MERITO'),
 (1,'PREVENTA','PREVENTA','PENDIENTE DE LIBERAR CLIENTE','ES_CIERRE_PREVENTA'),
 (1,'PREVENTA','PREVENTA','PENDIENTE DE LIBERAR CLIENTE','RECIBE_MERITO'),
 (1,'VENTA','SUBSANABLE','PROGRAMACION CANCELADA','ES_CANCELACION_PROGRAMACION'),
 (1,'VENTA','SUBSANABLE','PROGRAMACION CANCELADA','REQUIERE_FECHA_PROGRAMACION'),
 (1,'VENTA','SUBSANABLE','CHANCADA / PROGRAMADA','REQUIERE_FECHA_PROGRAMACION'),
 (1,'VENTA','PROGRAMADO','AGENDADO','REQUIERE_FECHA_PROGRAMACION'),
 (1,'VENTA','PROGRAMADO','EN CAMINO','REQUIERE_FECHA_PROGRAMACION'),
 (1,'VENTA','PROGRAMADO','INICIADA','REQUIERE_FECHA_PROGRAMACION'),
 (1,'VENTA','PROGRAMADO','SIN CD','REQUIERE_FECHA_PROGRAMACION'),
 (1,'VENTA','PROGRAMADO','TECNICO EN CASA','REQUIERE_FECHA_PROGRAMACION'),
 (1,'VENTA','PROGRAMADO','PROGRAMADA','REQUIERE_FECHA_PROGRAMACION'),
 (1,'VENTA','PROGRAMADO','REPROGRAMADA','REQUIERE_FECHA_PROGRAMACION'),
 (1,'VENTA','INSTALADO','SERVICIO INSTALADO','RECIBE_MERITO'),
 (1,'VENTA','INSTALADO','SERVICIO INSTALADO','REQUIERE_FECHA_INSTALACION'),
 (2,'PREVENTA','NO DESEA','FIN DE MES','APARECE_EN_AGENDADOS_GTR'),
 (2,'PREVENTA','NO DESEA','CONSULTARA CON FAMILIAR','APARECE_EN_AGENDADOS_GTR'),
 (2,'PREVENTA','NO DESEA','CONSULTARA CON FAMILIAR','REQUIERE_HORA_PROGRAMADA'),
 (2,'PREVENTA','NO DESEA','AGENDADO','APARECE_EN_AGENDADOS_GTR'),
 (2,'PREVENTA','NO DESEA','AGENDADO','REQUIERE_HORA_PROGRAMADA'),
 (2,'PREVENTA','PREVENTA','COMPLETA','ES_CIERRE_PREVENTA'),
 (2,'PREVENTA','PREVENTA','COMPLETA','RECIBE_MERITO'),
 (2,'PREVENTA','PREVENTA','PENDIENTE DE SCORE','ES_CIERRE_PREVENTA'),
 (2,'PREVENTA','PREVENTA','PENDIENTE DE SCORE','RECIBE_MERITO'),
 (2,'PREVENTA','PREVENTA','PENDIENTE DE HABILITAR EDIFICIO','ES_CIERRE_PREVENTA'),
 (2,'PREVENTA','PREVENTA','PENDIENTE DE HABILITAR EDIFICIO','RECIBE_MERITO'),
 (2,'PREVENTA','PREVENTA','PENDIENTE DE LIBERAR CLIENTE','ES_CIERRE_PREVENTA'),
 (2,'PREVENTA','PREVENTA','PENDIENTE DE LIBERAR CLIENTE','RECIBE_MERITO'),
 (2,'VENTA','INGRESADO','CON SOT - EN REVISION','REQUIERE_SEC_SOT'),
 (2,'VENTA','NO RECUPERABLE','CON SOT - DUPLICADO','REQUIERE_SEC_SOT'),
 (2,'VENTA','PROGRAMADO','EJECUCION','REQUIERE_FECHA_PROGRAMACION'),
 (2,'VENTA','PROGRAMADO','EJECUCION','REQUIERE_SEC_SOT'),
 (2,'VENTA','PROGRAMADO','EN CAMINO','REQUIERE_FECHA_PROGRAMACION'),
 (2,'VENTA','PROGRAMADO','EN CAMINO','REQUIERE_SEC_SOT'),
 (2,'VENTA','PROGRAMADO','INICIADA','REQUIERE_FECHA_PROGRAMACION'),
 (2,'VENTA','PROGRAMADO','INICIADA','REQUIERE_SEC_SOT'),
 (2,'VENTA','PROGRAMADO','SIN CD','REQUIERE_FECHA_PROGRAMACION'),
 (2,'VENTA','PROGRAMADO','SIN CD','REQUIERE_SEC_SOT'),
 (2,'VENTA','PROGRAMADO','TECNICO EN CASA','REQUIERE_FECHA_PROGRAMACION'),
 (2,'VENTA','PROGRAMADO','TECNICO EN CASA','REQUIERE_SEC_SOT'),
 (2,'VENTA','PROGRAMADO','REPROGRAMADA','REQUIERE_FECHA_PROGRAMACION'),
 (2,'VENTA','PROGRAMADO','REPROGRAMADA','REQUIERE_SEC_SOT'),
 (2,'VENTA','PROGRAMADO','TARDANZA TECNICA','REQUIERE_FECHA_PROGRAMACION'),
 (2,'VENTA','PROGRAMADO','TARDANZA TECNICA','REQUIERE_SEC_SOT'),
 (2,'VENTA','PROGRAMADO','RECUPERADO','REQUIERE_FECHA_PROGRAMACION'),
 (2,'VENTA','PROGRAMADO','RECUPERADO','REQUIERE_SEC_SOT'),
 (2,'VENTA','INSTALADO','SERVICIO INSTALADO','RECIBE_MERITO'),
 (2,'VENTA','INSTALADO','SERVICIO INSTALADO','REQUIERE_FECHA_INSTALACION')
) AS v(id_equipo, etapa, tipi, sub, comp)
JOIN tipificacion t ON t.id_equipo = v.id_equipo AND t.etapa = v.etapa AND t.codigo = v.tipi
JOIN subtipificacion s ON s.tipificacion_id = t.id AND s.codigo = v.sub;

-- ---------------------------------------------------------------------------
-- 6. MiFibraTeam (3) y PeruFibraTeam (4) reciben la matriz de WinTeam clonada, para que no puedan
--    divergir por transcripcion.
-- ---------------------------------------------------------------------------
INSERT INTO tipificacion (id_equipo, etapa, codigo, descripcion, orden, activo)
SELECT e.id_equipo, t.etapa, t.codigo, t.descripcion, t.orden, t.activo
FROM tipificacion t CROSS JOIN (VALUES (3),(4)) AS e(id_equipo)
WHERE t.id_equipo = 1;

INSERT INTO subtipificacion (tipificacion_id, codigo, descripcion, orden, etapa_cambio, estado_postventa_cambio, activo)
SELECT destino.id, s.codigo, s.descripcion, s.orden, s.etapa_cambio, s.estado_postventa_cambio, s.activo
FROM subtipificacion s
JOIN tipificacion origen ON origen.id = s.tipificacion_id AND origen.id_equipo = 1
JOIN tipificacion destino ON destino.id_equipo IN (3,4)
                         AND destino.etapa = origen.etapa
                         AND destino.codigo = origen.codigo;

INSERT INTO subtipificacion_comportamiento (subtipificacion_id, comportamiento)
SELECT destino_s.id, c.comportamiento
FROM subtipificacion_comportamiento c
JOIN subtipificacion origen_s ON origen_s.id = c.subtipificacion_id
JOIN tipificacion origen_t ON origen_t.id = origen_s.tipificacion_id AND origen_t.id_equipo = 1
JOIN tipificacion destino_t ON destino_t.id_equipo IN (3,4)
                           AND destino_t.etapa = origen_t.etapa
                           AND destino_t.codigo = origen_t.codigo
JOIN subtipificacion destino_s ON destino_s.tipificacion_id = destino_t.id
                              AND destino_s.codigo = origen_s.codigo;

-- ---------------------------------------------------------------------------
-- 7. Reconectar el lead con la matriz nueva. Los ids apuntaban a filas que ya no existen; nadie los
--    re-resuelve hoy (el catalogo se busca por codigo), pero se dejan correctos igual.
-- ---------------------------------------------------------------------------
UPDATE lead l
SET id_tipificacion = t.id,
    id_subtipificacion = s.id
FROM tipificacion t
JOIN subtipificacion s ON s.tipificacion_id = t.id
WHERE l.codigo_tipificacion IS NOT NULL
  AND t.id_equipo = l.id_equipo
  AND t.etapa = l.etapa
  AND t.codigo = l.codigo_tipificacion
  AND s.codigo = l.codigo_subtipificacion;

-- ---------------------------------------------------------------------------
-- 8. Repoblar el orden de lead_etapa_resumen. Guarda el orden de la TIPIFICACION (no el de la
--    subtipificacion) y es lo que compara el high-water mark de mayor rango.
-- ---------------------------------------------------------------------------
UPDATE lead_etapa_resumen r
SET primera_tipificacion_orden = t.orden
FROM lead l, tipificacion t
WHERE l.id = r.id_lead
  AND r.primera_codigo_tipificacion IS NOT NULL
  AND t.id_equipo = l.id_equipo AND t.etapa = r.etapa AND t.codigo = r.primera_codigo_tipificacion;

UPDATE lead_etapa_resumen r
SET ultima_tipificacion_orden = t.orden
FROM lead l, tipificacion t
WHERE l.id = r.id_lead
  AND r.ultima_codigo_tipificacion IS NOT NULL
  AND t.id_equipo = l.id_equipo AND t.etapa = r.etapa AND t.codigo = r.ultima_codigo_tipificacion;

UPDATE lead_etapa_resumen r
SET mayor_rango_orden = t.orden
FROM lead l, tipificacion t
WHERE l.id = r.id_lead
  AND r.mayor_rango_codigo_tipificacion IS NOT NULL
  AND t.id_equipo = l.id_equipo AND t.etapa = r.etapa AND t.codigo = r.mayor_rango_codigo_tipificacion;

-- El orden relativo cambio con la matriz nueva, asi que el mayor rango guardado puede haber quedado
-- por debajo de la primera o la ultima, rompiendo su invariante. Se recalcula sobre los tres puntos
-- conocidos: no recupera un maximo intermedio que nunca se guardo, pero restaura
-- mayor_rango >= max(primera, ultima), que es lo que la reporteria asume.
WITH puntos AS (
    SELECT r.id,
           x.tipi, x.sub, x.orden, x.at,
           ROW_NUMBER() OVER (PARTITION BY r.id ORDER BY x.orden DESC NULLS LAST, x.at DESC NULLS LAST) AS rn
    FROM lead_etapa_resumen r
    CROSS JOIN LATERAL (VALUES
        (r.primera_codigo_tipificacion, r.primera_codigo_subtipificacion, r.primera_tipificacion_orden, r.primera_tipificacion_at),
        (r.ultima_codigo_tipificacion, r.ultima_codigo_subtipificacion, r.ultima_tipificacion_orden, r.ultima_tipificacion_at),
        (r.mayor_rango_codigo_tipificacion, r.mayor_rango_codigo_subtipificacion, r.mayor_rango_orden, r.mayor_rango_at)
    ) AS x(tipi, sub, orden, at)
    WHERE x.tipi IS NOT NULL
)
UPDATE lead_etapa_resumen r
SET mayor_rango_codigo_tipificacion = p.tipi,
    mayor_rango_codigo_subtipificacion = p.sub,
    mayor_rango_orden = p.orden,
    mayor_rango_at = p.at
FROM puntos p
WHERE p.id = r.id AND p.rn = 1;

-- ---------------------------------------------------------------------------
-- 9. Guarda final: nada puede quedar apuntando fuera de la matriz nueva.
-- ---------------------------------------------------------------------------
DO $$
DECLARE
    huerfanos BIGINT;
BEGIN
    SELECT count(*) INTO huerfanos
    FROM lead l
    WHERE l.codigo_tipificacion IS NOT NULL
      AND NOT EXISTS (
          SELECT 1 FROM tipificacion t
          JOIN subtipificacion s ON s.tipificacion_id = t.id
          WHERE t.id_equipo = l.id_equipo AND t.etapa = l.etapa
            AND t.codigo = l.codigo_tipificacion AND s.codigo = l.codigo_subtipificacion
      );
    IF huerfanos > 0 THEN
        RAISE EXCEPTION 'Quedaron % leads con una tipificacion que no existe en la matriz nueva.', huerfanos;
    END IF;

    SELECT count(*) INTO huerfanos FROM lead l
    WHERE l.codigo_tipificacion IS NOT NULL AND l.id_tipificacion IS NULL;
    IF huerfanos > 0 THEN
        RAISE EXCEPTION 'Quedaron % leads tipificados sin id_tipificacion resuelto.', huerfanos;
    END IF;
END $$;
