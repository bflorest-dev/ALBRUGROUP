package pe.albrugroup.lead_service.entity;

import jakarta.persistence.*;
import lombok.*;
import pe.albrugroup.lead_service.entity.enums.TipoUrbanizacion;
import pe.albrugroup.lead_service.entity.enums.TipoVia;

@Entity @Getter @Setter @Builder
@AllArgsConstructor @NoArgsConstructor
public class Direccion {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(length = 6)
    private String ubigeoDomicilio;
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "id_tipo_domicilio")
    private TipoDomicilio tipoDomicilio;
    @Enumerated(EnumType.STRING)
    private TipoVia tipoVia;
    private String via;

    private String direccion;
    private String referencia;
    @Column(length = 64)
    private String latitud;
    @Column(length = 64)
    private String longitud;

    // SITUACIONALES
    @Enumerated(EnumType.STRING)
    @Column(length = 50)
    private TipoUrbanizacion tipoUrbanizacion;
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
