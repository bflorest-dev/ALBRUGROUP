package pe.albrugroup.rrhh_service.entity.request;

import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import pe.albrugroup.rrhh_service.entity.enums.EstadoPostulacion;

@Getter @Setter
@AllArgsConstructor @NoArgsConstructor
public class CambioEstadoPostulacionItem {

    @NotNull private Long id;
    @NotNull private EstadoPostulacion estado;
}
