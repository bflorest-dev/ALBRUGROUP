package pe.albrugroup.call_service.entity;

import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import lombok.*;

@Entity @Getter @Setter @Builder
@AllArgsConstructor @NoArgsConstructor
public class Call {

    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

}
