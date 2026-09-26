package pe.albrugroup.lead_service.service;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import pe.albrugroup.lead_service.configuration.AlbProperties;
import pe.albrugroup.lead_service.entity.response.AlbFileContent;
import pe.albrugroup.lead_service.entity.response.AlbLeadRow;
import pe.albrugroup.lead_service.exception.BadRequestException;

import javax.crypto.Cipher;
import javax.crypto.spec.GCMParameterSpec;
import javax.crypto.spec.SecretKeySpec;
import java.io.ByteArrayOutputStream;
import java.io.DataOutputStream;
import java.nio.ByteBuffer;
import java.nio.charset.StandardCharsets;
import java.security.SecureRandom;
import java.util.HexFormat;
import java.util.List;

@Service
@RequiredArgsConstructor
public class AlbCryptoService {

    private static final byte[] MAGIC = {'A', 'L', 'B', 0};
    private static final short VERSION = 1;
    private static final int GCM_IV_LENGTH = 12;
    private static final int GCM_TAG_BITS = 128;

    private final AlbProperties albProperties;
    private final ObjectMapper objectMapper;

    public byte[] encrypt(List<AlbLeadRow> leads, String origenCodigo) {
        requireConfigured();
        try {
            byte[] payload = objectMapper.writeValueAsBytes(leads);
            byte[] origenBytes = origenCodigo.getBytes(StandardCharsets.UTF_8);
            if (origenBytes.length > 30) {
                throw new BadRequestException("Codigo de origen demasiado largo (max 30 bytes)");
            }

            byte[] iv = new byte[GCM_IV_LENGTH];
            new SecureRandom().nextBytes(iv);

            Cipher cipher = Cipher.getInstance("AES/GCM/NoPadding");
            cipher.init(Cipher.ENCRYPT_MODE, secretKey(), new GCMParameterSpec(GCM_TAG_BITS, iv));
            byte[] ciphertext = cipher.doFinal(payload);

            ByteArrayOutputStream baos = new ByteArrayOutputStream();
            DataOutputStream dos = new DataOutputStream(baos);
            dos.write(MAGIC);
            dos.writeShort(VERSION);
            dos.writeByte(origenBytes.length);
            dos.write(origenBytes);
            dos.writeInt(leads.size());
            dos.write(iv);
            dos.write(ciphertext);
            dos.flush();
            return baos.toByteArray();
        } catch (BadRequestException e) {
            throw e;
        } catch (Exception e) {
            throw new BadRequestException("Error al encriptar archivo ALB: " + e.getMessage());
        }
    }

    public AlbFileContent decrypt(byte[] fileBytes) {
        requireConfigured();
        try {
            ByteBuffer buf = ByteBuffer.wrap(fileBytes);

            byte[] magic = new byte[4];
            buf.get(magic);
            if (magic[0] != 'A' || magic[1] != 'L' || magic[2] != 'B' || magic[3] != 0) {
                throw new BadRequestException("Archivo ALB invalido: magic number incorrecto");
            }

            short version = buf.getShort();
            if (version != VERSION) {
                throw new BadRequestException("Version de archivo ALB no soportada: " + version);
            }

            int origenLen = buf.get() & 0xFF;
            byte[] origenBytes = new byte[origenLen];
            buf.get(origenBytes);
            String origenCodigo = new String(origenBytes, StandardCharsets.UTF_8);

            int count = buf.getInt();

            byte[] iv = new byte[GCM_IV_LENGTH];
            buf.get(iv);

            byte[] ciphertext = new byte[buf.remaining()];
            buf.get(ciphertext);

            Cipher cipher = Cipher.getInstance("AES/GCM/NoPadding");
            cipher.init(Cipher.DECRYPT_MODE, secretKey(), new GCMParameterSpec(GCM_TAG_BITS, iv));
            byte[] plaintext = cipher.doFinal(ciphertext);

            List<AlbLeadRow> leads = objectMapper.readValue(plaintext, new TypeReference<>() {});

            if (leads.size() != count) {
                throw new BadRequestException(
                        "Cantidad de leads no coincide: header=" + count + ", payload=" + leads.size());
            }

            return new AlbFileContent(version, origenCodigo, count, leads);
        } catch (BadRequestException e) {
            throw e;
        } catch (Exception e) {
            throw new BadRequestException("Error al desencriptar archivo ALB: " + e.getMessage());
        }
    }

    private SecretKeySpec secretKey() {
        byte[] keyBytes = HexFormat.of().parseHex(albProperties.getEncryptionKey());
        return new SecretKeySpec(keyBytes, "AES");
    }

    private void requireConfigured() {
        if (!albProperties.isConfigured()) {
            throw new BadRequestException("La encriptacion ALB no esta configurada (falta app.alb.encryption-key)");
        }
    }
}
