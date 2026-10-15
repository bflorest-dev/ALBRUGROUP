-- Asigna los planes existentes de WIN y CLARO a su zona LIMA correspondiente.
-- La búsqueda es por nombre normalizado y por la relación proveedor-zona,
-- evitando depender de IDs distintos entre ambientes.
DO $$
DECLARE
    esperado RECORD;
    proveedor_id BIGINT;
    zona_id BIGINT;
    coincidencias INTEGER;
BEGIN
    FOR esperado IN
        SELECT 'WIN'::TEXT AS proveedor_nombre
        UNION ALL
        SELECT 'CLARO'::TEXT AS proveedor_nombre
    LOOP
        SELECT COUNT(*) INTO coincidencias
        FROM proveedor
        WHERE UPPER(TRIM(nombre)) = esperado.proveedor_nombre;

        IF coincidencias <> 1 THEN
            RAISE EXCEPTION
                'Backfill de planes detenido: se esperaba exactamente un proveedor %, se encontraron %',
                esperado.proveedor_nombre,
                coincidencias;
        END IF;

        SELECT id INTO proveedor_id
        FROM proveedor
        WHERE UPPER(TRIM(nombre)) = esperado.proveedor_nombre;

        SELECT COUNT(*) INTO coincidencias
        FROM zona
        WHERE id_proveedor = proveedor_id
          AND UPPER(TRIM(nombre)) = 'LIMA';

        IF coincidencias <> 1 THEN
            RAISE EXCEPTION
                'Backfill de planes detenido: el proveedor % debe tener exactamente una zona LIMA, se encontraron %',
                esperado.proveedor_nombre,
                coincidencias;
        END IF;

        SELECT id INTO zona_id
        FROM zona
        WHERE id_proveedor = proveedor_id
          AND UPPER(TRIM(nombre)) = 'LIMA';

        UPDATE plan
        SET id_zona = zona_id
        WHERE id_proveedor = proveedor_id;
    END LOOP;

    IF EXISTS (
        SELECT 1
        FROM plan p
        JOIN proveedor pr ON pr.id = p.id_proveedor
        LEFT JOIN zona z ON z.id = p.id_zona
        WHERE UPPER(TRIM(pr.nombre)) IN ('WIN', 'CLARO')
          AND (
              p.id_zona IS NULL
              OR z.id_proveedor IS DISTINCT FROM p.id_proveedor
              OR UPPER(TRIM(z.nombre)) IS DISTINCT FROM 'LIMA'
          )
    ) THEN
        RAISE EXCEPTION
            'Backfill incompleto: existe al menos un plan WIN/CLARO sin la zona LIMA de su proveedor';
    END IF;
END $$;
