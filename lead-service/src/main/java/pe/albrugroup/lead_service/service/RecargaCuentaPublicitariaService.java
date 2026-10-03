package pe.albrugroup.lead_service.service;

import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import pe.albrugroup.lead_service.entity.CuentaPublicitaria;
import pe.albrugroup.lead_service.entity.RecargaCuentaPublicitaria;
import pe.albrugroup.lead_service.entity.request.RecargaCuentaPublicitariaRequest;
import pe.albrugroup.lead_service.entity.response.RecargaCuentaPublicitariaResponse;
import pe.albrugroup.lead_service.exception.BadRequestException;
import pe.albrugroup.lead_service.exception.NotFoundException;
import pe.albrugroup.lead_service.repository.CuentaPublicitariaRepository;
import pe.albrugroup.lead_service.repository.RecargaCuentaPublicitariaRepository;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;

@Service @Transactional
@RequiredArgsConstructor
public class RecargaCuentaPublicitariaService {

    private final RecargaCuentaPublicitariaRepository recargaRepository;
    private final CuentaPublicitariaRepository cuentaRepository;

    public RecargaCuentaPublicitariaResponse registrar(RecargaCuentaPublicitariaRequest request) {
        if (request.getFecha().isAfter(LocalDateTime.now())) {
            throw new BadRequestException("La fecha de la recarga no puede ser futura.");
        }

        CuentaPublicitaria cuenta = cuentaRepository.findByIdAndActivoTrue(request.getIdCuentaPublicitaria())
                .orElseThrow(() -> new NotFoundException(CuentaPublicitaria.class, request.getIdCuentaPublicitaria()));

        RecargaCuentaPublicitaria recarga = RecargaCuentaPublicitaria.builder()
                .cuentaPublicitaria(cuenta)
                .monto(request.getMonto())
                .fecha(request.getFecha())
                .observacion(request.getObservacion())
                .build();

        return toResponse(recargaRepository.save(recarga));
    }

    @Transactional(readOnly = true)
    public List<RecargaCuentaPublicitariaResponse> listarPorCuenta(Long idCuenta, LocalDate desde, LocalDate hasta) {
        return recargaRepository.listarPorCuentaYRango(idCuenta, desde.atStartOfDay(), hasta.plusDays(1).atStartOfDay())
                .stream().map(this::toResponse).toList();
    }

    @Transactional(readOnly = true)
    public List<RecargaCuentaPublicitariaResponse> listarPorRango(LocalDate desde, LocalDate hasta, Long idProveedor) {
        LocalDateTime desdeDt = desde.atStartOfDay();
        LocalDateTime hastaDt = hasta.plusDays(1).atStartOfDay();

        List<RecargaCuentaPublicitaria> recargas = idProveedor != null
                ? recargaRepository.listarPorProveedorYRango(idProveedor, desdeDt, hastaDt)
                : recargaRepository.listarPorRango(desdeDt, hastaDt);

        return recargas.stream().map(this::toResponse).toList();
    }

    public RecargaCuentaPublicitariaResponse actualizar(Long id, RecargaCuentaPublicitariaRequest request) {
        if (request.getFecha().isAfter(LocalDateTime.now())) {
            throw new BadRequestException("La fecha de la recarga no puede ser futura.");
        }

        RecargaCuentaPublicitaria recarga = recargaRepository.findById(id)
                .orElseThrow(() -> new NotFoundException(RecargaCuentaPublicitaria.class, id));

        recarga.setMonto(request.getMonto());
        recarga.setFecha(request.getFecha());
        recarga.setObservacion(request.getObservacion());

        return toResponse(recargaRepository.save(recarga));
    }

    private RecargaCuentaPublicitariaResponse toResponse(RecargaCuentaPublicitaria r) {
        return RecargaCuentaPublicitariaResponse.builder()
                .id(r.getId())
                .idCuentaPublicitaria(r.getCuentaPublicitaria().getId())
                .nombreCuenta(r.getCuentaPublicitaria().getNombreCuenta())
                .monto(r.getMonto())
                .fecha(r.getFecha())
                .observacion(r.getObservacion())
                .createdAt(r.getCreatedAt())
                .build();
    }
}
