package pe.albrugroup.lead_service.entity.response;

import lombok.*;
import pe.albrugroup.lead_service.entity.enums.CampoConfigurable;

/**
 * Configuración resuelta de un campo de captura para un equipo: si se muestra y si es obligatorio.
 * Es el contrato que consumirán el modal del asesor (Fase 2) y la pantalla de administración (Fase 3).
 */
@Getter @Setter @Builder
@AllArgsConstructor @NoArgsConstructor
public class CampoConfigResponse {

    private CampoConfigurable campo;
    private CampoConfigurable.Tab tab;
    private String descripcion;
    private boolean visible;
    private boolean requerido;
}
