package pe.albrugroup.lead_service.entity.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;

import java.util.List;

/** Campañas activas de un proveedor y los equipos del usuario que pueden administrarlas. */
@Getter
@Builder
@AllArgsConstructor
public class ProveedorCampanasEquipoResponse {

    private final Long idProveedor;
    private final String nombreProveedor;
    private final List<Long> equipoIds;
    private final List<EquipoCampanaResponse> campanas;
}
