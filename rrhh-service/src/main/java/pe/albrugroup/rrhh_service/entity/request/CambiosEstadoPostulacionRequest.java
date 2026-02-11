package pe.albrugroup.rrhh_service.entity.request;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotEmpty;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.util.List;

@Getter @Setter
@AllArgsConstructor @NoArgsConstructor
public class CambiosEstadoPostulacionRequest {

    @NotEmpty @Valid List<CambioEstadoPostulacionItem> cambios;
}
