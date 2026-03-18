package pe.albrugroup.lead_service.entity.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Getter;
import lombok.Setter;
import pe.albrugroup.lead_service.entity.enums.TipoDomicilio;
import pe.albrugroup.lead_service.entity.enums.TipoVia;

import java.math.BigDecimal;

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

    @NotNull(message = "latitud es obligatoria")
    private BigDecimal latitud;

    @NotNull(message = "longitud es obligatoria")
    private BigDecimal longitud;
    private String urbanizacion;
    private String numero;
    private String manzana;
    private String lote;
    private String nombreEdificio;
    private String nombreCondominio;
    private String piso;
    private String interior;
}
