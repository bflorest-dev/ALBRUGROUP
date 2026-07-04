package pe.albrugroup.lead_service.entity.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;
import lombok.Getter;
import lombok.Setter;
import pe.albrugroup.lead_service.entity.enums.TipoDomicilio;
import pe.albrugroup.lead_service.entity.enums.TipoVia;

@Getter
@Setter
public class LeadDireccionRequest {

    @NotBlank(message = "ubigeoDomicilio es obligatorio")
    private String ubigeoDomicilio;
    private TipoDomicilio tipoDomicilio;
    private TipoVia tipoVia;
    private String via;

    @NotBlank(message = "direccion es obligatoria")
    private String direccion;
    private String referencia;

    @NotBlank(message = "latitud es obligatoria")
    @Size(max = 64, message = "latitud no debe superar 64 caracteres")
    @Pattern(regexp = "-?\\d{1,3}([\\.,]\\d+)?", message = "latitud no tiene un formato valido")
    private String latitud;

    @NotBlank(message = "longitud es obligatoria")
    @Size(max = 64, message = "longitud no debe superar 64 caracteres")
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
}
