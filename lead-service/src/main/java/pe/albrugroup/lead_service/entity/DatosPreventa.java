package pe.albrugroup.lead_service.entity;


import jakarta.persistence.*;
import lombok.*;
import pe.albrugroup.lead_service.entity.enums.Parentesco;
import pe.albrugroup.lead_service.entity.enums.TipoDocumento;

import java.time.LocalDate;

@Entity @Getter @Setter @Builder
@AllArgsConstructor @NoArgsConstructor
public class DatosPreventa {

    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Enumerated(EnumType.STRING)
    private TipoDocumento tipoDocumento;
    private String numeroDocumentoTitularServicio;
    @Column(length = 6)
    private String ubigeoNacimiento; // UPDATE
    private String nombreTitularServicio;

    private String celularRegistro;
    private String celularReferencia;
    private String correo;
    private LocalDate fechaNacimiento;
    @Enumerated(EnumType.STRING)
    private Parentesco parentesco;
    private String nombreMadre;
    private String nombrePadre;

    private String numeroDocumentoTitularCelularRegistro;
    private String nombreTitularCelularRegistro;
}
