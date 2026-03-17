package pe.albrugroup.lead_service.entity.request;

import lombok.Getter;
import lombok.Setter;
import pe.albrugroup.lead_service.entity.enums.TipoDomicilio;
import pe.albrugroup.lead_service.entity.enums.TipoVia;

import java.math.BigDecimal;

@Getter
@Setter
public class LeadDireccionRequest {

    private String ubigeo;
    private TipoDomicilio tipoDomicilio;
    private TipoVia tipoVia;
    private String via;
    private String direccion;
    private String referencia;
    private BigDecimal latitud;
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
