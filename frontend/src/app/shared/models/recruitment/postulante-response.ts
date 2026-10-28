export interface PostulanteResponse {
  id: number;
  nombres: string;
  apellidos: string;
  tipoDocumento: string;
  documento: string;
  celular: string;
  numeroExclusivoLlamadas?: string | null;
  fechaNacimiento: string;
  listaNegra: boolean;
  createdAt: string;
  updatedAt: string;
}
