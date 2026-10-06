ALTER TABLE usuarios
    ADD COLUMN IF NOT EXISTS fecha_ingreso_empleado DATE;

CREATE INDEX IF NOT EXISTS idx_usuarios_fecha_ingreso_empleado
    ON usuarios (fecha_ingreso_empleado);
