export function getCSRFToken(): string | null {
  // Try to get from cookie
  const cookies = document.cookie.split(';')
  for (const cookie of cookies) {
    const [name, value] = cookie.trim().split('=')
    if (name === 'csrf-token') {
      return value
    }
  }
  
  // Try to get from meta tag (if server-rendered)
  const metaTag = document.querySelector('meta[name="csrf-token"]')
  if (metaTag) {
    return metaTag.getAttribute('content')
  }
  
  return null
}

export function addCSRFHeader(headers: HeadersInit = {}): HeadersInit {
  const token = getCSRFToken()
  if (token) {
    return {
      ...headers,
      'x-csrf-token': token,
    }
  }
  return headers
}

export async function fetchWithCSRF(url: string, options: RequestInit = {}): Promise<Response> {
  const headers = addCSRFHeader(options.headers as HeadersInit)
  
  return fetch(url, {
    ...options,
    headers,
    credentials: 'same-origin', // Include cookies
  })
}