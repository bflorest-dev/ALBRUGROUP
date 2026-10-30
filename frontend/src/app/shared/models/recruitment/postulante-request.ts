export interface PostulanteRequest {
  nombres: string;
  apellidos: string;
  tipoDocumento: string;
  documento: string;
  celular: string;
  numeroExclusivoLlamadas?: string | null;
  usuarioMeta?: string | null;
  fechaNacimiento: string;
}
