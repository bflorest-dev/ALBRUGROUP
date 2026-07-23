package pe.albrugroup.lead_service.entity.response;

import lombok.Builder;
import lombok.Getter;
import lombok.Setter;
import pe.albrugroup.lead_service.entity.enums.TipoDispositivo;

@Getter
@Setter
@Builder
public class EntregaCredencialDispositivoResponse {

    private Long id;
    private TipoDispositivo tipoDispositivo;
    private Long idMarcaDispositivo;
    private String marcaDispositivo;
    private String descripcion;
}
