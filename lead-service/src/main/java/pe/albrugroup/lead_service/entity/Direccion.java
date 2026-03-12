package pe.albrugroup.lead_service.entity;

import jakarta.persistence.*;
import lombok.*;
import pe.albrugroup.lead_service.entity.enums.TipoDomicilio;
import pe.albrugroup.lead_service.entity.enums.TipoVia;

@Entity @Getter @Setter @Builder
@AllArgsConstructor @NoArgsConstructor
public class Direccion {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(length = 6)
    private String ubigeo;
    @Enumerated(EnumType.STRING)
    private TipoDomicilio tipoDomicilio;
    @Enumerated(EnumType.STRING)
    private TipoVia tipoVia;
    private String via;

    private String direccion;
    private String referencia;
    private String latitud;
    private String longitud;

    // SITUACIONALES
    private String urbanizacion;
    private String numero;
    private String manzana;
    private String lote;

    private String nombreEdificio;
    private String nombreCondominio;

    private String piso;
    private String interior;
}
