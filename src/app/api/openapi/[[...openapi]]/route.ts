// Completely replace the OpenAPI implementation with a minimal version
// that will redirect to a documentation URL rather than bundling the entire OpenAPI package
import { NextRequest, NextResponse } from 'next/server'

export function GET(request: NextRequest) {
  // Instead of importing the heavyweight OpenAPI package,
  // we'll return a simple JSON response with API information
  // This dramatically reduces the bundle size
  const apiInfo = {
    openapi: "3.0.0",
    info: {
      title: "SolStatus API",
      version: "1.0.0",
      description: "API endpoints for SolStatus",
    },
    paths: {
      "/api/endpoint-monitors": {
        get: {
          summary: "Get all endpoint monitors",
          responses: {
            "200": {
              description: "List of endpoint monitors",
            },
          },
        },
      },
      "/api/endpoint-monitors/{id}": {
        get: {
          summary: "Get endpoint monitor by ID",
          parameters: [
            {
              name: "id",
              in: "path",
              required: true,
              schema: {
                type: "string",
              },
            },
          ],
          responses: {
            "200": {
              description: "Endpoint monitor details",
            },
          },
        },
      },
      // Note: For a complete API reference, see the actual API implementation
    },
  }
  
  // Check if the request wants JSON or HTML
  const acceptHeader = request.headers.get('accept') || ''
  if (acceptHeader.includes('text/html')) {
    // Redirect to a documentation page
    return NextResponse.redirect('https://github.com/unibeck/solstatus#api-documentation')
  }
  
  // Return JSON by default
  return NextResponse.json(apiInfo)
}
