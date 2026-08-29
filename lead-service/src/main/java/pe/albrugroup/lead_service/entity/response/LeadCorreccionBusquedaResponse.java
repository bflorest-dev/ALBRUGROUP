package pe.albrugroup.lead_service.entity.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import pe.albrugroup.lead_service.entity.enums.Etapa;

import java.time.Instant;

// Fila del buscador total de la tab de correccion (ADMIN). El nombre del equipo se resuelve en el
// frontend a partir de idEquipo con su catalogo de equipos; nombreProveedor alimenta el icono.
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class LeadCorreccionBusquedaResponse {

    private Long idLead;
    private String lead;
    private String usermeta;
    private String numeroDocumento;
    private String celular;
    private String titularServicio;
    private Instant createdAt;
    private Instant lastEntryAt;
    private Etapa etapa;
    private String codigoTipificacionActual;
    private String codigoSubtipificacionActual;
    private Long idEquipo;
    private String nombreProveedor;
    // Contacto (identidad) al que pertenece el lead: permite elegirlo como destino/par en las
    // acciones de intercambiar teléfono o reubicar un lead.
    private Long idContacto;
}
