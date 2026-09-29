package pe.albrugroup.lead_service.entity.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import lombok.Getter;
import lombok.Setter;
import pe.albrugroup.lead_service.entity.enums.TipoDomicilio;
import pe.albrugroup.lead_service.entity.enums.TipoVia;
import pe.albrugroup.lead_service.entity.enums.Tecnologia;

@Getter
@Setter
public class LeadDireccionRequest {

    @NotBlank(message = "ubigeoDomicilio es obligatorio")
    private String ubigeoDomicilio;
    private TipoDomicilio tipoDomicilio;
    private TipoVia tipoVia;
    private String via;

    private String direccion;
    private String referencia;

    @Pattern(regexp = "-?\\d{1,3}([\\.,]\\d+)?", message = "latitud no tiene un formato valido")
    private String latitud;

    @Pattern(regexp = "-?\\d{1,3}([\\.,]\\d+)?", message = "longitud no tiene un formato valido")
    private String longitud;
    private String urbanizacion;
    private String numero;
    private String manzana;
    private String lote;
    private String nombreEdificio;
    private String nombreCondominio;
    private String plano;
    private String piso;
    private String interior;
    private Tecnologia tecnologia;
    private Boolean esFullClaro;
    private Boolean esJalaCobertura;
    private Boolean esZonaPintada;
}
