package pe.albrugroup.rrhh_service.service;

import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import pe.albrugroup.rrhh_service.entity.Contrato;
import pe.albrugroup.rrhh_service.entity.Pago;
import pe.albrugroup.rrhh_service.entity.request.RegistrarPagoRequest;
import pe.albrugroup.rrhh_service.entity.response.PagoResponse;
import pe.albrugroup.rrhh_service.exception.ContratoConflictoException;
import pe.albrugroup.rrhh_service.exception.ContratoNotFoundException;
import pe.albrugroup.rrhh_service.exception.PagoContratoInactivoException;
import pe.albrugroup.rrhh_service.service.mapper.PagoMapper;
import pe.albrugroup.rrhh_service.repository.ContratoRepository;
import pe.albrugroup.rrhh_service.repository.PagoRepository;
import pe.albrugroup.rrhh_service.usecase.IPago;

import java.time.LocalDate;
import java.time.YearMonth;
import java.util.List;
import java.util.stream.IntStream;

@Service
@Transactional
@RequiredArgsConstructor
public class PagoService implements IPago {

    private final PagoRepository pagoRepository;
    private final ContratoRepository contratoRepository;
    private final PagoMapper mapper;

    @Transactional(readOnly = true) @Override
    public List<PagoResponse> getPagosContratoEmpleado(Long idContrato, Long idEmpleado) {
        return List.of();
    }

    @Override
    public PagoResponse registrarPago(Long idContrato, RegistrarPagoRequest nuevoPago) {
        Contrato contrato = contratoRepository.findById(idContrato)
                .orElseThrow(() -> new ContratoNotFoundException(idContrato));
        Pago pago = mapper.toEntity(nuevoPago);

        LocalDate fechaInicio = nuevoPago.getFechaInicio();
        LocalDate fechaFin = nuevoPago.getFechaFin();
        // PERIODO DE PAGO
        // Caso 1: Ambas null → Mes completo actual
        if (fechaInicio == null && fechaFin == null) {
            YearMonth mesActual = YearMonth.now();
            pago.setFechaInicio(mesActual.atDay(1));
            pago.setFechaFin(mesActual.atEndOfMonth());
        }
        // Caso 2: Solo viene fechaInicio → Ingresó a mitad de mes, pagar hasta fin de mes
        else if (fechaInicio != null && fechaFin == null) {
            pago.setFechaInicio(fechaInicio);
            YearMonth mes = YearMonth.from(fechaInicio);
            pago.setFechaFin(mes.atEndOfMonth());
        }
        // Caso 3: Solo viene fechaFin → Salió a mitad de mes, pagar desde inicio de mes
        else if (fechaInicio == null) {
            YearMonth mes = YearMonth.from(fechaFin);
            pago.setFechaInicio(mes.atDay(1));
            pago.setFechaFin(fechaFin);
        }
        // Caso 4: Ambas vienen → Período personalizado
        else {
            pago.setFechaInicio(fechaInicio);
            pago.setFechaFin(fechaFin);
        }

        validarPagoDentroDelContrato(contrato, pago.getFechaInicio(), pago.getFechaFin());
        pago.setContrato(contrato);
        return mapper.toResponse(pagoRepository.save(pago));
    }
    private void validarPagoDentroDelContrato(Contrato contrato, LocalDate pagoInicio, LocalDate pagoFin) {
        if (pagoInicio.isBefore(contrato.getFechaInicio())) {
            throw new ContratoConflictoException("El pago no puede iniciar antes del contrato (" + contrato.getFechaInicio() + ")");
        }
        if (contrato.getFechaFin() != null && pagoFin.isAfter(contrato.getFechaFin())) {
            throw new ContratoConflictoException("El pago no puede terminar después del contrato (" + contrato.getFechaFin() + ")");
        }
        if (pagoFin.isBefore(pagoInicio)) {
            throw new ContratoConflictoException("La fecha de fin no puede ser anterior a la fecha de inicio");
        }
    }

    @Override
    public void registrarPagos(List<Long> idContratos, List<RegistrarPagoRequest> nuevosPagos) {
        IntStream.range(0, idContratos.size())
                .forEach(i -> registrarPago(
                        idContratos.get(i),
                        nuevosPagos.get(i)
                ));
    }
}
