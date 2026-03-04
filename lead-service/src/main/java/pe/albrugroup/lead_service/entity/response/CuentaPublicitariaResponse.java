package pe.albrugroup.lead_service.entity.response;

import lombok.*;

@Builder @Getter @Setter
@AllArgsConstructor @NoArgsConstructor
public class CuentaPublicitariaResponse {

    private Long id;
    private String numeroCuenta;
    private String nombreCuenta;
    private Boolean activo;
}
