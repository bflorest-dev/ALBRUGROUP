package pe.albrugroup.lead_service.service;

import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import pe.albrugroup.lead_service.configuration.OperationalDateTime;
import pe.albrugroup.lead_service.entity.Campana;
import pe.albrugroup.lead_service.entity.CampanaGastoRegistro;
import pe.albrugroup.lead_service.entity.request.CampanaGastoRequest;
import pe.albrugroup.lead_service.entity.response.CampanaGastoResponse;
import pe.albrugroup.lead_service.repository.CampanaGastoRegistroRepository;
import pe.albrugroup.lead_service.repository.CampanaRepository;
import pe.albrugroup.lead_service.repository.EquipoProveedorRepository;
import pe.albrugroup.lead_service.repository.EventoRepository;
import pe.albrugroup.lead_service.repository.LeadRepository;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyLong;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class CampanaGastoServiceTest {

    @Mock private CampanaGastoRegistroRepository registroRepository;
    @Mock private CampanaRepository campanaRepository;
    @Mock private EquipoProveedorRepository equipoProveedorRepository;
    @Mock private LeadRepository leadRepository;
    @Mock private EventoRepository eventoRepository;

    @InjectMocks private CampanaGastoService service;

    @Test
    void primerGastoDelDiaSeRegistraComoCierreDelDiaAnterior() {
        LocalDate hoy = OperationalDateTime.today();
        Campana campana = campana();
        when(campanaRepository.findActiveByIdForUpdate(1L)).thenReturn(Optional.of(campana));
        when(registroRepository.existsByCampanaIdAndFechaCarga(1L, hoy)).thenReturn(false);
        when(registroRepository.existsByCampanaIdAndCreatedAtGreaterThanEqualAndCreatedAtLessThan(anyLong(), any(), any()))
                .thenReturn(true);
        when(registroRepository.existsByCampanaIdAndCreatedAtAndFechaCarga(1L, OperationalDateTime.previousDayClosure(hoy), hoy))
                .thenReturn(false);
        when(registroRepository.saveAndFlush(any(CampanaGastoRegistro.class))).thenAnswer(invocation -> invocation.getArgument(0));
        when(registroRepository.save(any(CampanaGastoRegistro.class))).thenAnswer(invocation -> invocation.getArgument(0));
        when(eventoRepository.contarRegistrosPorCampanaYRango(anyLong(), any(), any(), any())).thenReturn(0L);
        when(eventoRepository.contarVentasCerradasPorCampanaYRango(anyLong(), any(), any(), any(), any(), any())).thenReturn(0L);

        CampanaGastoResponse response = service.registrarGasto(1L, request(12));

        ArgumentCaptor<CampanaGastoRegistro> registroCaptor = ArgumentCaptor.forClass(CampanaGastoRegistro.class);
        verify(registroRepository).saveAndFlush(registroCaptor.capture());
        assertThat(registroCaptor.getValue().getFechaCarga()).isEqualTo(hoy);
        assertThat(registroCaptor.getValue().getCreatedAt()).isEqualTo(OperationalDateTime.previousDayClosure(hoy));
        assertThat(response.getCierreRetroactivo()).isTrue();
        assertThat(response.getCreatedAt()).isEqualTo(OperationalDateTime.previousDayClosure(hoy));
    }

    @Test
    void segundoGastoDelDiaUsaHoraActualYValidaContraElPrimero() {
        LocalDate hoy = OperationalDateTime.today();
        Campana campana = campana();
        CampanaGastoRegistro primerRegistro = CampanaGastoRegistro.builder()
                .campana(campana)
                .leads(12)
                .fechaCarga(hoy)
                .createdAt(OperationalDateTime.previousDayClosure(hoy))
                .build();
        when(campanaRepository.findActiveByIdForUpdate(1L)).thenReturn(Optional.of(campana));
        when(registroRepository.existsByCampanaIdAndFechaCarga(1L, hoy)).thenReturn(true);
        when(registroRepository.findTopByCampanaIdAndFechaCargaOrderByIdDesc(1L, hoy)).thenReturn(Optional.of(primerRegistro));
        when(registroRepository.saveAndFlush(any(CampanaGastoRegistro.class))).thenAnswer(invocation -> invocation.getArgument(0));
        when(registroRepository.save(any(CampanaGastoRegistro.class))).thenAnswer(invocation -> invocation.getArgument(0));
        when(eventoRepository.contarRegistrosPorCampanaYRango(anyLong(), any(), any(), any())).thenReturn(0L);
        when(eventoRepository.contarVentasCerradasPorCampanaYRango(anyLong(), any(), any(), any(), any(), any())).thenReturn(0L);

        CampanaGastoResponse response = service.registrarGasto(1L, request(18));

        assertThat(response.getCierreRetroactivo()).isFalse();
        assertThat(OperationalDateTime.toOperationalDate(response.getCreatedAt())).isEqualTo(hoy);
        verify(registroRepository).findTopByCampanaIdAndFechaCargaOrderByIdDesc(1L, hoy);
    }

    @Test
    void primerGastoSinActividadAyerSeRegistraHoy() {
        LocalDate hoy = OperationalDateTime.today();
        Campana campana = campana();
        when(campanaRepository.findActiveByIdForUpdate(1L)).thenReturn(Optional.of(campana));
        when(registroRepository.existsByCampanaIdAndFechaCarga(1L, hoy)).thenReturn(false);
        when(registroRepository.existsByCampanaIdAndCreatedAtGreaterThanEqualAndCreatedAtLessThan(anyLong(), any(), any()))
                .thenReturn(false);
        when(registroRepository.saveAndFlush(any(CampanaGastoRegistro.class))).thenAnswer(invocation -> invocation.getArgument(0));
        when(registroRepository.save(any(CampanaGastoRegistro.class))).thenAnswer(invocation -> invocation.getArgument(0));
        when(eventoRepository.contarRegistrosPorCampanaYRango(anyLong(), any(), any(), any())).thenReturn(0L);
        when(eventoRepository.contarVentasCerradasPorCampanaYRango(anyLong(), any(), any(), any(), any(), any())).thenReturn(0L);

        CampanaGastoResponse response = service.registrarGasto(1L, request(12));

        assertThat(response.getCierreRetroactivo()).isFalse();
        assertThat(OperationalDateTime.toOperationalDate(response.getCreatedAt())).isEqualTo(hoy);
    }

    private Campana campana() {
        Campana campana = new Campana();
        campana.setId(1L);
        campana.setNombre("Campaña prueba");
        campana.setActivo(true);
        return campana;
    }

    private CampanaGastoRequest request(int leads) {
        CampanaGastoRequest request = new CampanaGastoRequest();
        request.setLeads(leads);
        request.setCostoTotal(BigDecimal.valueOf(20));
        return request;
    }
}
