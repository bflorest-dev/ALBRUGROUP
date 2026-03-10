package pe.albrugroup.lead_service.configuration;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.core.io.ClassPathResource;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;
import pe.albrugroup.lead_service.entity.Departamento;
import pe.albrugroup.lead_service.entity.Distrito;
import pe.albrugroup.lead_service.entity.Provincia;
import pe.albrugroup.lead_service.repository.DepartamentoRepository;
import pe.albrugroup.lead_service.repository.DistritoRepository;
import pe.albrugroup.lead_service.repository.ProvinciaRepository;

import java.io.BufferedReader;
import java.io.IOException;
import java.io.InputStreamReader;
import java.nio.charset.Charset;
import java.nio.charset.StandardCharsets;

@Component
@Slf4j
@RequiredArgsConstructor
public class UbigeoDataLoader {

    private static final String DEPARTAMENTOS_CSV = "ubigeo/ubigeo_peru_2016_departamentos.csv";
    private static final String PROVINCIAS_CSV = "ubigeo/ubigeo_peru_2016_provincias.csv";
    private static final String DISTRITOS_CSV = "ubigeo/ubigeo_peru_2016_distritos.csv";
    private static final Charset DEFAULT_CHARSET = StandardCharsets.UTF_8;

    private final DepartamentoRepository departamentoRepository;
    private final ProvinciaRepository provinciaRepository;
    private final DistritoRepository distritoRepository;

    @Transactional
    public void cargarUbigeoDesdeResources() {
        cargarDepartamentos();
        cargarProvincias();
        cargarDistritos();
    }

    private void cargarDepartamentos() {
        int procesados = 0;
        try (BufferedReader reader = newCsvReader(DEPARTAMENTOS_CSV)) {
            skipHeader(reader);
            String line;
            while ((line = reader.readLine()) != null) {
                if (line.isBlank()) {
                    continue;
                }
                String[] columns = line.split(",", -1);
                String codigo = columns[0].trim();
                String nombre = normalizarTexto(columns[1]);

                Departamento departamento = departamentoRepository.findByCodigo(codigo)
                        .orElseGet(Departamento::new);
                departamento.setCodigo(codigo);
                departamento.setNombre(nombre);
                departamentoRepository.save(departamento);
                procesados++;
            }
            log.info("Departamentos cargados/actualizados: {}", procesados);
        } catch (IOException e) {
            throw new IllegalStateException("Error cargando departamentos desde CSV", e);
        }
    }

    private void cargarProvincias() {
        int procesados = 0;
        try (BufferedReader reader = newCsvReader(PROVINCIAS_CSV)) {
            skipHeader(reader);
            String line;
            while ((line = reader.readLine()) != null) {
                if (line.isBlank()) {
                    continue;
                }
                String[] columns = line.split(",", -1);
                String codigo = columns[0].trim();
                String nombre = normalizarTexto(columns[1]);
                String codigoDepartamento = columns[2].trim();

                Departamento departamento = departamentoRepository.findByCodigo(codigoDepartamento)
                        .orElseThrow(() -> new IllegalStateException(
                                "No existe departamento para codigo " + codigoDepartamento
                        ));

                Provincia provincia = provinciaRepository.findByDepartamentoIdAndCodigo(departamento.getId(), codigo)
                        .orElseGet(Provincia::new);
                provincia.setCodigo(codigo);
                provincia.setNombre(nombre);
                provincia.setDepartamento(departamento);
                provinciaRepository.save(provincia);
                procesados++;
            }
            log.info("Provincias cargadas/actualizadas: {}", procesados);
        } catch (IOException e) {
            throw new IllegalStateException("Error cargando provincias desde CSV", e);
        }
    }

    private void cargarDistritos() {
        int procesados = 0;
        try (BufferedReader reader = newCsvReader(DISTRITOS_CSV)) {
            skipHeader(reader);
            String line;
            while ((line = reader.readLine()) != null) {
                if (line.isBlank()) {
                    continue;
                }
                String[] columns = line.split(",", -1);
                String codigo = columns[0].trim();
                String nombre = normalizarTexto(columns[1]);
                String codigoProvincia = columns[2].trim();
                String codigoDepartamento = columns[3].trim();

                Departamento departamento = departamentoRepository.findByCodigo(codigoDepartamento)
                        .orElseThrow(() -> new IllegalStateException(
                                "No existe departamento para codigo " + codigoDepartamento
                        ));

                Provincia provincia = provinciaRepository.findByCodigo(codigoProvincia)
                        .orElseThrow(() -> new IllegalStateException(
                                "No existe provincia para codigo " + codigoProvincia
                        ));

                if (!provincia.getDepartamento().getId().equals(departamento.getId())) {
                    throw new IllegalStateException(
                            "Inconsistencia CSV: provincia " + codigoProvincia
                                    + " no pertenece al departamento " + codigoDepartamento
                    );
                }

                Distrito distrito = distritoRepository.findByCodigo(codigo)
                        .orElseGet(Distrito::new);
                distrito.setCodigo(codigo);
                distrito.setNombre(nombre);
                distrito.setProvincia(provincia);
                distrito.setDepartamento(departamento);
                distritoRepository.save(distrito);
                procesados++;
            }
            log.info("Distritos cargados/actualizados: {}", procesados);
        } catch (IOException e) {
            throw new IllegalStateException("Error cargando distritos desde CSV", e);
        }
    }

    private BufferedReader newCsvReader(String classpathFile) throws IOException {
        return new BufferedReader(
                new InputStreamReader(
                        new ClassPathResource(classpathFile).getInputStream(),
                        DEFAULT_CHARSET
                )
        );
    }

    private void skipHeader(BufferedReader reader) throws IOException {
        reader.readLine();
    }

    private String normalizarTexto(String valor) {
        if (valor == null) {
            return null;
        }

        String limpio = valor.trim().replace("\uFEFF", "");

        // Corrige mojibake comun (acentos/tildes mal decodificados).
        if (limpio.contains("\u00C3") || limpio.contains("\u00C2") || limpio.contains("\u00E2")) {
            return new String(limpio.getBytes(StandardCharsets.ISO_8859_1), StandardCharsets.UTF_8).trim();
        }

        return limpio;
    }
}
