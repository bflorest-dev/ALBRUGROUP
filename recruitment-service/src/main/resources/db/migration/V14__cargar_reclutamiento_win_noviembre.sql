-- V14: carga idempotente de postulantes y postulaciones WIN desde 2026-11-01.
-- Fuente normalizada: OLD/RECLUTAMIENTO_WIN_BASE_NORMALIZADA.xlsx, hoja BASE_NORMALIZADA.
-- La columna ESTADO_CTC_ORIGEN se conserva solo como trazabilidad de la fuente.
-- Las postulaciones nuevas inician en RECLUTAMIENTO / EN_PROCESO / POSTULANTE.

CREATE TEMP TABLE _reclutamiento_win_noviembre_source (
    fuente_fila                  INTEGER PRIMARY KEY,
    fecha_postulacion            DATE NOT NULL,
    fecha_registro               DATE NOT NULL,
    nombres                      VARCHAR(255),
    apellidos                    VARCHAR(255),
    tipo_documento               VARCHAR(255),
    documento                    VARCHAR(255),
    fecha_nacimiento             DATE,
    celular                      VARCHAR(255),
    numero_exclusivo_llamadas    VARCHAR(255),
    usuario_meta                 VARCHAR(255),
    puesto_objetivo              VARCHAR(255) NOT NULL,
    negocio                      VARCHAR(255) NOT NULL,
    origen                       VARCHAR(255) NOT NULL,
    modalidad                    VARCHAR(255),
    horario                      VARCHAR(255),
    id_empleado_registrador      BIGINT,
    reclutador_original          VARCHAR(255),
    estado_ctc_origen            VARCHAR(255)
) ON COMMIT DROP;

