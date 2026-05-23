// src/features/auth/schemas.ts
import { z } from 'zod'

export const RegisterSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8, 'Mot de passe minimum 8 caractères'),
  role: z.enum(['owner', 'merchant']),
  first_name: z.string().min(1),
  last_name: z.string().min(1),
})

export const LoginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
})

export const ForgotPasswordSchema = z.object({
  email: z.string().email(),
})

export const ResetPasswordSchema = z.object({
  token: z.string().min(1),
  password: z.string().min(8, 'Mot de passe minimum 8 caractères'),
})

export type RegisterInput = z.infer<typeof RegisterSchema>
export type LoginInput = z.infer<typeof LoginSchema>
export type ForgotPasswordInput = z.infer<typeof ForgotPasswordSchema>
export type ResetPasswordInput = z.infer<typeof ResetPasswordSchema>
