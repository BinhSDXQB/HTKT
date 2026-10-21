import 'server-only'

import { SignJWT, jwtVerify } from 'jose'
import { cookies } from 'next/headers'
import { cookieSecure } from './cookie-an-toan'

export type SessionPayload = {
  userId: string
  email: string
  name: string
  roleId: string
  roleName: string
  departmentCode?: string | null
  // Module phòng ban được phép truy cập (vd: 'office', 'htkt') — middleware chặn nhanh ở edge
  allowedModules?: string[]
  iat?: number
  exp?: number
}

const SESSION_COOKIE = 'session'
const SESSION_DURATION_HOURS = 8

function getSecret(): Uint8Array {
  const secret = process.env.SESSION_SECRET
  if (!secret) throw new Error('SESSION_SECRET environment variable is not set')
  return new TextEncoder().encode(secret)
}

export async function encrypt(payload: SessionPayload): Promise<string> {
  return new SignJWT({ ...payload })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime(`${SESSION_DURATION_HOURS}h`)
    .sign(getSecret())
}

export async function decrypt(token: string): Promise<SessionPayload | null> {
  try {
    const { payload } = await jwtVerify(token, getSecret(), {
      algorithms: ['HS256'],
    })
    return payload as unknown as SessionPayload
  } catch {
    return null
  }
}

export async function createSession(payload: SessionPayload): Promise<void> {
  const token = await encrypt(payload)
  const cookieStore = await cookies()
  cookieStore.set(SESSION_COOKIE, token, {
    httpOnly: true,
    secure: cookieSecure(process.env),
    sameSite: 'lax',
    path: '/',
    maxAge: SESSION_DURATION_HOURS * 60 * 60,
  })
}

export async function getSession(): Promise<SessionPayload | null> {
  const cookieStore = await cookies()
  const token = cookieStore.get(SESSION_COOKIE)?.value
  if (!token) return null
  return decrypt(token)
}

export async function deleteSession(): Promise<void> {
  const cookieStore = await cookies()
  cookieStore.delete(SESSION_COOKIE)
}
