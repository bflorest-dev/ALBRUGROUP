package pe.albrugroup.lead_service.entity.request;

import lombok.Getter;
import lombok.Setter;

// Corrección de identidad del contacto (teléfono + usermeta). Alcance CONTACTO: se aplica sobre la
// entidad Contacto y se sincroniza en todas sus oportunidades hermanas. El teléfono (prefijo+lead)
// está sujeto a la restricción de unicidad del contacto.
@Getter
@Setter
public class LeadIdentidadCorreccionRequest {
    private String prefijo;
    private String lead;
    private String usermeta;
}
