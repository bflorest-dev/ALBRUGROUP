package pe.albrugroup.lead_service.entity.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.*;

@Builder
@Getter
@Setter
@AllArgsConstructor
@NoArgsConstructor
public class TelevisionRequest {

    @NotBlank
    private String nombre;

    @NotNull
    private Integer cantidadCanales;
}
