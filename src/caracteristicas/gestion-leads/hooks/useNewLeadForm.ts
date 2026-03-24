/**
 * Hook para formulario de nuevos leads
 */

export interface NewLeadFormData {
  nombres: string;
  apellidos: string;
  email?: string;
  telefono?: string;
  campana?: string;
  empresa?: string;
  posicion?: string;
  [key: string]: string | undefined;
}

export const useNewLeadForm = () => {
  return {
    formData: {} as NewLeadFormData,
    setFormData: () => {},
    handleSubmit: () => {},
  };
};
