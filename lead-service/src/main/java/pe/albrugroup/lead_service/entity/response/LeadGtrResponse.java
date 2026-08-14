package pe.albrugroup.lead_service.entity.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import pe.albrugroup.lead_service.entity.enums.Base;
import pe.albrugroup.lead_service.entity.enums.EstadoSeguimiento;
import pe.albrugroup.lead_service.entity.enums.Etapa;

import java.time.Instant;

@Getter @Setter @Builder
@NoArgsConstructor @AllArgsConstructor
public class LeadGtrResponse {

    private Long id;
    private Long idEquipo;
    private Instant createdAt;
    private Instant lastEntryAt;
    private String prefijo;
    private String lead;
    private String usermeta;
    private String nombreCampana;
    private String nombreProveedorCampana;
    private String nombreProveedorEquipo;
    private String numeroWhatsappEmpresa;
    private Base base;
    private String nombreTitular;
    private String numeroDocumentoTitularServicio;
    private String direccionSnapshot;
    private String primeraCodigoTipificacion;
    private String primeraCodigoSubtipificacion;
    private String mayorRangoCodigoTipificacion;
    private String mayorRangoCodigoSubtipificacion;
    private String codigoTipificacion;
    private String codigoSubtipificacion;
    private String nombrePlanOfrecido;
    private String nombreAsesorAsignado;
    private EstadoSeguimiento estadoSeguimiento;
    private long totalAsignaciones;
    private long totalAsignacionesPreventa;
    private long totalAsignacionesHoyPreventa;
    private boolean tieneAlertaRegistrosDia;
    private boolean tieneMultiplesRegistrosDia;
    private boolean tieneRegistrosMismaCampanaDia;
    // Etapa real del lead. En la bandeja diaria casi siempre es PREVENTA; cuando es otra,
    // se trata de una atención GTR de un lead que sigue gestionándose en esa etapa.
    private Etapa etapa;
}
