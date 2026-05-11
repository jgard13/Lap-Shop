export interface Usuario {
  id: number;
  usuario: string;
  correo: string;
  contrasena?: string;
}

export interface RespuestaAuth {
  success: boolean;
  message: string;
  data?: {
    id: number;
    usuario: string;
    correo: string;
  };
  error?: string;
}
