// Types specifici per autenticazione e JWT

export interface JwtPayload {
  userId: number;
  email: string;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
}

export interface AuthenticatedUser {
  id: number;
  name: string;
  surname: string;
  email: string;
}

// Type per req.user dopo middleware auth
export interface AuthRequest extends Request {
  user?: JwtPayload;
}

// Request body types
export interface RegisterBody {
  name: string;
  surname: string;
  email: string;
  password: string;
}

export interface LoginBody {
  email: string;
  password: string;
}

export interface RefreshTokenBody {
  refreshToken: string;
}

export interface ForgotPasswordBody {
  email: string;
}

export interface ResetPasswordBody {
  token: string;
  newPassword: string;
}

export interface UpdatePasswordBody {
  currentPassword: string;
  newPassword: string;
}

export interface UpdateUserDetailsBody {
  name?: string;
  surname?: string;
  email?: string;
}