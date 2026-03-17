package pe.albrugroup.lead_service.entity.request;

import lombok.Getter;
import lombok.Setter;
import pe.albrugroup.lead_service.entity.enums.TipoDocumento;

@Getter
@Setter
public class LeadDatosPreventaRequest {

    private TipoDocumento tipoDocumento;
    private String numeroDocumentoTitularServicio;
    private String nombreTitularServicio;
    private String celularRegistro;
    private String celularReferencia;
    private String correo;
    private String numeroDocumentoTitularCelularRegistro;
    private String nombreTitularCelularRegistro;
}
