CREATE TEMP TABLE seed_tipificacion (
    etapa TEXT,
    codigo TEXT,
    descripcion TEXT,
    orden INTEGER,
    activo BOOLEAN
);

INSERT INTO seed_tipificacion (etapa, codigo, descripcion, orden, activo) VALUES
('RECLUTAMIENTO', 'SIN_CONTACTO', 'No se logra una comunicacion efectiva con el postulante', 1, TRUE),
('RECLUTAMIENTO', 'NO_INTERESADO', 'El postulante decide no continuar con la oferta laboral', 2, TRUE),
('RECLUTAMIENTO', 'INTERESADO', 'El postulante muestra interes y continua en gestion', 3, TRUE),
('RECLUTAMIENTO', 'RECHAZADO', 'El postulante es descartado durante reclutamiento', 4, TRUE),
('RECLUTAMIENTO', 'RECLUTADO', 'El postulante culmina reclutamiento y pasa a capacitacion', 5, TRUE),
('CAPACITACION', 'EN_CURSO', 'El postulante continua activo dentro del proceso de capacitacion', 1, TRUE),
('CAPACITACION', 'APROBADO', 'El postulante aprueba capacitacion y queda listo para contratacion', 2, TRUE),
('CAPACITACION', 'DESAPROBADO', 'El postulante no alcanza el resultado esperado en capacitacion', 3, TRUE),
('CAPACITACION', 'RETIRADO', 'El postulante abandona o es retirado del proceso de capacitacion', 4, TRUE);

INSERT INTO tipificacion (etapa, codigo, descripcion, orden, activo)
SELECT etapa, codigo, descripcion, orden, activo
FROM seed_tipificacion
ON CONFLICT (etapa, codigo) DO UPDATE
SET descripcion = EXCLUDED.descripcion,
    orden = EXCLUDED.orden,
    activo = EXCLUDED.activo;

CREATE TEMP TABLE seed_subtipificacion (
    etapa TEXT,
    tipificacion_codigo TEXT,
    codigo TEXT,
    descripcion TEXT,
    orden INTEGER,
    alcance TEXT,
    etapa_destino TEXT,
    estado_destino TEXT,
    estado_bandeja_destino TEXT,
    activo BOOLEAN
);

