package pe.albrugroup.rrhh_service.service;

import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import pe.albrugroup.rrhh_service.entity.Contrato;
import pe.albrugroup.rrhh_service.entity.Pago;
import pe.albrugroup.rrhh_service.entity.request.RegistrarPagoRequest;
import pe.albrugroup.rrhh_service.entity.response.PagoResponse;
import pe.albrugroup.rrhh_service.exception.PagoContratoInactivoException;
import pe.albrugroup.rrhh_service.service.mapper.PagoMapper;
import pe.albrugroup.rrhh_service.repository.ContratoRepository;
import pe.albrugroup.rrhh_service.repository.PagoRepository;
import pe.albrugroup.rrhh_service.usecase.IPago;

import java.time.LocalDate;
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
    public List<PagoResponse> getPagosPorContrato(Long idContrato) {
        return pagoRepository.findByContratoId(idContrato).stream()
                .map(mapper::toResponse)
                .toList();
    }
    @Transactional(readOnly = true) @Override
    public List<PagoResponse> getPagosPorEmpleado(Long idEmpleado) {
        return pagoRepository.findPagosByEmpleadoId(idEmpleado).stream()
                .map(mapper::toResponse)
                .toList();
    }
    @Override
    public PagoResponse registrarPago(Long idContrato, RegistrarPagoRequest nuevoPago) {
        LocalDate hoy = LocalDate.now();
        Contrato contrato = contratoRepository.findContratoVigenteById(idContrato, hoy)
                .orElseThrow(() -> new PagoContratoInactivoException(idContrato));
        Pago pago = mapper.toEntity(nuevoPago);
        pago.setContrato(contrato);
        return mapper.toResponse(pagoRepository.save(pago));
    }

    @Override
    public List<PagoResponse> registrarPagos(List<Long> idContratos, List<RegistrarPagoRequest> nuevosPagos) {
        return IntStream.range(0, idContratos.size())
                .mapToObj(i -> registrarPago(
                        idContratos.get(i),
                        nuevosPagos.get(i)
                )).toList();
    }
}
