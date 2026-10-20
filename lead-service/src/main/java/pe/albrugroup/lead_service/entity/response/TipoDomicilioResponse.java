package pe.albrugroup.lead_service.entity.response;

import lombok.*;

@Getter @Setter @Builder
@NoArgsConstructor @AllArgsConstructor
public class TipoDomicilioResponse {

    private Long id;
    private String nombre;
    private boolean esVertical;
}
