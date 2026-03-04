package pe.albrugroup.lead_service.entity.response;


import lombok.*;

@Builder @Getter @Setter
@AllArgsConstructor @NoArgsConstructor
public class CampanaResponse {

    private Long id;
    private String nombre;
    private String numeroEmpresa;
    private String cuentaPublicitaria;
    private String nombreCuentaPublicitaria;
}
