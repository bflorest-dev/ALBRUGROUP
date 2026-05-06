import { z } from 'zod';

const schemaErrorToMessage = (error: z.ZodError): string =>
  error.issues
    .slice(0, 4)
    .map((issue) => `${issue.path.join('.') || '<root>'}: ${issue.message}`)
    .join('; ');

export const parseApiResponse = <T>(
  schema: z.ZodType<T>,
  payload: unknown,
  context: string,
): T => {
  const parsed = schema.safeParse(payload);
  if (!parsed.success) {
    throw new Error(`Contrato API invalido en ${context}. ${schemaErrorToMessage(parsed.error)}`);
  }
  return parsed.data;
};

const isoDateStringSchema = z.string().min(1);

// ============================================================================
// AUTH
// ============================================================================

export const estadoAccesoResponseSchema = z
  .object({
    passwordInicializada: z.boolean(),
  })
  .passthrough();

export const authLoginResponseSchema = z
  .object({
    token: z.string().min(1),
    type: z.string().min(1),
    username: z.string().min(1),
    empleadoId: z.coerce.number().int(),
    nombreCompleto: z.string().min(1),
    roles: z.array(z.string()),
  })
  .passthrough();

export const forgotPasswordResponseSchema = z
  .object({
    message: z.string().optional(),
    success: z.boolean().optional(),
    username: z.string().optional(),
    password: z.string().optional(),
  })
  .passthrough();

export const usuarioResponseSchema = z
  .object({
    id: z.coerce.number().int(),
    username: z.string().min(1),
    email: z.string(),
    empleadoId: z.coerce.number().int(),
    nombreCompleto: z.string().min(1),
    dni: z.string().optional(),
    activo: z.boolean(),
    roles: z.array(z.string()),
  })
  .passthrough();

// ============================================================================
// APPLICANTS
// ============================================================================

export const postulanteResponseSchema = z
  .object({
    id: z.coerce.number().int(),
    nombres: z.string().min(1),
    apellidos: z.string().min(1),
    email: z.string().optional(),
    phoneMobile: z.string().optional(),
    celular: z.string().optional(),
    documentType: z.string().optional(),
    documentNumber: z.string().optional(),
    positionOfInterest: z.string().optional(),
    campaign: z.string().optional(),
    company: z.string().optional(),
    createdAt: z.string().optional(),
    updatedAt: z.string().optional(),
  })
  .passthrough();

export const postulanteResponseArraySchema = z.array(postulanteResponseSchema);

// ============================================================================
// LEADS
// ============================================================================

export const campanaResponseSchema = z
  .object({
    id: z.coerce.number().int(),
    nombre: z.string().min(1),
    numeroWhatsappEmpresa: z.string().min(1),
    activo: z.boolean(),
    idCuentaPublicitaria: z.coerce.number().int(),
    numeroCuenta: z.string().min(1),
    nombreCuenta: z.string().min(1),
    idProveedor: z.coerce.number().int(),
    nombreProveedor: z.string().min(1),
    updatedAt: isoDateStringSchema.nullable(),
  })
  .passthrough();

export const campanaResponseArraySchema = z.array(campanaResponseSchema);

export const cuentaPublicitariaResponseSchema = z
  .object({
    id: z.coerce.number().int(),
    numeroCuenta: z.string().min(1),
    nombreCuenta: z.string().min(1),
    activo: z.boolean(),
  })
  .passthrough();

export const cuentaPublicitariaResponseArraySchema = z.array(cuentaPublicitariaResponseSchema);

