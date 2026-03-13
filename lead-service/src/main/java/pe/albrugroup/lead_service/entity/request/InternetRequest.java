package pe.albrugroup.lead_service.entity.request;

import jakarta.validation.constraints.NotNull;
import lombok.*;
import pe.albrugroup.lead_service.entity.enums.Tecnologia;
import pe.albrugroup.lead_service.entity.enums.Unidad;

@Builder
@Getter
@Setter
@AllArgsConstructor
@NoArgsConstructor
public class InternetRequest {

    @NotNull
    private Integer velocidad;

    @NotNull
    private Unidad unidad;

    @NotNull
    private Tecnologia tecnologia;
}
