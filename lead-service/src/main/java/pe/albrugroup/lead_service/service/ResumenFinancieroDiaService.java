package pe.albrugroup.lead_service.service;

import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import pe.albrugroup.lead_service.entity.Proveedor;
import pe.albrugroup.lead_service.entity.ResumenFinancieroDia;
import pe.albrugroup.lead_service.entity.ResumenFinancieroDiaZona;
import pe.albrugroup.lead_service.entity.Zona;
import pe.albrugroup.lead_service.entity.response.ResumenFinancieroDiaResponse;
import pe.albrugroup.lead_service.entity.response.ResumenFinancieroDiaResponse.ZonaResumen;
import pe.albrugroup.lead_service.exception.NotFoundException;
import pe.albrugroup.lead_service.repository.ProveedorRepository;
import pe.albrugroup.lead_service.repository.ResumenFinancieroDiaRepository;
import pe.albrugroup.lead_service.repository.ZonaRepository;

import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Service
@RequiredArgsConstructor
public class ResumenFinancieroDiaService {

    private final ResumenFinancieroDiaRepository resumenRepository;
    private final ProveedorRepository proveedorRepository;
    private final ProveedorScopeService proveedorScopeService;
    private final ZonaRepository zonaRepository;

    @Transactional(readOnly = true)
    public List<ResumenFinancieroDiaResponse> consultar(Long idProveedor, LocalDate desde, LocalDate hasta) {
        proveedorRepository.findById(idProveedor)
                .orElseThrow(() -> new NotFoundException(Proveedor.class, idProveedor));

        List<ResumenFinancieroDia> registros = resumenRepository.findByProveedorAndRango(idProveedor, desde, hasta);
        return registros.stream().map(this::toResponse).toList();
    }

    @Transactional
    public List<ResumenFinancieroDiaResponse> recalcular(Long idProveedor, LocalDate desde, LocalDate hasta) {
        Proveedor proveedor = proveedorRepository.findById(idProveedor)
                .orElseThrow(() -> new NotFoundException(Proveedor.class, idProveedor));

        resumenRepository.deleteByProveedorAndRango(idProveedor, desde, hasta);
        resumenRepository.flush();

        Map<Long, Zona> zonaCache = new HashMap<>();
        List<ResumenFinancieroDia> nuevos = new ArrayList<>();
        Instant ahora = Instant.now();

        for (LocalDate dia = desde; !dia.isAfter(hasta); dia = dia.plusDays(1)) {
            ResumenFinancieroDia resumen = ResumenFinancieroDia.builder()
                    .fecha(dia)
                    .proveedor(proveedor)
                    .ctaBancaria(resumenRepository.ctaBancaria(idProveedor, dia))
                    .ctaPublicitaria(resumenRepository.ctaPublicitaria(idProveedor, dia))
                    .calculadoAt(ahora)
                    .build();

            Map<Long, ResumenFinancieroDiaZona> zonasMap = new HashMap<>();

            for (Object[] row : resumenRepository.ingresadasPorZona(idProveedor, dia)) {
                Long idZona = ((Number) row[0]).longValue();
                int cantidad = ((Number) row[1]).intValue();
                ResumenFinancieroDiaZona z = getOrCreateZona(zonasMap, idZona, zonaCache);
                z.setIngresadas(cantidad);
            }

            for (Object[] row : resumenRepository.instaladasPorZona(idProveedor, dia)) {
                Long idZona = ((Number) row[0]).longValue();
                int cantidad = ((Number) row[1]).intValue();
                BigDecimal cf = (BigDecimal) row[2];
                ResumenFinancieroDiaZona z = getOrCreateZona(zonasMap, idZona, zonaCache);
                z.setInstaladas(cantidad);
                z.setCfInstaladas(cf);
            }

            zonasMap.values().forEach(resumen::addZona);
            nuevos.add(resumen);
        }

        resumenRepository.saveAll(nuevos);
        return nuevos.stream().map(this::toResponse).toList();
    }

    public List<ResumenFinancieroDiaResponse.ProveedorRef> proveedoresSeleccionables() {
        List<Proveedor> asignados = proveedorScopeService.misProveedores();
        List<Proveedor> lista = asignados.isEmpty()
                ? proveedorRepository.listarPorActivo(true)
                : asignados;
        return lista.stream()
                .sorted(Comparator.comparing(Proveedor::getNombre, Comparator.nullsLast(String::compareToIgnoreCase)))
                .map(p -> new ResumenFinancieroDiaResponse.ProveedorRef(p.getId(), p.getNombre()))
                .toList();
    }

    private ResumenFinancieroDiaZona getOrCreateZona(Map<Long, ResumenFinancieroDiaZona> map, Long idZona, Map<Long, Zona> zonaCache) {
        return map.computeIfAbsent(idZona, id -> {
            Zona zona = zonaCache.computeIfAbsent(id, zid ->
                    zonaRepository.findById(zid).orElseThrow(() -> new NotFoundException(Zona.class, zid)));
            return ResumenFinancieroDiaZona.builder().zona(zona).build();
        });
    }

    private ResumenFinancieroDiaResponse toResponse(ResumenFinancieroDia r) {
        List<ZonaResumen> zonas = r.getZonas().stream()
                .sorted(Comparator.comparing(z -> z.getZona().getNombre()))
                .map(z -> new ZonaResumen(
                        z.getZona().getId(),
                        z.getZona().getNombre(),
                        z.getIngresadas(),
                        z.getInstaladas(),
                        z.getCfInstaladas()
                ))
                .toList();

        return new ResumenFinancieroDiaResponse(
                r.getFecha(),
                r.getCtaBancaria(),
                r.getCtaPublicitaria(),
                r.getCalculadoAt(),
                zonas
        );
    }
}
