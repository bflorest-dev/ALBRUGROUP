CREATE TABLE presencia_tramo (
    id                      BIGSERIAL    PRIMARY KEY,
    id_empleado             BIGINT       NOT NULL,
    fecha                   DATE         NOT NULL,
    inicio                  TIMESTAMP    NOT NULL,
    fin                     TIMESTAMP,
    origen_inicio           VARCHAR(30)  NOT NULL,
    origen_fin              VARCHAR(30),
    estado_al_desconectar   VARCHAR(30),
    created_at              TIMESTAMP    NOT NULL DEFAULT now()
);

CREATE INDEX idx_presencia_tramo_empleado_fecha ON presencia_tramo (id_empleado, fecha);
