package pe.albrugroup.lead_service.service;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import pe.albrugroup.lead_service.configuration.CurrentUser;
import pe.albrugroup.lead_service.entity.EncuestaPostventa;
import pe.albrugroup.lead_service.entity.Lead;
import pe.albrugroup.lead_service.entity.enums.EstadoEncuestaPostventa;
import pe.albrugroup.lead_service.entity.enums.Etapa;
import pe.albrugroup.lead_service.entity.enums.TipoContactoEncuesta;
import pe.albrugroup.lead_service.entity.enums.TipoEncuestaPostventa;
import pe.albrugroup.lead_service.entity.request.EncuestaPostventaRequest;
import pe.albrugroup.lead_service.entity.response.EncuestaPostventaResponse;
import pe.albrugroup.lead_service.entity.response.SatisfaccionPostventaResponse;
import pe.albrugroup.lead_service.exception.BadRequestException;
import pe.albrugroup.lead_service.repository.EncuestaPostventaRepository;
import pe.albrugroup.lead_service.repository.LeadRepository;
import pe.albrugroup.lead_service.repository.PeriodoFacturacionPostventaRepository;
import pe.albrugroup.lead_service.service.mapper.EncuestaPostventaMapper;

import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

class EncuestaPostventaServiceTest {

    private EncuestaPostventaRepository encuestaRepository;
    private LeadRepository leadRepository;
    private EncuestaPostventaMapper mapper;
    private EncuestaPostventaService service;

    @BeforeEach
    void setUp() {
        encuestaRepository = mock(EncuestaPostventaRepository.class);
        leadRepository = mock(LeadRepository.class);
        mapper = mock(EncuestaPostventaMapper.class);
        CurrentUser currentUser = mock(CurrentUser.class);

        when(currentUser.empleadoID()).thenReturn(77L);
        when(currentUser.nombreCompleto()).thenReturn("Gloria Zapata");
        when(mapper.toResponse(any(EncuestaPostventa.class))).thenAnswer(invocation -> {
            EncuestaPostventa encuesta = invocation.getArgument(0);
            return EncuestaPostventaResponse.builder()
                    .id(encuesta.getId())
                    .tipoEncuesta(encuesta.getTipoEncuesta())
                    .tipoContacto(encuesta.getTipoContacto())
                    .calificacion(encuesta.getCalificacion())
                    .estado(encuesta.getEstado())
                    .idAsesorEncuesta(encuesta.getIdAsesorEncuesta())
                    .nombreAsesorEncuesta(encuesta.getNombreAsesorEncuesta())
                    .build();
        });

        service = new EncuestaPostventaService(
                encuestaRepository,
                leadRepository,
                mock(PeriodoFacturacionPostventaRepository.class),
                currentUser,
                mapper,
                mock(PaginationService.class)
        );
    }

    @Test
    void encuestaAsesorCompletaPendienteExistente() {
        Lead lead = leadPostventaAsignado();
        EncuestaPostventa pendiente = EncuestaPostventa.builder()
                .id(10L)
                .lead(lead)
                .tipoEncuesta(TipoEncuestaPostventa.SATISFACCION_ASESOR)
                .estado(EstadoEncuestaPostventa.PENDIENTE)
                .build();
        EncuestaPostventaRequest request = request(TipoEncuestaPostventa.SATISFACCION_ASESOR, 6);

        when(leadRepository.findByIdAndIdAsesorAsignadoAndEtapaIn(eq(1L), eq(77L), any()))
                .thenReturn(Optional.of(lead));
        when(encuestaRepository.findFirstByLeadIdAndTipoEncuestaAndEstadoOrderByFechaProgramadaAscCreatedAtAscIdAsc(
                1L,
                TipoEncuestaPostventa.SATISFACCION_ASESOR,
                EstadoEncuestaPostventa.PENDIENTE
        )).thenReturn(Optional.of(pendiente));
        when(encuestaRepository.save(pendiente)).thenReturn(pendiente);

        EncuestaPostventaResponse response = service.registrarEncuesta(1L, request);

        assertThat(response.getEstado()).isEqualTo(EstadoEncuestaPostventa.REALIZADA);
        assertThat(response.getCalificacion()).isEqualTo(6);
        assertThat(response.getTipoContacto()).isEqualTo(TipoContactoEncuesta.CHAT);
        assertThat(response.getNombreAsesorEncuesta()).isEqualTo("Gloria Zapata");
        verify(encuestaRepository).save(pendiente);
    }

