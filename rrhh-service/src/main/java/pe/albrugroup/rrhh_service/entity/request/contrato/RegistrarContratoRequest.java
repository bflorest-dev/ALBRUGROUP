package pe.albrugroup.rrhh_service.entity.request.contrato;

import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.validation.constraints.*;
import lombok.*;
import pe.albrugroup.rrhh_service.entity.enums.*;

import java.math.BigDecimal;
import java.time.LocalDate;

@Builder(toBuilder = true) @Getter @Setter
@AllArgsConstructor @NoArgsConstructor
public class RegistrarContratoRequest {

    @Positive private Long idPostulacion;
    // CLASIFICACION CONTRACTUAL
    private CategoriaPersonal categoriaPersonal;

    /**
     * Campo legado para mantener compatibles los clientes actuales durante la migracion.
     * Los nuevos clientes deben enviar categoriaPersonal y asignar roles desde auth-service.
     */
    @Deprecated(forRemoval = true)
    private PuestoTrabajo puestoTrabajo;
    @NotNull private Regimen regimen;
    @NotNull private Modalidad modalidad;
    private SeguroSalud seguroSalud;
    private SistemaPensiones sistemaPensiones;
    @NotNull @DecimalMin(value = "0.00", inclusive = false)
    @Digits(integer = 10, fraction = 2)
    private BigDecimal sueldoBase;
    // VIGENCIA
    @NotNull private LocalDate fechaInicio;
    private LocalDate fechaFin;

    @AssertTrue(message = "Debe indicar categoriaPersonal; puestoTrabajo solo se admite durante la transicion")
    @JsonIgnore
    public boolean isClasificacionContractualValida() {
        if (categoriaPersonal == null && puestoTrabajo == null) {
            return false;
        }
        return categoriaPersonal == null
                || puestoTrabajo == null
                || categoriaPersonal == CategoriaPersonal.desdePuestoTrabajo(puestoTrabajo);
    }

    // TODO: Agregar campo created_at
}
