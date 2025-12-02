import apiClient from './apiClient'

export interface MobileBranding {
  mobileAppName?: string
  logoUrl?: string
  iconUrl?: string
}

export async function fetchMobileBranding(): Promise<MobileBranding> {
  try {
    const res = await apiClient.get<{ branding: MobileBranding }>(`/mobile/branding`)
    return res?.data?.branding || {}
  } catch (error: any) {
    // Handle 404 gracefully - endpoint may not exist yet
    if (error?.code === 'NOT_FOUND' || error?.response?.status === 404) {
      // Endpoint doesn't exist yet - return empty object silently
      return {}
    }
    // Only log unexpected errors
    if (error?.code !== 'UNAUTHORIZED' && error?.response?.status !== 401) {
      console.error('Error fetching mobile branding:', error)
    }
    return {}
  }
}


