import { z } from 'zod';

export const contactoResponseSchema = z
  .object({
    id: z.coerce.number().int(),
    fecha: z.string(),
    resultado: z.string(),
    notas: z.string(),
    createdAt: z.string(),
  })
  .passthrough();

export const tipificacionResponseSchema = z
  .object({
    success: z.boolean(),
    message: z.string(),
  })
  .passthrough();

export const ofertaResponseSchema = z
  .object({
    id: z.coerce.number().int(),
    idPlan: z.coerce.number().int(),
    idPromocion: z.coerce.number().int().optional(),
    precioNegoziado: z.coerce.number().optional(),
    estado: z.enum(['PENDIENTE', 'ACEPTADA', 'RECHAZADA']),
    createdAt: z.string(),
  })
  .passthrough();

export const direccionResponseSchema = z
  .object({
    id: z.coerce.number().int(),
    tipoVia: z.string(),
    via: z.string(),
    numero: z.string(),
    ciudad: z.string(),
    verificada: z.boolean(),
  })
  .passthrough();

export const datosPreventaResponseSchema = z
  .object({
    id: z.coerce.number().int(),
    tipoDocumento: z.string(),
    celularRegistro: z.string(),
    correo: z.string(),
    updatedAt: z.string(),
    nombreTitular: z.string().optional(),
    apellidoTitular: z.string().optional(),
    numeroDocumento: z.string().optional(),
    numeroDocumentoTitularServicio: z.string().optional(),
    nombreTitularServicio: z.string().optional(),
    ubigeoNacimiento: z.string().optional(),
    celularReferencia: z.string().optional(),
    numeroDocumentoTitularCelularRegistro: z.string().optional(),
    nombreTitularCelularRegistro: z.string().optional(),
    fechaNacimiento: z.string().optional(),
  })
  .passthrough();

