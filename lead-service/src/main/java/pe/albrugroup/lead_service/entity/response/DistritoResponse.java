package pe.albrugroup.lead_service.entity.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class DistritoResponse {

    private Long id;
    private String codigo;
    private String nombre;
    private Long idProvincia;
    private Long idDepartamento;
}
