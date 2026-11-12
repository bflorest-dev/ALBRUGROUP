package pe.albrugroup.lead_service.entity.enums;

import lombok.Getter;

@Getter
public enum AnclaFechaBuscador {
    CREATED_AT("l.createdAt", ColumnaUniversal.Fuente.LEAD),
    LAST_ENTRY_AT("l.lastEntryAt", ColumnaUniversal.Fuente.LEAD),
    FECHA_INSTALACION("seg.fechaInstalacion", ColumnaUniversal.Fuente.SEGUIMIENTO),
    FECHA_PROGRAMACION("seg.fechaProgramacion", ColumnaUniversal.Fuente.SEGUIMIENTO),
    FECHA_GRABACION("seg.fechaGrabacion", ColumnaUniversal.Fuente.SEGUIMIENTO),
    FECHA_REGISTRO_CRM("seg.fechaRegistroCrm", ColumnaUniversal.Fuente.SEGUIMIENTO);

    private final String jpql;
    private final ColumnaUniversal.Fuente fuente;

    AnclaFechaBuscador(String jpql, ColumnaUniversal.Fuente fuente) {
        this.jpql = jpql;
        this.fuente = fuente;
    }
}