export const leadAsesorDetalleResponseSchema = z
  .object({
    id: z.coerce.number().int(),
    fechaAsignacion: z.string(),
    lastEntryAt: z.string(),
    prefijo: z.string(),
    lead: z.string(),
    nombreCampana: z.string(),
    nombreProveedorCampana: z.string(),
    base: z.string(),
    estadoSeguimiento: z.string(),
    idAsesorAsignado: z.coerce.number().int(),
    nombreAsesorAsignado: z.string(),
    tipoDocumento: z.string(),
    numeroDocumentoTitularServicio: z.string(),
    nombreTitular: z.string(),
    celularRegistro: z.string(),
    celularReferencia: z.string(),
    correo: z.string(),
    numeroDocumentoTitularCelularRegistro: z.string(),
    nombreTitularCelularRegistro: z.string(),
    ubigeoNacimiento: z.string(),
    ubigeoDomicilio: z.string(),
    tipoDomicilio: z.string(),
    tipoVia: z.string(),
    via: z.string(),
    direccion: z.string(),
    referencia: z.string(),
    latitud: z.coerce.number(),
    longitud: z.coerce.number(),
    urbanizacion: z.string(),
    numero: z.string(),
    manzana: z.string(),
    lote: z.string(),
    nombreEdificio: z.string(),
    nombreCondominio: z.string(),
    piso: z.string(),
    interior: z.string(),
  })
  .passthrough();

export const leadAsesorVentasResponseSchema = z
  .object({
    id: z.coerce.number().int(),
    fechaAsignacion: z.string(),
    prefijo: z.string(),
    lead: z.string(),
    nombreTitular: z.string(),
    correo: z.string(),
    estadoSeguimiento: z.string(),
  })
  .passthrough();

export const leadAsesorVentasResponseArraySchema = z.array(leadAsesorVentasResponseSchema);

export const leadGtrResponseSchema = z
  .object({
    id: z.coerce.number().int(),
    createdAt: z.string(),
    prefijo: z.string(),
    lead: z.string(),
    nombreCampana: z.string(),
    nombreProveedorCampana: z.string(),
    base: z.string(),
    nombreTitular: z.string(),
    codigoTipificacion: z.string(),
    codigoSubtipificacion: z.string(),
    nombreAsesorAsignado: z.string(),
    estadoSeguimiento: z.string(),
    reasignaciones: z.coerce.number().int(),
  })
  .passthrough();

export const leadGtrResponseArraySchema = z.array(leadGtrResponseSchema);

export const eventoResponseSchema = z
  .object({
    id: z.coerce.number().int(),
    idLead: z.coerce.number().int(),
    idCampana: z.coerce.number().int(),
    idActor: z.coerce.number().int(),
    nombreActor: z.string(),
    rolActor: z.string(),
    idAsesorAsignado: z.coerce.number().int(),
    nombreAsesorAsignado: z.string(),
    accion: z.string(),
    etapa: z.string(),
    tipificacion: z.string(),
    subtipificacion: z.string(),
    fechaInstalacion: z.string(),
    comentario: z.string(),
    createdAt: z.string(),
  })
  .passthrough();

export const eventoResponseArraySchema = z.array(eventoResponseSchema);

export const adicionalResponseSchema = z
  .object({
    id: z.coerce.number().int(),
    nombre: z.string(),
    precioUnitario: z.coerce.number(),
    idProveedor: z.coerce.number().int(),
    nombreProveedor: z.string(),
    activo: z.boolean(),
  })
  .passthrough();

export const adicionalResponseArraySchema = z.array(adicionalResponseSchema);

export const internetResponseSchema = z
  .object({
    id: z.coerce.number().int(),
    velocidad: z.coerce.number(),
    unidad: z.string(),
    tecnologia: z.string(),
  })
  .passthrough();

export const televisionResponseSchema = z
  .object({
    id: z.coerce.number().int(),
    nombre: z.string(),
    cantidadCanales: z.coerce.number().int(),
  })
  .passthrough();

export const telefonoResponseSchema = z
  .object({
    id: z.coerce.number().int(),
    minutos: z.coerce.number().int(),
    descripcion: z.string(),
  })
  .passthrough();

export const planAdicionalResponseSchema = z
  .object({
    idAdicional: z.coerce.number().int(),
    nombreAdicional: z.string(),
    cantidadIncluida: z.coerce.number().int(),
    permiteCompraAdicional: z.boolean(),
    cantidadMaximaAdicional: z.coerce.number().int(),
  })
  .passthrough();

