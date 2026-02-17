package pe.albrugroup.auth_service.entity.enums;

import lombok.AllArgsConstructor;
import lombok.Getter;

@AllArgsConstructor @Getter
public enum PuestoTrabajo {
    ADMINISTRADOR("admin"),
    RECLUTADOR("recruiter"),
    RRHH("rrhh"),
    CAPACITADOR("trainer");

    private final String englishName;
}
