package pe.albrugroup.lead_service.service;

import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import pe.albrugroup.lead_service.configuration.AlbProperties;
import pe.albrugroup.lead_service.entity.response.AlbFileContent;
import pe.albrugroup.lead_service.entity.response.AlbLeadRow;
import pe.albrugroup.lead_service.exception.BadRequestException;

import java.util.HexFormat;
import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

class AlbCryptoServiceTest {

    private static final String TEST_KEY = "0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef";

    private AlbCryptoService service;

    @BeforeEach
    void setUp() {
        AlbProperties props = new AlbProperties();
        props.setEncryptionKey(TEST_KEY);
        service = new AlbCryptoService(props, new ObjectMapper());
    }

    @Test
    void roundTrip_encryptThenDecrypt_returnsOriginalData() {
        List<AlbLeadRow> leads = List.of(
                new AlbLeadRow("+51", "987654321", "EfrainBay", "12345678", "Av. Arequipa 1234", "Efrain Bayona"),
                new AlbLeadRow("+51", "912345678", null, null, null, "Ana Lopez")
        );

        byte[] encrypted = service.encrypt(leads, "PREDICTIVO");
        AlbFileContent result = service.decrypt(encrypted);

        assertThat(result.version()).isEqualTo(1);
        assertThat(result.origenCodigo()).isEqualTo("PREDICTIVO");
        assertThat(result.count()).isEqualTo(2);
        assertThat(result.leads()).hasSize(2);
        assertThat(result.leads().get(0).lead()).isEqualTo("987654321");
        assertThat(result.leads().get(0).nombre()).isEqualTo("Efrain Bayona");
        assertThat(result.leads().get(1).lead()).isEqualTo("912345678");
    }

    @Test
    void decrypt_corruptedFile_throwsBadRequestException() {
        byte[] garbage = "not an ALB file".getBytes();

        assertThatThrownBy(() -> service.decrypt(garbage))
                .isInstanceOf(BadRequestException.class)
                .hasMessageContaining("magic number incorrecto");
    }

    @Test
    void decrypt_wrongKey_throwsBadRequestException() {
        List<AlbLeadRow> leads = List.of(
                new AlbLeadRow("+51", "987654321", null, null, null, "Test")
        );
        byte[] encrypted = service.encrypt(leads, "PREDICTIVO");

        AlbProperties wrongProps = new AlbProperties();
        wrongProps.setEncryptionKey("ffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff");
        AlbCryptoService wrongService = new AlbCryptoService(wrongProps, new ObjectMapper());

        assertThatThrownBy(() -> wrongService.decrypt(encrypted))
                .isInstanceOf(BadRequestException.class)
                .hasMessageContaining("Error al desencriptar");
    }

    @Test
    void decrypt_tamperedCiphertext_throwsBadRequestException() {
        List<AlbLeadRow> leads = List.of(
                new AlbLeadRow("+51", "987654321", null, null, null, "Test")
        );
        byte[] encrypted = service.encrypt(leads, "PREDICTIVO");

        encrypted[encrypted.length - 1] ^= 0xFF;

        assertThatThrownBy(() -> service.decrypt(encrypted))
                .isInstanceOf(BadRequestException.class)
                .hasMessageContaining("Error al desencriptar");
    }

    @Test
    void encrypt_notConfigured_throwsBadRequestException() {
        AlbProperties noKeyProps = new AlbProperties();
        AlbCryptoService noKeyService = new AlbCryptoService(noKeyProps, new ObjectMapper());

        assertThatThrownBy(() -> noKeyService.encrypt(List.of(), "PREDICTIVO"))
                .isInstanceOf(BadRequestException.class)
                .hasMessageContaining("no esta configurada");
    }

    @Test
    void encrypt_emptyList_roundTripsCorrectly() {
        byte[] encrypted = service.encrypt(List.of(), "MASIVO");
        AlbFileContent result = service.decrypt(encrypted);

        assertThat(result.count()).isZero();
        assertThat(result.leads()).isEmpty();
        assertThat(result.origenCodigo()).isEqualTo("MASIVO");
    }
}
