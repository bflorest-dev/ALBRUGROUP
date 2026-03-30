package pe.albrugroup.lead_service.entity.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import pe.albrugroup.lead_service.entity.enums.Tecnologia;
import pe.albrugroup.lead_service.entity.enums.Unidad;

@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class InternetResponse {

    private Long id;
    private Integer velocidad;
    private Unidad unidad;
    private Tecnologia tecnologia;
}
