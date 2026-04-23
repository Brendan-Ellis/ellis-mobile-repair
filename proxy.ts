import { NextRequest, NextResponse } from 'next/server'
import { decrypt } from '@/lib/session'

const publicRoutes = ['/', '/login', '/book', '/book/success']

export default async function proxy(req: NextRequest) {
  const path = req.nextUrl.pathname
  const isPublic = publicRoutes.includes(path)

  const token = req.cookies.get('ems-session')?.value
  const session = await decrypt(token)

  if (!isPublic && !session) {
    return NextResponse.redirect(new URL('/login', req.nextUrl))
  }

  if (path === '/login' && session) {
    return NextResponse.redirect(new URL('/admin', req.nextUrl))
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico|.*\\.(?:png|jpg|jpeg|gif|webp|svg|ico)$).*)'],
}