INSERT INTO seed_subtipificacion (etapa, tipificacion_codigo, codigo, descripcion, orden, alcance, etapa_destino, estado_destino, estado_bandeja_destino, activo) VALUES
('RECLUTAMIENTO', 'SIN_CONTACTO', 'NO_CONTESTA', 'Se intento contactar al postulante y no responde', 1, 'GENERAL', NULL, 'EN_PROCESO', 'SIN_CONTACTO', TRUE),
('RECLUTAMIENTO', 'SIN_CONTACTO', 'NUMERO_EQUIVOCADO', 'El numero registrado no corresponde al postulante', 2, 'GENERAL', NULL, 'EN_PROCESO', 'SIN_CONTACTO', TRUE),
('RECLUTAMIENTO', 'SIN_CONTACTO', 'FUERA_DE_SERVICIO', 'La linea se encuentra fuera de servicio', 3, 'GENERAL', NULL, 'EN_PROCESO', 'SIN_CONTACTO', TRUE),
('RECLUTAMIENTO', 'SIN_CONTACTO', 'BUZON_DE_VOZ', 'La llamada es derivada a buzon de voz', 4, 'GENERAL', NULL, 'EN_PROCESO', 'SIN_CONTACTO', TRUE),
('RECLUTAMIENTO', 'NO_INTERESADO', 'NO_DESEA_PUESTO', 'No desea continuar con el puesto ofrecido', 1, 'GENERAL', NULL, 'CERRADA', 'NO_INTERESADO', TRUE),
('RECLUTAMIENTO', 'NO_INTERESADO', 'PROBLEMAS_CON_HORARIOS', 'No puede ajustarse a los horarios del puesto', 2, 'GENERAL', NULL, 'CERRADA', 'NO_INTERESADO', TRUE),
('RECLUTAMIENTO', 'NO_INTERESADO', 'DISTANCIA_TIEMPO', 'La distancia o tiempo de traslado no le conviene', 3, 'GENERAL', NULL, 'CERRADA', 'NO_INTERESADO', TRUE),
('RECLUTAMIENTO', 'NO_INTERESADO', 'BENEFICIOS_PLANILLA', 'No esta conforme con los beneficios ofrecidos', 4, 'GENERAL', NULL, 'CERRADA', 'NO_INTERESADO', TRUE),
('RECLUTAMIENTO', 'NO_INTERESADO', 'SALARIO_BASE', 'No esta conforme con el salario base', 5, 'GENERAL', NULL, 'CERRADA', 'NO_INTERESADO', TRUE),
('RECLUTAMIENTO', 'NO_INTERESADO', 'MALA_EXPERIENCIA', 'Refiere una mala experiencia laboral previa', 6, 'GENERAL', NULL, 'CERRADA', 'NO_INTERESADO', TRUE),
('RECLUTAMIENTO', 'NO_INTERESADO', 'RUBRO_EMPRESA', 'No desea laborar en el rubro de la empresa', 7, 'GENERAL', NULL, 'CERRADA', 'NO_INTERESADO', TRUE),
('RECLUTAMIENTO', 'NO_INTERESADO', 'RECIBIO_MEJOR_PROPUESTA', 'Acepto una mejor propuesta laboral', 8, 'GENERAL', NULL, 'CERRADA', 'NO_INTERESADO', TRUE),
('RECLUTAMIENTO', 'INTERESADO', 'CONFORME_CON_LA_OFERTA', 'Esta de acuerdo con las condiciones ofrecidas', 1, 'GENERAL', NULL, 'EN_PROCESO', 'EN_GESTION', TRUE),
('RECLUTAMIENTO', 'INTERESADO', 'AGENDADO', 'Queda pendiente una nueva gestion o reunion', 2, 'GENERAL', NULL, 'EN_PROCESO', 'EN_GESTION', TRUE),
('RECLUTAMIENTO', 'INTERESADO', 'SEGUIMIENTO', 'Continua en seguimiento dentro de reclutamiento', 3, 'GENERAL', NULL, 'EN_PROCESO', 'EN_GESTION', TRUE),
('RECLUTAMIENTO', 'RECHAZADO', 'PERFIL_NO_AJUSTA', 'El perfil no se ajusta a la vacante', 1, 'GENERAL', NULL, 'CERRADA', 'RECHAZADO', TRUE),
('RECLUTAMIENTO', 'RECHAZADO', 'NO_ASISTIO_MEET', 'No asistio a la reunion programada', 2, 'GENERAL', NULL, 'CERRADA', 'RECHAZADO', TRUE),
('RECLUTAMIENTO', 'RECHAZADO', 'POCA_FLUIDEZ_VERBAL', 'No alcanza el nivel de comunicacion esperado', 3, 'ASESOR_VENTAS', NULL, 'CERRADA', 'RECHAZADO', TRUE),
('RECLUTAMIENTO', 'RECHAZADO', 'SIN_HABILIDADES_COMERCIALES', 'No demuestra habilidades comerciales suficientes', 4, 'ASESOR_VENTAS', NULL, 'CERRADA', 'RECHAZADO', TRUE),
('RECLUTAMIENTO', 'RECHAZADO', 'INEXPERIENCIA', 'La experiencia no es suficiente para el puesto', 5, 'GENERAL', NULL, 'CERRADA', 'RECHAZADO', TRUE),
('RECLUTAMIENTO', 'RECHAZADO', 'SIN_RESPUESTA_REITERADA', 'Se cierra el caso tras reiterados intentos sin respuesta', 6, 'GENERAL', NULL, 'CERRADA', 'RECHAZADO', TRUE),
('RECLUTAMIENTO', 'RECLUTADO', 'APTO_PARA_CAPACITACION', 'Cumple con el perfil y avanza a capacitacion', 1, 'GENERAL', 'CAPACITACION', 'EN_PROCESO', 'EN_GESTION', TRUE),
('CAPACITACION', 'EN_CURSO', 'ASISTENCIA_CONFIRMADA', 'El postulante confirma asistencia y continua en capacitacion', 1, 'ASESOR_VENTAS', NULL, 'EN_PROCESO', 'EN_GESTION', TRUE),
('CAPACITACION', 'EN_CURSO', 'SEGUIMIENTO_CAPACITACION', 'El postulante continua en seguimiento durante capacitacion', 2, 'ASESOR_VENTAS', NULL, 'EN_PROCESO', 'EN_GESTION', TRUE),
('CAPACITACION', 'APROBADO', 'APTO_PARA_CONTRATACION', 'El postulante cumple los criterios y pasa a contratacion', 1, 'ASESOR_VENTAS', 'CONTRATACION', 'EN_PROCESO', 'EN_GESTION', TRUE),
('CAPACITACION', 'DESAPROBADO', 'NO_PASO_ROLEPLAY', 'No alcanza el desempeno esperado en roleplay', 1, 'ASESOR_VENTAS', NULL, 'CERRADA', 'RECHAZADO', TRUE),
('CAPACITACION', 'DESAPROBADO', 'NO_CUMPLE_OBJETIVO', 'No cumple con los objetivos definidos en capacitacion', 2, 'ASESOR_VENTAS', NULL, 'CERRADA', 'RECHAZADO', TRUE),
('CAPACITACION', 'DESAPROBADO', 'NO_DESARROLLA_HABILIDADES', 'No desarrolla las habilidades comerciales requeridas', 3, 'ASESOR_VENTAS', NULL, 'CERRADA', 'RECHAZADO', TRUE),
('CAPACITACION', 'DESAPROBADO', 'FALTA_ACTITUD_COMERCIAL', 'No evidencia la actitud comercial esperada para el puesto', 4, 'ASESOR_VENTAS', NULL, 'CERRADA', 'RECHAZADO', TRUE),
('CAPACITACION', 'DESAPROBADO', 'PROBLEMAS_TRABAJO_EN_EQUIPO', 'Presenta dificultades relevantes para trabajar en equipo', 5, 'ASESOR_VENTAS', NULL, 'CERRADA', 'RECHAZADO', TRUE),
('CAPACITACION', 'DESAPROBADO', 'RESULTADOS_INSUFICIENTES_EVALUACIONES', 'Obtiene resultados insuficientes en las evaluaciones de capacitacion', 6, 'ASESOR_VENTAS', NULL, 'CERRADA', 'RECHAZADO', TRUE),
('CAPACITACION', 'RETIRADO', 'RETIRO_VOLUNTARIO', 'El postulante decide no continuar con la capacitacion', 1, 'ASESOR_VENTAS', NULL, 'CERRADA', 'NO_INTERESADO', TRUE),
('CAPACITACION', 'RETIRADO', 'INASISTENCIA_REITERADA', 'El postulante acumula inasistencias y se retira del proceso', 2, 'ASESOR_VENTAS', NULL, 'CERRADA', 'RECHAZADO', TRUE);

INSERT INTO subtipificacion (
    tipificacion_id,
    codigo,
    descripcion,
    orden,
    alcance,
    etapa_destino,
    estado_destino,
    estado_bandeja_destino,
    activo
)
SELECT
    t.id,
    s.codigo,
    s.descripcion,
    s.orden,
    s.alcance,
    s.etapa_destino,
    s.estado_destino,
    s.estado_bandeja_destino,
    s.activo
FROM seed_subtipificacion s
JOIN tipificacion t
  ON t.etapa = s.etapa
 AND t.codigo = s.tipificacion_codigo
ON CONFLICT (tipificacion_id, codigo) DO UPDATE
SET descripcion = EXCLUDED.descripcion,
    orden = EXCLUDED.orden,
    alcance = EXCLUDED.alcance,
    etapa_destino = EXCLUDED.etapa_destino,
    estado_destino = EXCLUDED.estado_destino,
    estado_bandeja_destino = EXCLUDED.estado_bandeja_destino,
    activo = EXCLUDED.activo;