INSERT INTO _reclutamiento_win_noviembre_source (
    fuente_fila,
    fecha_postulacion,
    fecha_registro,
    nombres,
    apellidos,
    tipo_documento,
    documento,
    fecha_nacimiento,
    celular,
    numero_exclusivo_llamadas,
    usuario_meta,
    puesto_objetivo,
    negocio,
    origen,
    modalidad,
    horario,
    id_empleado_registrador,
    reclutador_original,
    estado_ctc_origen
)
VALUES
    (1118, DATE '2026-11-01', DATE '2026-11-02', 'Ale', 'Idiáquez', 'DNI', '75166944', DATE '2005-11-26', '989586049', '989586049', NULL, 'ASESOR_VENTAS', 'WIN', 'COMPUTRABAJO', 'PART_TIME', NULL, 950020, 'HOYMING', 'NO_INTERESADO'),
    (1119, DATE '2026-11-02', DATE '2026-11-02', 'Lucia Cristina', 'Barreto Ortiz', 'DNI', '42897208', DATE '1985-02-20', '953344756', '953344756', NULL, 'ASESOR_VENTAS', 'WIN', 'COMPUTRABAJO', 'PART_TIME', 'AFTERNOON', 950020, 'HOYMING', 'NO_INTERESADO'),
    (1120, DATE '2026-11-02', DATE '2026-11-02', 'Cistopher', 'Martinez Antonio', 'DNI', '72823385', DATE '2006-11-21', '904132599', '904132599', NULL, 'ASESOR_VENTAS', 'WIN', 'COMPUTRABAJO', 'PART_TIME', 'AFTERNOON', 950020, 'HOYMING', 'NO_INTERESADO'),
    (1121, DATE '2026-11-02', DATE '2026-11-02', 'Caroline', 'Pelayza Inocente', 'DNI', '76023414', DATE '1996-10-17', '912155465', '912155465', 'luciernaga41822', 'ASESOR_VENTAS', 'WIN', 'COMPUTRABAJO', 'PART_TIME', NULL, 950013, 'YOSHUA', 'RECHAZADO'),
    (1122, DATE '2026-11-02', DATE '2026-11-02', 'Joaquin', 'Rubina', NULL, NULL, NULL, '917279881', '917279881', NULL, 'ASESOR_VENTAS', 'WIN', 'FACEBOOK', 'PART_TIME', NULL, 950021, 'MARIEL', 'NO_INTERESADO'),
    (1123, DATE '2026-11-02', DATE '2026-11-03', 'Italo David', 'Olaya Rojas', 'DNI', '61121872', DATE '2007-11-06', '932183606', '932183606', NULL, 'ASESOR_VENTAS', 'WIN', 'COMPUTRABAJO', 'PART_TIME', NULL, 950013, 'YOSHUA', 'RECHAZADO'),
    (1124, DATE '2026-11-02', DATE '2026-11-03', 'José Luis', 'Rantes Villafuerte', 'DNI', '72729618', DATE '2005-04-15', '997696420', '997696420', NULL, 'ASESOR_VENTAS', 'WIN', 'COMPUTRABAJO', 'PART_TIME', NULL, 950013, 'YOSHUA', 'NO_INTERESADO'),
    (1125, DATE '2026-11-03', DATE '2026-11-03', 'V', 'Morales García', 'DNI', '74876733', DATE '2005-04-17', '965414576', '965414576', NULL, 'ASESOR_VENTAS', 'WIN', 'COMPUTRABAJO', 'PART_TIME', 'MORNING', 950021, 'MARIEL', 'RECHAZADO'),
    (1126, DATE '2026-11-03', DATE '2026-11-03', 'Lea', 'Llanos Espinoza', 'DNI', '60951913', DATE '2005-04-17', '955154725', '955154725', 'llanos117', 'ASESOR_VENTAS', 'WIN', 'COMPUTRABAJO', 'PART_TIME', 'AFTERNOON', 950020, 'HOYMING', 'NO_INTERESADO'),
    (1127, DATE '2026-11-04', DATE '2026-11-05', 'Alessandro', 'Omar', 'DNI', '61207467', DATE '2006-05-09', '967205683', '967205683', NULL, 'ASESOR_VENTAS', 'WIN', 'COMPUTRABAJO', 'PART_TIME', 'AFTERNOON', 950020, 'HOYMING', 'APROBADO'),
    (1128, DATE '2026-11-05', DATE '2026-11-05', NULL, 'Sotomayor', 'DNI', '70037482', DATE '1997-03-06', '934230603', '934230603', NULL, 'ASESOR_VENTAS', 'WIN', 'COMPUTRABAJO', 'PART_TIME', 'MORNING', 950021, 'MARIEL', 'APROBADO'),
    (1129, DATE '2026-11-06', DATE '2026-11-06', 'Juan Alejandro', 'Espino Siquihuay', 'DNI', '72708079', DATE '1992-11-16', '953871192', '953871192', NULL, 'ASESOR_VENTAS', 'WIN', 'COMPUTRABAJO', 'PART_TIME', NULL, 950020, 'HOYMING', 'NO_INTERESADO'),
    (1130, DATE '2026-11-06', DATE '2026-11-06', 'Camilo', 'Pizarro Lucar', 'DNI', '75597675', DATE '1997-03-21', '989849917', '989849917', 'Hugo_PL21', 'ASESOR_VENTAS', 'WIN', 'COMPUTRABAJO', 'PART_TIME', 'MORNING', 950020, 'HOYMING', 'NO_INTERESADO'),
    (1131, DATE '2026-11-05', DATE '2026-11-06', 'Angie', 'Tafur Ramos', 'DNI', '70862318', DATE '2005-01-13', '919575084', '919575084', NULL, 'ASESOR_VENTAS', 'WIN', 'COMPUTRABAJO', 'PART_TIME', 'AFTERNOON', 950020, 'HOYMING', 'APROBADO'),
    (1132, DATE '2026-11-06', DATE '2026-11-06', 'Carmen', 'Moscoso', 'DNI', '73226538', DATE '1998-04-27', '975610854', '975610854', NULL, 'ASESOR_VENTAS', 'WIN', 'COMPUTRABAJO', 'PART_TIME', NULL, 950021, 'MARIEL', 'RECHAZADO'),
    (1133, DATE '2026-11-06', DATE '2026-11-06', 'Bryanna', 'Rosas Lozano', 'DNI', '60916021', DATE '2006-12-04', '975608737', '975608737', NULL, 'ASESOR_VENTAS', 'WIN', 'COMPUTRABAJO', 'PART_TIME', NULL, 950020, 'HOYMING', 'NO_INTERESADO'),
    (1134, DATE '2026-11-06', DATE '2026-11-06', 'Franklin Omar', 'Gonzales Cano', NULL, NULL, NULL, '912375961', '912375961', NULL, 'ASESOR_VENTAS', 'WIN', 'COMPUTRABAJO', 'PART_TIME', 'MORNING', 950021, 'MARIEL', 'APROBADO'),
    (1135, DATE '2026-11-08', DATE '2026-11-09', 'Paula', 'Rios Grados', 'DNI', '61252391', DATE '2007-12-07', '954772375', '954772375', NULL, 'ASESOR_VENTAS', 'WIN', 'COMPUTRABAJO', 'PART_TIME', 'AFTERNOON', 950020, 'HOYMING', 'NO_INTERESADO'),
    (1136, DATE '2026-11-09', DATE '2026-11-09', 'Fiorella', 'Gomez', 'DNI', '75002781', DATE '2005-03-13', '989652900', '989652900', NULL, 'ASESOR_VENTAS', 'WIN', 'COMPUTRABAJO', 'PART_TIME', NULL, 950020, 'HOYMING', 'NO_INTERESADO'),
    (1137, DATE '2026-11-09', DATE '2026-11-10', 'Malhaber Soto', 'Cristian Miguel', 'DNI', '72071654', DATE '2008-08-13', '939787908', '939787908', 'cristianmms_13', 'ASESOR_VENTAS', 'WIN', 'COMPUTRABAJO', 'PART_TIME', 'MORNING', 950020, 'HOYMING', 'APROBADO'),
    (1138, DATE '2026-11-10', DATE '2026-11-10', 'angela', 'fernandez', NULL, NULL, NULL, '966316441', '966316441', NULL, 'ASESOR_VENTAS', 'WIN', 'FACEBOOK', 'PART_TIME', 'AFTERNOON', 950020, 'HOYMING', 'NO_INTERESADO'),
    (1139, DATE '2026-11-10', DATE '2026-11-10', 'Fernando', 'Arones', 'DNI', '72534570', DATE '2001-12-29', '985314921', '985314921', 'FerxxoA24', 'ASESOR_VENTAS', 'WIN', 'COMPUTRABAJO', 'PART_TIME', NULL, 950021, 'MARIEL', 'APROBADO'),
    (1140, DATE '2026-11-10', DATE '2026-11-10', 'Damaris', 'Robles', 'DNI', '74291499', DATE '2001-11-27', '986170728', '986170728', NULL, 'ASESOR_VENTAS', 'WIN', 'COMPUTRABAJO', 'PART_TIME', NULL, 950021, 'MARIEL', 'NO_INTERESADO'),
    (1141, DATE '2026-11-10', DATE '2026-11-10', 'Jairo', 'Suárez Jesús', 'DNI', '60748723', DATE '2006-08-03', '972791959', '972791959', NULL, 'ASESOR_VENTAS', 'WIN', 'COMPUTRABAJO', 'PART_TIME', NULL, 950021, 'MARIEL', 'APROBADO'),
    (1142, DATE '2026-11-10', DATE '2026-11-10', 'Natali Jazmin', 'Roman Tavara', 'DNI', '72651577', DATE '2003-11-15', '971722784', '971722784', NULL, 'ASESOR_VENTAS', 'WIN', 'COMPUTRABAJO', 'PART_TIME', NULL, 950021, 'MARIEL', 'NO_INTERESADO'),
    (1143, DATE '2026-11-11', DATE '2026-11-11', 'Cindy Massiel', 'Bustamante Pérez', 'DNI', '71645535', DATE '2005-01-09', '975694468', '975694468', NULL, 'ASESOR_VENTAS', 'WIN', 'COMPUTRABAJO', 'PART_TIME', NULL, 950020, 'HOYMING', 'NO_INTERESADO'),
    (1144, DATE '2026-11-13', DATE '2026-11-14', 'Paola', 'Tintaya', 'DNI', '72873334', DATE '1998-04-03', '910393864', '910393864', NULL, 'ASESOR_VENTAS', 'WIN', 'COMPUTRABAJO', 'PART_TIME', 'AFTERNOON', 950020, 'HOYMING', 'RECHAZADO'),
    (1145, DATE '2026-11-14', DATE '2026-11-14', 'Jassuri', 'Bruno', NULL, NULL, NULL, '924433147', '924433147', NULL, 'ASESOR_VENTAS', 'WIN', 'REFERIDO', 'PART_TIME', 'MORNING', 950021, 'MARIEL', 'APROBADO'),
    (1146, DATE '2026-11-15', DATE '2026-11-16', 'Abigail', 'Peña Rojas', 'DNI', '70713131', DATE '2007-07-05', '959111271', '959111271', 'biscuitl', 'ASESOR_VENTAS', 'WIN', 'COMPUTRABAJO', 'PART_TIME', 'AFTERNOON', 950020, 'HOYMING', 'APROBADO'),
    (1147, DATE '2026-11-15', DATE '2026-11-16', 'Harry', 'Sotomayor Vigil', 'DNI', '60413027', DATE '2006-06-20', '924259873', '924259873', 'hsv_1923', 'ASESOR_VENTAS', 'WIN', 'COMPUTRABAJO', 'PART_TIME', 'AFTERNOON', 950020, 'HOYMING', 'APROBADO'),
    (1148, DATE '2026-11-14', DATE '2026-11-16', NULL, NULL, NULL, NULL, NULL, '971803725', '971803725', NULL, 'ASESOR_VENTAS', 'WIN', 'FACEBOOK', 'PART_TIME', NULL, 950020, 'HOYMING', 'NO_INTERESADO'),
    (1149, DATE '2026-11-16', DATE '2026-11-17', 'Yosmiliy', 'Mantari', 'DNI', '76367332', DATE '2005-10-18', '906730633', '906730633', NULL, 'ASESOR_VENTAS', 'WIN', 'COMPUTRABAJO', 'PART_TIME', 'AFTERNOON', 950020, 'HOYMING', 'INTERESADO'),
    (1150, DATE '2026-11-17', DATE '2026-11-17', 'Jose', 'Varillas', 'DNI', '73086546', DATE '2006-05-01', '981168271', '981168271', 'josedavidd_', 'ASESOR_VENTAS', 'WIN', 'COMPUTRABAJO', 'PART_TIME', NULL, 950018, 'DIANA', 'EN_PROCESO'),
    (1151, DATE '2026-11-18', DATE '2026-11-18', 'Andrea', 'Iman', 'DNI', '76588084', DATE '2004-12-03', '968980699', '968980699', NULL, 'ASESOR_VENTAS', 'WIN', 'COMPUTRABAJO', 'PART_TIME', NULL, 950020, 'HOYMING', 'SIN_CONTACTO'),
    (1152, DATE '2026-11-17', DATE '2026-11-18', 'Johann', 'Melgarejo', 'DNI', '61187038', DATE '2007-11-12', '983431754', '983431754', NULL, 'ASESOR_VENTAS', 'WIN', 'COMPUTRABAJO', 'PART_TIME', NULL, 950020, 'HOYMING', 'SIN_CONTACTO'),
    (1153, DATE '2026-11-17', DATE '2026-11-18', 'Crystel', 'Delgado', 'DNI', '74361680', DATE '1996-01-02', '904617717', '929612254', 'Rapuk15', 'ASESOR_VENTAS', 'WIN', 'COMPUTRABAJO', NULL, NULL, NULL, NULL, NULL);

