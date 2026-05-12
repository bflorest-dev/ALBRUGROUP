package pe.albrugroup.lead_service.entity.request;

import jakarta.validation.constraints.AssertTrue;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class LeadSnapshotsRequest {

    private String numeroDocumentoTitularServicio;
    private String direccion;

    @AssertTrue(message = "Debe enviar numeroDocumentoTitularServicio o direccion")
    public boolean isSnapshotPresent() {
        return hasText(numeroDocumentoTitularServicio) || hasText(direccion);
    }

    private boolean hasText(String value) {
        return value != null && !value.isBlank();
    }
}
