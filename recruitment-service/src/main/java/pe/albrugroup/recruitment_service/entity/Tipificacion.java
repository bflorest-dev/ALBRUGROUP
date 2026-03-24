package pe.albrugroup.recruitment_service.entity;

import jakarta.persistence.*;
import lombok.*;
import pe.albrugroup.recruitment_service.entity.enums.Etapa;

@Entity @Getter @Setter @Builder
@AllArgsConstructor @NoArgsConstructor
public class Tipificacion {

    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Enumerated(EnumType.STRING)
    private Etapa etapa;
}
