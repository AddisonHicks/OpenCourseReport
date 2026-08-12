import {
  buildHomeOgMeta,
  getOgImageUrls,
  normalizeSiteUrl,
  type OgMeta,
} from './ogMeta'

const DEFAULT_SITE_URL = 'https://coursereport.ptc-golf.com'

function getClientSiteUrl(): string {
  if (typeof window !== 'undefined' && window.location.origin) {
    return normalizeSiteUrl(window.location.origin)
  }
  return DEFAULT_SITE_URL
}

function getClientImages() {
  return getOgImageUrls({
    OG_IMAGE_HOME: import.meta.env.VITE_OG_IMAGE_HOME,
    OG_IMAGE_COURSE: import.meta.env.VITE_OG_IMAGE_COURSE,
    OG_IMAGE_REPORT: import.meta.env.VITE_OG_IMAGE_REPORT,
    VITE_SUPABASE_URL: import.meta.env.VITE_SUPABASE_URL,
  })
}

function applyOgMeta(meta: OgMeta): void {
  document.title = meta.title

  const setByName = (name: string, content: string) => {
    let el = document.querySelector(`meta[name="${name}"]`)
    if (!el) {
      el = document.createElement('meta')
      el.setAttribute('name', name)
      document.head.appendChild(el)
    }
    el.setAttribute('content', content)
  }

  const setByProperty = (property: string, content: string) => {
    let el = document.querySelector(`meta[property="${property}"]`)
    if (!el) {
      el = document.createElement('meta')
      el.setAttribute('property', property)
      document.head.appendChild(el)
    }
    el.setAttribute('content', content)
  }

  setByName('description', meta.description)
  setByProperty('og:title', meta.title)
  setByProperty('og:description', meta.description)
  setByProperty('og:type', meta.type ?? 'website')
  setByProperty('og:url', meta.url)
  setByProperty('og:image', meta.image)
  setByName('twitter:card', 'summary_large_image')
  setByName('twitter:title', meta.title)
  setByName('twitter:description', meta.description)
  setByName('twitter:image', meta.image)
}

export function setPageMeta(meta: OgMeta): void {
  applyOgMeta(meta)
}

export function setHomePageMeta(): void {
  applyOgMeta(buildHomeOgMeta(getClientSiteUrl(), getClientImages()))
}

export function resetPageMeta(): void {
  setHomePageMeta()
}

export { buildHomeOgMeta, getOgImageUrls }
