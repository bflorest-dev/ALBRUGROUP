package pe.albrugroup.lead_service.entity.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.util.List;

@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ServiciosProveedorResponse {

    private Long idProveedor;
    private String nombreProveedor;
    private List<InternetResponse> internets;
    private List<TelevisionResponse> televisiones;
    private List<TelefonoResponse> telefonos;
}