DO $$
BEGIN
    IF EXISTS (
        SELECT 1
        FROM _reclutamiento_win_noviembre_source
        WHERE fecha_postulacion < DATE '2026-11-01'
    ) THEN
        RAISE EXCEPTION 'La fuente contiene filas fuera del rango desde 2026-11-01';
    END IF;

    IF EXISTS (
        SELECT 1
        FROM _reclutamiento_win_noviembre_source
        WHERE celular IS NULL
    ) THEN
        RAISE EXCEPTION 'La fuente contiene postulaciones sin celular';
    END IF;

    IF EXISTS (
        SELECT 1
        FROM _reclutamiento_win_noviembre_source
        WHERE tipo_documento IS NOT NULL
          AND tipo_documento NOT IN ('DNI', 'CE')
    ) THEN
        RAISE EXCEPTION 'La fuente contiene tipos de documento no mapeados';
    END IF;

    IF EXISTS (
        SELECT 1
        FROM _reclutamiento_win_noviembre_source
        WHERE puesto_objetivo NOT IN (
            'RRHH', 'RECLUTADOR', 'CAPACITADOR', 'DESARROLLADOR', 'CONTADOR',
            'COMMUNITY', 'MONITOR', 'SUPERVISOR_VENTAS', 'ASESOR_VENTAS',
            'SUPERVISOR_BACKOFFICE', 'ASESOR_BACKOFFICE', 'SUPERVISOR_GTR',
            'ASESOR_GTR', 'SUPERVISOR_POSTVENTA', 'ASESOR_POSTVENTA'
        )
    ) THEN
        RAISE EXCEPTION 'La fuente contiene puestos objetivo no mapeados';
    END IF;

    IF EXISTS (
        SELECT 1
        FROM _reclutamiento_win_noviembre_source
        WHERE negocio NOT IN ('WIN', 'CLARO')
    ) THEN
        RAISE EXCEPTION 'La fuente contiene negocios no mapeados';
    END IF;

    IF EXISTS (
        SELECT 1
        FROM _reclutamiento_win_noviembre_source
        WHERE origen NOT IN ('COMPUTRABAJO', 'INDEED', 'TIKTOK', 'FACEBOOK', 'LINKEDIN', 'REFERIDO')
    ) THEN
        RAISE EXCEPTION 'La fuente contiene orígenes no mapeados';
    END IF;

    IF EXISTS (
        SELECT 1
        FROM _reclutamiento_win_noviembre_source
        WHERE modalidad IS NOT NULL
          AND modalidad NOT IN ('PART_TIME', 'FULL_TIME', 'SEMI_FULL', 'SUPER_FULL')
    ) THEN
        RAISE EXCEPTION 'La fuente contiene modalidades no mapeadas';
    END IF;

    IF EXISTS (
        SELECT 1
        FROM _reclutamiento_win_noviembre_source
        WHERE horario IS NOT NULL
          AND horario NOT IN ('MORNING', 'AFTERNOON', 'NIGHT')
    ) THEN
        RAISE EXCEPTION 'La fuente contiene horarios no mapeados';
    END IF;

    IF EXISTS (
        SELECT 1
        FROM _reclutamiento_win_noviembre_source
        WHERE reclutador_original IS NOT NULL
          AND id_empleado_registrador IS NULL
    ) THEN
        RAISE EXCEPTION 'La fuente contiene reclutadores sin empleado mapeado';
    END IF;

    IF EXISTS (
        SELECT LOWER(BTRIM(usuario_meta))
        FROM _reclutamiento_win_noviembre_source
        WHERE usuario_meta IS NOT NULL
        GROUP BY LOWER(BTRIM(usuario_meta))
        HAVING COUNT(*) > 1
    ) THEN
        RAISE EXCEPTION 'La fuente contiene usuarios Meta duplicados';
    END IF;

    IF EXISTS (
        SELECT
            COALESCE(tipo_documento || '|' || documento, 'CEL|' || celular) AS clave_fallback,
            fecha_postulacion,
            negocio,
            origen,
            puesto_objetivo
        FROM _reclutamiento_win_noviembre_source
        WHERE tipo_documento IS NULL
           OR documento IS NULL
        GROUP BY
            COALESCE(tipo_documento || '|' || documento, 'CEL|' || celular),
            fecha_postulacion,
            negocio,
            origen,
            puesto_objetivo
        HAVING COUNT(*) > 1
    ) THEN
        RAISE EXCEPTION 'Existen filas sin documento que comparten la misma clave alternativa; carga detenida';
    END IF;

    IF EXISTS (
        SELECT 1
        FROM _reclutamiento_win_noviembre_source s
        JOIN public.postulante p
          ON LOWER(BTRIM(p.usuario_meta)) = LOWER(BTRIM(s.usuario_meta))
        WHERE s.usuario_meta IS NOT NULL
          AND NOT (
              s.tipo_documento IS NOT NULL
              AND s.documento IS NOT NULL
              AND p.tipo_documento = s.tipo_documento
              AND p.documento = s.documento
          )
    ) THEN
        RAISE EXCEPTION 'Existe un usuario Meta de la fuente asignado a otro postulante';
    END IF;

    IF EXISTS (
        SELECT s.fuente_fila
        FROM _reclutamiento_win_noviembre_source s
        JOIN public.postulante p
          ON (
              (
                  s.tipo_documento IS NOT NULL
                  AND s.documento IS NOT NULL
                  AND p.tipo_documento = s.tipo_documento
                  AND p.documento = s.documento
              )
              OR (
                  (s.tipo_documento IS NULL OR s.documento IS NULL)
                  AND p.celular = s.celular
              )
          )
        GROUP BY s.fuente_fila
        HAVING COUNT(*) > 1
    ) THEN
        RAISE EXCEPTION 'Una fila de la fuente coincide con más de un postulante; carga detenida';
    END IF;

    IF EXISTS (
        SELECT s.fuente_fila
        FROM _reclutamiento_win_noviembre_source s
        JOIN public.postulante p
          ON (
              (
                  s.tipo_documento IS NOT NULL
                  AND s.documento IS NOT NULL
                  AND p.tipo_documento = s.tipo_documento
                  AND p.documento = s.documento
              )
              OR (
                  (s.tipo_documento IS NULL OR s.documento IS NULL)
                  AND p.celular = s.celular
              )
          )
        JOIN public.postulacion po
          ON po.postulante_id = p.id
         AND po.fecha_postulacion = s.fecha_postulacion
         AND po.origen = s.origen
         AND po.puesto_objetivo = s.puesto_objetivo
         AND po.negocio IS NOT DISTINCT FROM s.negocio
         AND (s.modalidad IS NULL OR po.modalidad IS NOT DISTINCT FROM s.modalidad)
         AND (s.horario IS NULL OR po.horario IS NOT DISTINCT FROM s.horario)
        GROUP BY s.fuente_fila
        HAVING COUNT(*) > 1
    ) THEN
        RAISE EXCEPTION 'Una fila de la fuente coincide con más de una postulación; carga detenida';
    END IF;