    @Test
    void encuestaAsesorSinPendienteSeRechazaParaEvitarDuplicados() {
        Lead lead = leadPostventaAsignado();
        EncuestaPostventaRequest request = request(TipoEncuestaPostventa.SATISFACCION_ASESOR, 8);

        when(leadRepository.findByIdAndIdAsesorAsignadoAndEtapaIn(eq(1L), eq(77L), any()))
                .thenReturn(Optional.of(lead));
        when(encuestaRepository.findFirstByLeadIdAndTipoEncuestaAndEstadoOrderByFechaProgramadaAscCreatedAtAscIdAsc(
                1L,
                TipoEncuestaPostventa.SATISFACCION_ASESOR,
                EstadoEncuestaPostventa.PENDIENTE
        )).thenReturn(Optional.empty());

        assertThatThrownBy(() -> service.registrarEncuesta(1L, request))
                .isInstanceOf(BadRequestException.class)
                .hasMessageContaining("No existe una encuesta pendiente");
    }

    @Test
    void encuestaServicioCreaNuevaEncuestaRealizada() {
        Lead lead = leadPostventaAsignado();
        EncuestaPostventa nueva = EncuestaPostventa.builder().build();
        EncuestaPostventaRequest request = request(TipoEncuestaPostventa.SATISFACCION_SERVICIO, 9);

        when(leadRepository.findByIdAndIdAsesorAsignadoAndEtapaIn(eq(1L), eq(77L), any()))
                .thenReturn(Optional.of(lead));
        when(mapper.toEntity(request)).thenReturn(nueva);
        when(encuestaRepository.save(nueva)).thenReturn(nueva);

        EncuestaPostventaResponse response = service.registrarEncuesta(1L, request);

        assertThat(response.getTipoEncuesta()).isEqualTo(TipoEncuestaPostventa.SATISFACCION_SERVICIO);
        assertThat(response.getEstado()).isEqualTo(EstadoEncuestaPostventa.REALIZADA);
        assertThat(response.getCalificacion()).isEqualTo(9);
        assertThat(response.getNombreAsesorEncuesta()).isEqualTo("Gloria Zapata");
    }

    @Test
    void resumenConSoloPendientesNoDevuelveCero() {
        Lead lead = leadPostventaAsignado();
        EncuestaPostventa pendiente = EncuestaPostventa.builder()
                .lead(lead)
                .estado(EstadoEncuestaPostventa.PENDIENTE)
                .build();

        when(leadRepository.findByIdAndIdAsesorAsignadoAndEtapaIn(eq(1L), eq(77L), any()))
                .thenReturn(Optional.of(lead));
        when(encuestaRepository.findByLeadId(1L)).thenReturn(List.of(pendiente));

        SatisfaccionPostventaResponse response = service.obtenerResumenEncuestasPorLead(1L);

        assertThat(response.getPromedioSatisfaccion()).isNull();
        assertThat(response.getStatusSatisfaccion()).isNull();
    }

    private EncuestaPostventaRequest request(TipoEncuestaPostventa tipo, int calificacion) {
        EncuestaPostventaRequest request = new EncuestaPostventaRequest();
        request.setTipoEncuesta(tipo);
        request.setTipoContacto(TipoContactoEncuesta.CHAT);
        request.setCalificacion(calificacion);
        return request;
    }

    private Lead leadPostventaAsignado() {
        return Lead.builder()
                .id(1L)
                .idAsesorAsignado(77L)
                .etapa(Etapa.POSTVENTA)
                .build();
    }
}
