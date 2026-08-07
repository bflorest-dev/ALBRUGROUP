package pe.albrugroup.lead_service.entity.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import pe.albrugroup.lead_service.entity.enums.TipoNumeroLlamada;

@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class NumeroLlamadaResponse {

    private TipoNumeroLlamada tipo;
    private String label;
    private String numero;
    private int prioridad;
}
