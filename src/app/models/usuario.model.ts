export interface Usuario {
  id: number;
  usuario: string;
  correo: string;
  contrasena?: string;
  rol?: string;
  token?: string; // Token JWT opcional
}

export interface RespuestaAuth {
  success: boolean;
  message: string;
  data?: {
    id: number;
    usuario: string;
    correo: string;
    rol?: string;
    token?: string; // Token JWT retornado por el backend
  };
  error?: string;
}
