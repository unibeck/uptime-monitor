import { NextRequest } from 'next/server'

export async function GET(request: NextRequest) {
  // Only import OpenAPI when it's actually needed
  const { OpenAPI } = await import('@scalar/nextjs-openapi')
  const handler = OpenAPI({ apiDirectory: 'src/app/api' })
  
  return handler.GET(request)
}
