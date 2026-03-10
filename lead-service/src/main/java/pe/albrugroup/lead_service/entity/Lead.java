package pe.albrugroup.lead_service.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import pe.albrugroup.lead_service.entity.enums.EstadoSeguimiento;
import pe.albrugroup.lead_service.entity.enums.Etapa;

@Entity @Getter @Setter
@AllArgsConstructor @NoArgsConstructor
public class Lead {

    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Enumerated(EnumType.STRING)
    private Etapa etapa;
    @Enumerated(EnumType.STRING)
    private EstadoSeguimiento estado;

    private Long idTipificacion;
    private String codigoTipificacion;

    private Long idSubtipificacion;
    private String codigoSubtipificacion;

    @Column(length = 6)
    private String ubigeo;
}

