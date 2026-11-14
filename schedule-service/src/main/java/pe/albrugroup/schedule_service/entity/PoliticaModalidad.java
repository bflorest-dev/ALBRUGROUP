package pe.albrugroup.schedule_service.entity;

import jakarta.persistence.*;
import lombok.*;
import pe.albrugroup.schedule_service.entity.enums.ModalidadContrato;

@Entity @Getter @Setter @Builder
@NoArgsConstructor @AllArgsConstructor
@Table(name = "politica_modalidad")
public class PoliticaModalidad {

    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, unique = true)
    private ModalidadContrato modalidad;
    @Column(nullable = false)
    private Integer horasObjetivoSemanal;
    @Column(nullable = false)
    private Integer horasObjetivoMensual;
    @Column(nullable = false)
    private Integer minutosAlmuerzo;
    @Column(nullable = false)
    private Integer minutosServicios;
    /** Horas operativas netas que la modalidad exige por dia laborable (sin almuerzo), en minutos.
     *  PART=240, SEMI=360, FULL=480, SUPER=600. Base del calculo de Horas Objetivo (concepto 1). */
    @Column(nullable = false)
    private Integer minutosOperativosDia;
}
