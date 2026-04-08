package pe.albrugroup.lead_service.service;

import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import pe.albrugroup.lead_service.entity.enums.Etapa;
import pe.albrugroup.lead_service.entity.response.LeadGtrResponse;
import pe.albrugroup.lead_service.repository.LeadRepository;

import java.util.List;

@Service
@Transactional(readOnly = true)
@RequiredArgsConstructor
public class MasivoService {

    private static final List<Long> FILTRO_VACIO = List.of(-1L);
    private static final List<String> TIPIFICACIONES_EXCLUIDAS_MASIVO = List.of(
            "PREVENTA_COMPLETA"
    );

    private final LeadRepository leadRepository;

    public List<LeadGtrResponse> listarLeads(
            Long idProveedor,
            Etapa etapa,
            List<Long> tipificaciones,
            List<Long> subtipificaciones
    ) {
        List<Long> tipificacionesFiltro = normalizarIds(tipificaciones);
        List<Long> subtipificacionesFiltro = normalizarIds(subtipificaciones);

        return leadRepository.listarLeadsMasivo(
                idProveedor,
                etapa,
                !tipificacionesFiltro.isEmpty(),
                tipificacionesFiltro.isEmpty() ? FILTRO_VACIO : tipificacionesFiltro,
                !subtipificacionesFiltro.isEmpty(),
                subtipificacionesFiltro.isEmpty() ? FILTRO_VACIO : subtipificacionesFiltro,
                TIPIFICACIONES_EXCLUIDAS_MASIVO
        );
    }

    private List<Long> normalizarIds(List<Long> ids) {
        if (ids == null) {
            return List.of();
        }

        return ids.stream()
                .filter(id -> id != null && id > 0)
                .distinct()
                .toList();
    }
}
