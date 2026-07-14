package pe.albrugroup.lead_service.entity.response;

import lombok.AllArgsConstructor;
import lombok.Getter;

@Getter
@AllArgsConstructor
public class MisPreventasResumenResponse {

    private long cerradas;
    private long instaladas;
    private long rechazadas;
}