END $$;

CREATE TEMP TABLE _reclutamiento_win_noviembre_scope
ON COMMIT DROP
AS
SELECT
    s.*,
    p.id AS matched_postulante_id,
    po.id AS matched_postulacion_id
FROM _reclutamiento_win_noviembre_source s
LEFT JOIN LATERAL (
    SELECT p.id
    FROM public.postulante p
    WHERE (
        s.tipo_documento IS NOT NULL
        AND s.documento IS NOT NULL
        AND p.tipo_documento = s.tipo_documento
        AND p.documento = s.documento
    )
    OR (
        (s.tipo_documento IS NULL OR s.documento IS NULL)
        AND p.celular = s.celular
    )
    ORDER BY p.id
    LIMIT 1
) p ON TRUE
LEFT JOIN LATERAL (
    SELECT po.id
    FROM public.postulacion po
    WHERE p.id IS NOT NULL
      AND po.postulante_id = p.id
      AND po.fecha_postulacion = s.fecha_postulacion
      AND po.origen = s.origen
      AND po.puesto_objetivo = s.puesto_objetivo
      AND po.negocio IS NOT DISTINCT FROM s.negocio
      AND (s.modalidad IS NULL OR po.modalidad IS NOT DISTINCT FROM s.modalidad)
      AND (s.horario IS NULL OR po.horario IS NOT DISTINCT FROM s.horario)
    ORDER BY po.id
    LIMIT 1
) po ON TRUE;