export const planResponseSchema = z
  .object({
    id: z.coerce.number().int(),
    nombre: z.string(),
    precio: z.coerce.number(),
    precioPromocional: z.coerce.number().default(0),
    mesesPromocionPrecio: z.coerce.number().int().default(0),
    vigenciaDesde: z.string(),
    vigenciaHasta: z.string().nullable().default(null),
    idProveedor: z.coerce.number().int(),
    nombreProveedor: z.string(),
    internet: internetResponseSchema.nullable(),
    television: televisionResponseSchema.nullable(),
    telefono: telefonoResponseSchema.nullable(),
    velocidadPromocional: z.coerce.number().int().default(0),
    mesesPromocionVelocidad: z.coerce.number().int().default(0),
    idZona: z.coerce.number().int().nullable().default(null),
    nombreZona: z.string().nullable().default(null),
    adicionales: z.array(planAdicionalResponseSchema),
    activo: z.boolean(),
  })
  .passthrough();

export const planResponseArraySchema = z.array(planResponseSchema);

export const serviciosProveedorResponseSchema = z
  .object({
    idProveedor: z.coerce.number().int(),
    nombreProveedor: z.string(),
    internets: z.array(internetResponseSchema),
    televisiones: z.array(televisionResponseSchema),
    telefonos: z.array(telefonoResponseSchema),
  })
  .passthrough();

export const promocionComercialResponseSchema = z
  .object({
    id: z.coerce.number().int(),
    reglaComercial: z.string(),
    idProveedor: z.coerce.number().int(),
    nombreProveedor: z.string(),
    idZona: z.coerce.number().int(),
    nombreZona: z.string(),
    idsPlanes: z.array(z.coerce.number().int()),
    nombresPlanes: z.array(z.string()),
    activo: z.boolean(),
    createdAt: z.string(),
  })
  .passthrough();

export const promocionComercialResponseArraySchema = z.array(promocionComercialResponseSchema);

export const proveedorResponseSchema = z
  .object({
    id: z.coerce.number().int(),
    nombre: z.string(),
    activo: z.boolean(),
    createdAt: z.string().nullable(),
  })
  .passthrough();

export const proveedorResponseArraySchema = z.array(proveedorResponseSchema);

export const zonaReglaResponseSchema = z
  .object({
    id: z.coerce.number().int(),
    nivelGeografico: z.string(),
    geoId: z.coerce.number().int(),
    criterio: z.string(),
  })
  .passthrough();

export const zonaResponseSchema = z
  .object({
    id: z.coerce.number().int(),
    nombre: z.string(),
    activo: z.boolean(),
    createdAt: z.string(),
    updatedAt: z.string(),
    reglas: z.array(zonaReglaResponseSchema),
  })
  .passthrough();

export const zonaResponseArraySchema = z.array(zonaResponseSchema);

export const subtipificacionResponseSchema = z
  .object({
    id: z.coerce.number().int(),
    codigo: z.string(),
    descripcion: z.string(),
    orden: z.coerce.number().int(),
  })
  .passthrough();

export const tipificacionResponseSchema = z
  .object({
    id: z.coerce.number().int(),
    codigo: z.string(),
    descripcion: z.string(),
    orden: z.coerce.number().int(),
    subtipificaciones: z.array(subtipificacionResponseSchema),
  })
  .passthrough();

export const catalogoResponseSchema = z
  .object({
    etapa: z.string(),
    tipificaciones: z.array(tipificacionResponseSchema),
  })
  .passthrough();

export const leadCommandResponseSchema = z
  .object({
    success: z.boolean().optional(),
    message: z.string().optional(),
  })
  .passthrough();

export const departamentoResponseSchema = z
  .object({
    id: z.coerce.number().int(),
    codigo: z.string(),
    nombre: z.string(),
  })
  .passthrough();

export const departamentoResponseArraySchema = z.array(departamentoResponseSchema);

export const provinciaResponseSchema = z
  .object({
    id: z.coerce.number().int(),
    codigo: z.string(),
    nombre: z.string(),
    idDepartamento: z.coerce.number().int(),
  })
  .passthrough();

export const provinciaResponseArraySchema = z.array(provinciaResponseSchema);

export const distritoResponseSchema = z
  .object({
    id: z.coerce.number().int(),
    codigo: z.string(),
    nombre: z.string(),
    idProvincia: z.coerce.number().int(),
    idDepartamento: z.coerce.number().int(),
  })
  .passthrough();

export const distritoResponseArraySchema = z.array(distritoResponseSchema);
