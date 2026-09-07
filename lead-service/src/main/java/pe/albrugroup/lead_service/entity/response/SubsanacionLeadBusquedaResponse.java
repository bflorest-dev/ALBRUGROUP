package pe.albrugroup.lead_service.entity.response;

import lombok.Builder;
import lombok.Getter;
import pe.albrugroup.lead_service.entity.enums.Etapa;

import java.time.Instant;

@Getter
@Builder
public class SubsanacionLeadBusquedaResponse {
    private Long idLead;
    private Long idContacto;
    private String prefijo;
    private String lead;
    private String usermeta;
    private String titular;
    private String numeroDocumento;
    private Long idEquipo;
    private Etapa etapa;
    private String campana;
    private String proveedor;
    private String plan;
    private Instant createdAt;
    private Instant lastEntryAt;
    private long oportunidadesHermanas;
    private long eventos;
    private long resumenesEtapa;
    private long calendariosPostventa;
    private long periodosPostventa;
    private long pagosPostventa;
    private long encuestasPostventa;
    private long entregasCredenciales;
    private long dispositivosEntregados;
    private boolean requiereConfirmacionContacto;
    private boolean requiereConfirmacionPostventa;
}
