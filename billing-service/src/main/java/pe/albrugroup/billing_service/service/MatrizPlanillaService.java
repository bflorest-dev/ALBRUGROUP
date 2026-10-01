package pe.albrugroup.billing_service.service;

import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import pe.albrugroup.billing_service.entity.MatrizCalculoPlanilla;
import pe.albrugroup.billing_service.entity.MatrizModalidadPlanilla;
import pe.albrugroup.billing_service.entity.MatrizTardanzaPlanilla;
import pe.albrugroup.billing_service.entity.enums.ModalidadTrabajo;
import pe.albrugroup.billing_service.entity.request.MatrizPlanillaRequest;
import pe.albrugroup.billing_service.entity.response.MatrizPlanillaResponse;
import pe.albrugroup.billing_service.exception.BillingException;
import pe.albrugroup.billing_service.repository.MatrizCalculoPlanillaRepository;

import java.util.Comparator;
import java.util.EnumSet;
import java.util.Set;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class MatrizPlanillaService {

    private final MatrizCalculoPlanillaRepository matrizRepository;

    @Transactional(readOnly = true)
    public MatrizCalculoPlanilla obtenerActiva() {
        return matrizRepository.findByActivaTrue()
                .orElseThrow(() -> new BillingException(HttpStatus.INTERNAL_SERVER_ERROR, "No existe matriz de planilla activa"));
    }

    @Transactional(readOnly = true)
    public MatrizPlanillaResponse obtenerActivaResponse() {
        return toResponse(obtenerActiva());
    }

    @Transactional
    public MatrizPlanillaResponse crearNuevaVersion(MatrizPlanillaRequest request) {
        validarRequest(request);
        matrizRepository.findByActivaTrue().ifPresent(actual -> {
            actual.setActiva(false);
            matrizRepository.saveAndFlush(actual);
        });

        int siguienteVersion = matrizRepository.findTopByOrderByVersionDesc()
                .map(matriz -> matriz.getVersion() + 1)
                .orElse(1);
        MatrizCalculoPlanilla matriz = MatrizCalculoPlanilla.builder()
                .version(siguienteVersion)
                .activa(true)
                .bonoCapacitacion(PlanillaPolicyService.money(request.bonoCapacitacion()))
                .comentario(request.comentario())
                .creadoPor("SYSTEM")
                .build();
        request.modalidades().forEach(item -> matriz.getModalidades().add(MatrizModalidadPlanilla.builder()
                .matrizCalculo(matriz)
                .modalidad(item.modalidad())
                .horasDia(item.horasDia())
                .bonoPuntualidad(PlanillaPolicyService.money(item.bonoPuntualidad()))
                .ventasMinimasProductividad(item.ventasMinimasProductividad())
                .bonoProductividad(PlanillaPolicyService.money(item.bonoProductividad()))
                .build()));
        request.tardanzas().forEach(item -> matriz.getTardanzas().add(MatrizTardanzaPlanilla.builder()
                .matrizCalculo(matriz)
                .minutosDesde(item.minutosDesde())
                .minutosHasta(item.minutosHasta())
                .montoDescuento(PlanillaPolicyService.money(item.montoDescuento()))
                .build()));
        return toResponse(matrizRepository.save(matriz));
    }

    public MatrizPlanillaResponse toResponse(MatrizCalculoPlanilla matriz) {
        return new MatrizPlanillaResponse(
                matriz.getId(),
                matriz.getVersion(),
                matriz.isActiva(),
                matriz.getBonoCapacitacion(),
                matriz.getComentario(),
                matriz.getCreadoPor(),
                matriz.getCreadoAt(),
                matriz.getModalidades().stream()
                        .sorted(Comparator.comparing(item -> item.getModalidad().ordinal()))
                        .map(item -> new MatrizPlanillaResponse.MatrizModalidadResponse(
                                item.getId(),
                                item.getModalidad(),
                                item.getHorasDia(),
                                item.getBonoPuntualidad(),
                                item.getVentasMinimasProductividad(),
                                item.getBonoProductividad()
                        ))
                        .toList(),
                matriz.getTardanzas().stream()
                        .sorted(Comparator.comparing(MatrizTardanzaPlanilla::getMinutosDesde))
                        .map(item -> new MatrizPlanillaResponse.MatrizTardanzaResponse(
                                item.getId(),
                                item.getMinutosDesde(),
                                item.getMinutosHasta(),
                                item.getMontoDescuento()
                        ))
                        .toList()
        );
    }

    private void validarRequest(MatrizPlanillaRequest request) {
        Set<ModalidadTrabajo> modalidades = request.modalidades().stream()
                .map(MatrizPlanillaRequest.MatrizModalidadRequest::modalidad)
                .collect(Collectors.toSet());
        if (!modalidades.equals(EnumSet.allOf(ModalidadTrabajo.class))) {
            throw new BillingException(HttpStatus.BAD_REQUEST, "La matriz debe incluir todas las modalidades de trabajo");
        }
        request.tardanzas().forEach(regla -> {
            if (regla.minutosHasta() < regla.minutosDesde()) {
                throw new BillingException(HttpStatus.BAD_REQUEST, "El rango de tardanza no puede terminar antes de iniciar");
            }
        });
    }
}
