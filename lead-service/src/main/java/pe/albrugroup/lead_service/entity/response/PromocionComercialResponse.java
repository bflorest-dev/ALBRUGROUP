package pe.albrugroup.lead_service.entity.response;

import lombok.*;
import pe.albrugroup.lead_service.entity.enums.Etapa;

import java.time.Instant;
import java.util.List;

@Getter @Setter @Builder
@NoArgsConstructor @AllArgsConstructor
public class PromocionComercialResponse {

    private Long id;
    private String reglaComercial;
    private Etapa etapa;
    private Long idProveedor;
    private String nombreProveedor;
    private List<Long> idsZonas;
    private List<String> nombresZonas;
    private List<Long> idsPlanes;
    private List<String> nombresPlanes;
    private List<CashbackPeriodoResponse> cashbackPeriodos;
    private Boolean activo;
    private Instant createdAt;
}
