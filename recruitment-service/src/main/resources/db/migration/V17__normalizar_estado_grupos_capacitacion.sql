-- V17: normaliza el ciclo de vida de grupos con la fecha calendario de America/Lima.

DO $$
BEGIN
    IF EXISTS (
        SELECT 1
        FROM grupo_capacitacion
        WHERE fecha_inicio IS NULL
           OR fecha_fin IS NULL
           OR fecha_fin < fecha_inicio
    ) THEN
        RAISE EXCEPTION 'No se puede normalizar grupos de capacitacion sin fechas validas o con fecha_fin anterior a fecha_inicio';
    END IF;
END $$;

UPDATE grupo_capacitacion
SET estado = 'CERRADO'
WHERE estado IN ('ABIERTO', 'EN_CURSO')
  AND fecha_fin < ((CURRENT_TIMESTAMP AT TIME ZONE 'America/Lima')::date);

UPDATE grupo_capacitacion
SET estado = 'EN_CURSO'
WHERE estado = 'ABIERTO'
  AND fecha_inicio <= ((CURRENT_TIMESTAMP AT TIME ZONE 'America/Lima')::date)
  AND fecha_fin >= ((CURRENT_TIMESTAMP AT TIME ZONE 'America/Lima')::date);
