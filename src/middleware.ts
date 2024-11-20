import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { jwtVerify } from 'jose'

// Create a TextEncoder to work with the JWT verification
const textEncoder = new TextEncoder()

export async function middleware(request: NextRequest) {
  const token = request.cookies.get('auth_token')?.value
  const pathname = request.nextUrl.pathname

  console.log('Middleware triggered for pathname:', pathname)
  console.log('Token present:', !!token)

  // Exclude static files, API routes, and login page from authentication check
  if (
    pathname.startsWith('/_next') ||
    pathname.startsWith('/api') ||
    pathname.startsWith('/login') ||
    pathname.includes('.')
  ) {
    console.log('Excluded path, proceeding without check')
    return NextResponse.next()
  }

  if (!token) {
    console.log('No token found, redirecting to login')
    return NextResponse.redirect(new URL('/login', request.url))
  }

  try {
    // Convert JWT_SECRET to Uint8Array for jose
    const secret = textEncoder.encode(process.env.JWT_SECRET!)
    
    // Verify the token using jose instead of jsonwebtoken
    const { payload } = await jwtVerify(token, secret)
    console.log('Token verified successfully:', payload)
    
    return NextResponse.next()
  } catch (error) {
    console.error('Token verification failed:', error)
    // Clear the invalid token
    const response = NextResponse.redirect(new URL('/login', request.url))
    response.cookies.delete('auth_token')
    return response
  }
}

// Specify which routes this middleware should protect
export const config = {
  matcher: [
    '/((?!api|_next/static|_next/image|favicon.ico).*)',
  ]
}