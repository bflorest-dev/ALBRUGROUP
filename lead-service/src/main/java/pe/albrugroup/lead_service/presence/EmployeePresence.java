package pe.albrugroup.lead_service.presence;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.Instant;
import java.util.List;

@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class EmployeePresence {

    private Long empleadoId;
    private String username;
    private String nombreCompleto;
    private List<String> roles;
    private String status;
    private Instant lastSeen;
}
