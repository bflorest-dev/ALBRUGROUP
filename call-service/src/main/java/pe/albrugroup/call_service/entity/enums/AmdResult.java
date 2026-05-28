package pe.albrugroup.call_service.entity.enums;

/**
 * Resultado de la deteccion de contestador automatico (Answering Machine Detection).
 *
 * Asterisk expone la aplicacion AMD() en su dialplan. Analiza los primeros 2-4 segundos
 * de audio tras el "contestado" y clasifica la fuente:
 *
 *  - HUMAN     : detecto patron de respuesta humana corta seguida de silencio.
 *                Es seguro pasar la llamada al agente.
 *  - MACHINE   : detecto monologo continuo (buzon de voz / IVR de operadora).
 *                Hay que descartar la llamada antes de ocupar a un agente. El estado
 *                final de la llamada queda como CallStatus.ANSWERING_MACHINE y NO
 *                debe contar como "contestada" en metricas de campaña.
 *  - NOTSURE   : el audio no permitio decidir con confianza. Politica configurable:
 *                pasarla al agente (mas tasa de contactacion, mas ruido) o tratarla
 *                como MACHINE (mas estricto, menos ruido).
 *  - HANGUP    : la otra parte colgo durante el analisis AMD antes de que pudiera
 *                clasificar.
 *  - NOT_RUN   : AMD no se ejecuto en esta llamada (Fase 1, llamada interna, o el
 *                dialplan decidio omitirlo). Es el valor por defecto.
 */
public enum AmdResult {
    HUMAN,
    MACHINE,
    NOTSURE,
    HANGUP,
    NOT_RUN
}
