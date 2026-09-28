package pe.albrugroup.lead_service.service;

import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import pe.albrugroup.lead_service.entity.Lead;
import pe.albrugroup.lead_service.entity.Proveedor;
import pe.albrugroup.lead_service.entity.enums.Etapa;
import pe.albrugroup.lead_service.repository.LeadRepository;

import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class LeadServicePlanesOfertaTest {

    @Mock private LeadRepository leadRepository;
    @Mock private PlanService planService;
    @InjectMocks private LeadService leadService;

    @Test
    void listaPlanesConLecturaNormalSinBloqueoPesimista() {
        Proveedor proveedor = mock(Proveedor.class);
        when(proveedor.getId()).thenReturn(44L);
        Lead lead = Lead.builder()
                .id(38429L)
                .etapa(Etapa.VENTA)
                .proveedor(proveedor)
                .build();
        when(leadRepository.findById(38429L)).thenReturn(Optional.of(lead));
        when(planService.listarPlanes(44L, true)).thenReturn(List.of());

        List<?> planes = leadService.listarPlanesOfertaVenta(38429L);

        assertThat(planes).isEmpty();
        verify(leadRepository).findById(38429L);
        verify(leadRepository, never()).buscarPorIdConBloqueo(38429L);
        verify(planService).listarPlanes(44L, true);
    }
}
