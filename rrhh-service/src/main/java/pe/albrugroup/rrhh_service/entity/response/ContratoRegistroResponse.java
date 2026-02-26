package pe.albrugroup.rrhh_service.entity.response;

import lombok.*;

@Getter @Setter @Builder
@AllArgsConstructor @NoArgsConstructor
public class ContratoRegistroResponse {
    private ContratoResponse contrato;
    private CredencialesResponse credenciales;
}
