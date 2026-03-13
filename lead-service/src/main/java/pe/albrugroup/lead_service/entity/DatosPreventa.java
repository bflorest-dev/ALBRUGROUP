package pe.albrugroup.lead_service.entity;


import jakarta.persistence.*;
import lombok.*;
import pe.albrugroup.lead_service.entity.enums.TipoDocumento;

@Entity @Getter @Setter @Builder
@AllArgsConstructor @NoArgsConstructor
public class DatosPreventa {

    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Enumerated(EnumType.STRING)
    private TipoDocumento tipoDocumento;
    private String dniTitularServicio;
    private String nombreTitularServicio;

    private String celularRegistro;
    private String celularReferencia;
    private String correo;

    private String dniTitularCelularRegistro;
    private String nombreTitularCelularRegistro;
}
