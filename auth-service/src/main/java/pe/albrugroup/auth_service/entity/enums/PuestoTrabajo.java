package pe.albrugroup.auth_service.entity.enums;

import lombok.AllArgsConstructor;
import lombok.Getter;

@AllArgsConstructor @Getter
public enum PuestoTrabajo {
    ADMINISTRADOR("admin"),
    RECLUTADOR("recruiter"),
    RRHH("rrhh"),
    CAPACITADOR("trainer"),

    DESARROLLADOR("developer"),
    CONTADOR("accountant"),
    COMMUNITY("community"),
    MONITOR("monitor"),
    SUPERVISOR_VENTAS("supsales"),
    ASESOR_VENTAS("sales"),
    SUPERVISOR_BACKOFFICE("supback"),
    ASESOR_BACKOFFICE("back"),
    SUPERVISOR_GTR("supgtr"),
    ASESOR_GTR("gtr"),
    SUPERVISOR_POSTVENTA("suppost"),
    ASESOR_POSTVENTA("post");

    private final String englishName;
}
