import { ironSession } from 'next-iron-session'

export const SESSION_TTL = 157680000 // 5 years

export const session = ironSession({
  password: [
    { id: 1, password: process.env.SESSION_SECRET_1! },
    { id: 2, password: process.env.SESSION_SECRET_2! },
    { id: 3, password: process.env.SESSION_SECRET_3! },
  ],
  cookieName: 'chatskeeSession',
  cookieOptions: {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
  },
  ttl: SESSION_TTL,
})
