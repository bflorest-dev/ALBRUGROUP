# =============================================================================
# Asterisk 22.10.0 LTS - Single-stage build para ALBRUGROUP
# =============================================================================
# Single-stage: compile + runtime en la misma imagen Debian Bookworm.
# Evita todos los problemas de "missing shared library" del multi-stage.
# Tamaño final ~700-900MB (aceptable para entorno de desarrollo/producción
# interno donde el build cache lo descarga una sola vez).
# =============================================================================

ARG ASTERISK_VERSION=22.10.0
FROM debian:bookworm-slim

ARG ASTERISK_VERSION
ENV DEBIAN_FRONTEND=noninteractive

# ---------------------------------------------------------------------------
# 1. Dependencias de compilación + runtime en un solo layer
#    (Las libs -dev incluyen las .so runtime, no hay que instalar dos veces)
# ---------------------------------------------------------------------------
RUN apt-get update && apt-get install -y --no-install-recommends \
    # build tools
    build-essential \
    wget \
    ca-certificates \
    pkg-config \
    autoconf \
    libtool-bin \
    bison \
    flex \
    git \
    python3 \
    # libs con headers (necesarios para compilar)
    libedit-dev \
    libjansson-dev \
    libxml2-dev \
    libsqlite3-dev \
    uuid-dev \
    libssl-dev \
    libsrtp2-dev \
    libopus-dev \
    libogg-dev \
    libvorbis-dev \
    libcurl4-openssl-dev \
    libnewt-dev \
    libspeex-dev \
    libspeexdsp-dev \
    libgsm1-dev \
    libxslt1-dev \
    libunbound-dev \
    # utilidades runtime
    procps \
 && rm -rf /var/lib/apt/lists/*

# ---------------------------------------------------------------------------
# 2. Descargar y compilar Asterisk
# ---------------------------------------------------------------------------
WORKDIR /usr/src

# Asterisk mueve las versiones a old-releases/ cuando libera una nueva del mismo branch
# (ej. al salir 22.10.0, la 22.9.0 dejo de estar en el top-level). Intentamos primero
# el top-level y caemos a old-releases/ para que el build no se rompa con cada release.
RUN base="https://downloads.asterisk.org/pub/telephony/asterisk" \
 && file="asterisk-${ASTERISK_VERSION}.tar.gz" \
 && (wget -q "${base}/${file}" || wget -q "${base}/old-releases/${file}") \
 && tar xf "${file}" \
 && rm  "${file}"

WORKDIR /usr/src/asterisk-${ASTERISK_VERSION}

RUN ./configure \
    --with-pjproject-bundled \
    --with-jansson-bundled \
    --disable-xmldoc

# Defaults de menuselect ya incluyen: PJSIP, ARI, AMI, app_queue, MixMonitor,
# app_stasis, res_http_websocket, res_srtp, codec_opus.
RUN make menuselect.makeopts

# Sound packs adicionales; || true porque un nombre cambiado no debe abortar el build
RUN menuselect/menuselect --enable CORE-SOUNDS-EN-WAV  menuselect.makeopts || true \
 && menuselect/menuselect --enable CORE-SOUNDS-ES-WAV  menuselect.makeopts || true \
 && menuselect/menuselect --enable CORE-SOUNDS-ES-ULAW menuselect.makeopts || true \
 && menuselect/menuselect --enable CORE-SOUNDS-ES-ALAW menuselect.makeopts || true \
 && menuselect/menuselect --enable MOH-OPSOUND-WAV     menuselect.makeopts || true \
 && menuselect/menuselect --enable EXTRA-SOUNDS-EN-WAV menuselect.makeopts || true

RUN make -j"$(nproc)" \
 && make install \
 && make samples \
 && make config \
 && ldconfig

# ---------------------------------------------------------------------------
# 3. Limpiar fuentes para reducir tamaño final
# ---------------------------------------------------------------------------
RUN rm -rf /usr/src/asterisk-${ASTERISK_VERSION}

# ---------------------------------------------------------------------------
# 4. Usuario asterisk
# ---------------------------------------------------------------------------
RUN groupadd --system asterisk \
 && useradd  --system --gid asterisk \
             --home-dir /var/lib/asterisk \
             --shell /sbin/nologin asterisk

# ---------------------------------------------------------------------------
# 5. Directorios con permisos correctos
#    /etc/asterisk viene del volumen montado en docker-compose (read-only)
#    Los demás son writable para el proceso asterisk
# ---------------------------------------------------------------------------
RUN mkdir -p \
        /var/run/asterisk \
        /etc/asterisk \
        /var/spool/asterisk/recording \
 && chown -R asterisk:asterisk \
        /var/run/asterisk \
        /var/log/asterisk \
        /var/spool/asterisk \
        /var/lib/asterisk \
        /etc/asterisk

# ---------------------------------------------------------------------------
# Puertos
# ---------------------------------------------------------------------------
EXPOSE 5060/udp 5060/tcp 5061/tcp
EXPOSE 8088/tcp 8089/tcp
EXPOSE 5038/tcp
EXPOSE 10000-10500/udp

# ---------------------------------------------------------------------------
# Entrypoint
# ---------------------------------------------------------------------------
# -f (minúscula) = "do not fork" -> Asterisk queda en foreground como PID 1 (obligatorio
#    en Docker). OJO: -F (mayúscula) es "always fork" y NO sirve aquí.
# -T = timestamp en consola
# -vvvg = verbose level 3 + log a consola (visible con docker compose logs)
# chown previo: asegura permisos sobre volúmenes montados en runtime
# ---------------------------------------------------------------------------
CMD ["/bin/sh", "-c", \
     "chown -R asterisk:asterisk /var/spool/asterisk /var/log/asterisk /var/run/asterisk 2>/dev/null; \
      exec /usr/sbin/asterisk -f -T -vvvg"]
