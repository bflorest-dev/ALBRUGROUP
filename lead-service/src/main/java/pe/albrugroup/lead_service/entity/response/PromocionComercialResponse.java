package pe.albrugroup.lead_service.entity.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.Instant;
import java.util.List;

@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class PromocionComercialResponse {

    private Long id;
    private String reglaComercial;
    private Long idProveedor;
    private String nombreProveedor;
    private Long idZona;
    private String nombreZona;
    private List<Long> idsPlanes;
    private List<String> nombresPlanes;
    private Boolean activo;
    private Instant createdAt;
}
