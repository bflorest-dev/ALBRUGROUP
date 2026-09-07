package pe.albrugroup.lead_service.entity.request;

import jakarta.validation.Valid;
import jakarta.validation.constraints.*;
import lombok.Getter;
import lombok.Setter;
import pe.albrugroup.lead_service.entity.enums.Base;
import pe.albrugroup.lead_service.entity.enums.ModoSubsanacion;

import java.time.LocalDate;
import java.util.UUID;

@Getter
@Setter
public class SubsanacionRequest {

    @NotNull
    private UUID requestId;

    @NotNull
    private ModoSubsanacion modo;

    private Long idLead;

    @NotBlank
    @Pattern(regexp = "^\\+\\d{1,3}$", message = "El prefijo debe tener formato +1, +51 o similar")
    private String prefijo;

    @NotBlank
    @Pattern(regexp = "^\\d{6,15}$", message = "El lead debe contener solo digitos")
    private String lead;

    private String usermeta;

    @NotNull
    @Positive
    private Long idEquipo;

    @NotNull
    @Positive
    private Long idCampana;

    @NotNull
    @Positive
    private Long idPlan;

    @NotNull
    private Base base;

    @Valid
    @NotNull
    private LeadDatosPreventaRequest datosPreventa;

    @Valid
    @NotNull
    private LeadDireccionRequest direccion;

    @NotBlank
    private String codigoTipificacionPreventa;

    @NotBlank
    private String codigoSubtipificacionPreventa;

    @NotBlank
    private String codigoTipificacionVenta;

    @NotBlank
    private String codigoSubtipificacionVenta;

    private String sec;
    private String sot;
    private String customerId;

    @NotNull
    private LocalDate fechaGestion;

    @NotNull
    private LocalDate fechaInstalacion;

    @NotBlank
    @Size(max = 1000)
    private String motivo;

    private boolean confirmarRecreacionPostventa;
    private boolean confirmarImpactoContacto;
}
