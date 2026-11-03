package pe.albrugroup.lead_service.entity.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;

/** Campaña disponible para configurar un equipo, con su asignación operativa actual. */
@Getter
@Builder
@AllArgsConstructor
public class EquipoCampanaResponse {

    private final Long id;
    private final String nombre;
    private final Boolean activo;
    private final Long idProveedor;
    private final String nombreProveedor;
    private final Long idEquipoAsignado;
}
