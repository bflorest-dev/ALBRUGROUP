package pe.albrugroup.lead_service.entity.response;


import lombok.*;
import java.time.Instant;

@Builder @Getter @Setter
@AllArgsConstructor @NoArgsConstructor
public class CampanaResponse {

    private Long id;
    private String nombre;
    private String numeroWhatsappEmpresa;
    private Boolean activo;
    private Long idCuentaPublicitaria;
    private String numeroCuenta;
    private String nombreCuenta;
    private Long idProveedor;
    private String nombreProveedor;
    private Instant updatedAt;
}
