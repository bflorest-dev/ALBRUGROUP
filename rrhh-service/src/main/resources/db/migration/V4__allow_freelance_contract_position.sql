ALTER TABLE contrato
    DROP CONSTRAINT IF EXISTS contrato_puesto_trabajo_check;

ALTER TABLE contrato
    ADD CONSTRAINT contrato_puesto_trabajo_check
    CHECK (
        puesto_trabajo IS NULL OR
        puesto_trabajo IN (
            'ADMINISTRADOR', 'RRHH', 'RECLUTADOR', 'CAPACITADOR', 'DESARROLLADOR',
            'CONTADOR', 'COMMUNITY', 'MONITOR', 'SUPERVISOR_VENTAS', 'ASESOR_VENTAS',
            'OJT', 'SUPERVISOR_BACKOFFICE', 'ASESOR_BACKOFFICE', 'SUPERVISOR_GTR',
            'ASESOR_GTR', 'FREELANCE', 'SUPERVISOR_POSTVENTA', 'ASESOR_POSTVENTA',
            'ASESOR_COBRANZA'
        )
    );
