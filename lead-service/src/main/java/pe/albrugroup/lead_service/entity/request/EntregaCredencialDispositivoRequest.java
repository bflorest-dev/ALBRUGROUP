package pe.albrugroup.lead_service.entity.request;

import lombok.Getter;
import lombok.Setter;
import pe.albrugroup.lead_service.entity.enums.TipoDispositivo;

@Getter
@Setter
public class EntregaCredencialDispositivoRequest {

    private TipoDispositivo tipoDispositivo;
    private Long idMarcaDispositivo;
    private String marcaDispositivo;
    private String descripcion;
}