CREATE TEMP TABLE _reclutamiento_win_noviembre_result (
    fuente_fila       INTEGER PRIMARY KEY,
    postulante_id     BIGINT NOT NULL,
    postulacion_id    BIGINT NOT NULL,
    inserted          BOOLEAN NOT NULL
) ON COMMIT DROP;

DO $$
DECLARE
    r                   RECORD;
    v_postulante_id     BIGINT;
    v_postulacion_id    BIGINT;
    v_fecha_registro    TIMESTAMP WITH TIME ZONE;
BEGIN
    FOR r IN
        SELECT *
        FROM _reclutamiento_win_noviembre_scope
        ORDER BY fuente_fila
    LOOP
        IF r.matched_postulacion_id IS NOT NULL THEN
            INSERT INTO _reclutamiento_win_noviembre_result (
                fuente_fila,
                postulante_id,
                postulacion_id,
                inserted
            )
            VALUES (
                r.fuente_fila,
                r.matched_postulante_id,
                r.matched_postulacion_id,
                FALSE
            );
            CONTINUE;
        END IF;

        v_fecha_registro := r.fecha_registro::TIMESTAMP AT TIME ZONE 'America/Lima';

        IF r.matched_postulante_id IS NOT NULL THEN
            v_postulante_id := r.matched_postulante_id;

            UPDATE public.postulante AS p
            SET nombres = COALESCE(r.nombres, p.nombres),
                apellidos = COALESCE(r.apellidos, p.apellidos),
                tipo_documento = COALESCE(r.tipo_documento, p.tipo_documento),
                documento = COALESCE(r.documento, p.documento),
                celular = COALESCE(r.celular, p.celular),
                numero_exclusivo_llamadas = COALESCE(
                    r.numero_exclusivo_llamadas,
                    p.numero_exclusivo_llamadas
                ),
                usuario_meta = COALESCE(r.usuario_meta, p.usuario_meta),
                fecha_nacimiento = COALESCE(r.fecha_nacimiento, p.fecha_nacimiento),
                lista_negra = COALESCE(p.lista_negra, FALSE)
            WHERE p.id = v_postulante_id;
        ELSE
            INSERT INTO public.postulante AS p (
                nombres,
                apellidos,
                tipo_documento,
                documento,
                celular,
                numero_exclusivo_llamadas,
                usuario_meta,
                fecha_nacimiento,
                lista_negra,
                created_at,
                updated_at
            )
            VALUES (
                r.nombres,
                r.apellidos,
                r.tipo_documento,
                r.documento,
                r.celular,
                r.numero_exclusivo_llamadas,
                r.usuario_meta,
                r.fecha_nacimiento,
                FALSE,
                v_fecha_registro,
                v_fecha_registro
            )
            ON CONFLICT (tipo_documento, documento) DO UPDATE
            SET nombres = COALESCE(EXCLUDED.nombres, p.nombres),
                apellidos = COALESCE(EXCLUDED.apellidos, p.apellidos),
                celular = COALESCE(EXCLUDED.celular, p.celular),
                numero_exclusivo_llamadas = COALESCE(
                    EXCLUDED.numero_exclusivo_llamadas,
                    p.numero_exclusivo_llamadas
                ),
                usuario_meta = COALESCE(EXCLUDED.usuario_meta, p.usuario_meta),
                fecha_nacimiento = COALESCE(EXCLUDED.fecha_nacimiento, p.fecha_nacimiento),
                lista_negra = COALESCE(p.lista_negra, FALSE)
            RETURNING p.id
            INTO v_postulante_id;
        END IF;

        INSERT INTO public.postulacion (
            created_at,
            estado,
            estado_bandeja,
            etapa,
            id_empleado_registrador,
            origen,
            updated_at,
            oferta_laboral_id,
            postulante_id,
            puesto_objetivo,
            negocio,
            modalidad,
            horario,
            fecha_postulacion
        )
        VALUES (
            v_fecha_registro,
            'EN_PROCESO',
            'POSTULANTE',
            'RECLUTAMIENTO',
            r.id_empleado_registrador,
            r.origen,
            v_fecha_registro,
            NULL,
            v_postulante_id,
            r.puesto_objetivo,
            r.negocio,
            r.modalidad,
            r.horario,
            r.fecha_postulacion
        )
        RETURNING id
        INTO v_postulacion_id;

        INSERT INTO public.evento (
            postulacion_id,
            id_empleado_responsable,
            etapa,
            accion,
            created_at
        )
        VALUES (
            v_postulacion_id,
            r.id_empleado_registrador,
            'RECLUTAMIENTO',
            'REGISTRO_POSTULACION',
            v_fecha_registro
        );

        INSERT INTO _reclutamiento_win_noviembre_result (
            fuente_fila,
            postulante_id,
            postulacion_id,
            inserted
        )
        VALUES (
            r.fuente_fila,
            v_postulante_id,
            v_postulacion_id,
            TRUE
        );
    END LOOP;
END $$;

DO $$
DECLARE
    v_source_count    INTEGER;
    v_result_count    INTEGER;
BEGIN
    SELECT COUNT(*) INTO v_source_count
    FROM _reclutamiento_win_noviembre_source;

    SELECT COUNT(*) INTO v_result_count
    FROM _reclutamiento_win_noviembre_result;

    IF v_source_count <> v_result_count THEN
        RAISE EXCEPTION
            'La carga WIN no procesó todas las filas: fuente %, resultado %',
            v_source_count,
            v_result_count;
    END IF;

    IF EXISTS (
        SELECT 1
        FROM _reclutamiento_win_noviembre_result r
        WHERE r.inserted
          AND NOT EXISTS (
              SELECT 1
              FROM public.postulacion p
              JOIN public.evento e
                ON e.postulacion_id = p.id
               AND e.accion = 'REGISTRO_POSTULACION'
              WHERE p.id = r.postulacion_id
          )
    ) THEN
        RAISE EXCEPTION 'Existe una postulación nueva sin evento REGISTRO_POSTULACION';
    END IF;
END $$;
