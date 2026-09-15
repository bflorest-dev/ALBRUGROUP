package pe.albrugroup.lead_service.entity.request;

import jakarta.validation.Valid;
import jakarta.validation.constraints.*;
import lombok.Getter;
import lombok.Setter;

import java.util.UUID;

@Getter
@Setter
public class FreelanceVentaCrearRequest {

    @NotNull
    private UUID requestId;

    @NotBlank
    @Pattern(regexp = "^\\+\\d{1,3}$", message = "El prefijo debe tener formato +1, +51 o similar")
    private String prefijo;

    @NotBlank
    @Pattern(regexp = "^\\d{6,15}$", message = "El lead debe contener solo digitos")
    private String lead;

    private String usermeta;

    @NotNull
    @Positive
    private Long idPlan;

    @Valid
    @NotNull
    private LeadDatosPreventaRequest datosPreventa;

    @Valid
    @NotNull
    private LeadDireccionRequest direccion;
}
