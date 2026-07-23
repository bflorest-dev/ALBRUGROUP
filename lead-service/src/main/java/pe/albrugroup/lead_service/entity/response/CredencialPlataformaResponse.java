package pe.albrugroup.lead_service.entity.response;

import lombok.Builder;
import lombok.Getter;
import lombok.Setter;
import pe.albrugroup.lead_service.entity.enums.EstadoCredencialPlataforma;

import java.time.Instant;
import java.time.LocalDate;

@Getter
@Setter
@Builder
public class CredencialPlataformaResponse {

    private Long id;
    private Long idPaquete;
    private String paquete;
    private Long idPlataforma;
    private String plataforma;
    private String usuario;
    private String password;
    private LocalDate fechaCreacion;
    private LocalDate fechaExpiracion;
    private EstadoCredencialPlataforma estado;
    private Integer cuposTotales;
    private Long cuposUsados;
    private Integer cuposDisponibles;
    private String observacion;
    private Instant createdAt;
    private Instant updatedAt;
}
