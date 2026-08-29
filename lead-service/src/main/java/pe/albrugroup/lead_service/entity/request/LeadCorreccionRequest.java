package pe.albrugroup.lead_service.entity.request;

import jakarta.validation.Valid;
import lombok.Getter;
import lombok.Setter;

import java.util.List;

// Payload de una gestion completa de correccion (submit atomico). Cada bloque es opcional: solo se
// envia el que cambio. `idsEventosAEliminar` son los eventos marcados para borrar en el historial.
// `resumenCambios` es el texto legible que arma el frontend y queda como comentario del evento
// CORRECCION. Todo se aplica en una sola transaccion.
@Getter
@Setter
public class LeadCorreccionRequest {

    // Identidad del contacto (teléfono + usermeta). Alcance CONTACTO: sincroniza a las hermanas.
    @Valid
    private LeadIdentidadCorreccionRequest identidad;

    @Valid
    private LeadDatosPreventaRequest datosPreventa;

    @Valid
    private LeadDireccionRequest direccion;

    @Valid
    private LeadOfertaComercialRequest ofertaComercial;

    private List<Long> idsEventosAEliminar;

    private String motivo;

    private String resumenCambios;
}
