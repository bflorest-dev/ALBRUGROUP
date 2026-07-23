package pe.albrugroup.lead_service.entity.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Getter;
import lombok.Setter;

import java.time.LocalDate;

@Getter
@Setter
public class CredencialPlataformaRequest {

    @NotNull(message = "idPaquete es obligatorio")
    private Long idPaquete;

    @NotBlank(message = "usuario es obligatorio")
    private String usuario;

    @NotBlank(message = "password es obligatorio")
    private String password;

    @NotNull(message = "fechaCreacion es obligatoria")
    private LocalDate fechaCreacion;

    private String observacion;
}
