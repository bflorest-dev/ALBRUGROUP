package pe.albrugroup.rrhh_service.entity.enums;

public enum CategoriaPersonal {
    ESTRUCTURAL,
    OPERATIVO;

    public static CategoriaPersonal desdePuestoTrabajo(PuestoTrabajo puestoTrabajo) {
        if (puestoTrabajo == null) {
            return null;
        }

        return switch (puestoTrabajo) {
            case ADMINISTRADOR, RRHH, RECLUTADOR, CAPACITADOR, DESARROLLADOR, CONTADOR -> ESTRUCTURAL;
            case COMMUNITY, MONITOR, SUPERVISOR_VENTAS, ASESOR_VENTAS, OJT,
                 SUPERVISOR_BACKOFFICE, ASESOR_BACKOFFICE, SUPERVISOR_GTR, ASESOR_GTR,
                 FREELANCE, SUPERVISOR_POSTVENTA, ASESOR_POSTVENTA, ASESOR_COBRANZA -> OPERATIVO;
        };
    }
}
