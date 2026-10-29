package pe.albrugroup.recruitment_service.entity.request;
import jakarta.validation.constraints.*;
import pe.albrugroup.recruitment_service.entity.enums.ModalidadContacto;
import java.time.LocalDate;
import java.time.LocalDateTime;
public record GestionReclutamientoRequest(
 @NotBlank String accion,
 @NotNull @PositiveOrZero Long revision,
 @NotNull LocalDateTime fechaHoraGestion,
 @NotNull ModalidadContacto modalidadContacto,
 @Size(max=2000) String observacion,
 @Size(max=100) String motivo,
 LocalDateTime fechaHoraActividad,
 ModalidadContacto modalidadActividad,
 @Size(max=500) String referencia,
 @Positive Long idGrupoCapacitacion,
 LocalDate fechaMeet,
 @Positive Long idHorarioMeet,
 @Positive Long idSesionMeet
) {}
