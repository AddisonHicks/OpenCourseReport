import type zipcodesType from 'zipcodes'

export const AREA_RADIUS_MILES = 75

let zipcodesModule: typeof zipcodesType | null = null
let zipcodesLoading: Promise<typeof zipcodesType> | null = null

async function getZipcodes(): Promise<typeof zipcodesType> {
  if (zipcodesModule) return zipcodesModule
  if (!zipcodesLoading) {
    zipcodesLoading = import('zipcodes').then((mod) => {
      zipcodesModule = mod.default
      return zipcodesModule
    })
  }
  return zipcodesLoading
}

export function normalizeZip(zip: string): string {
  return zip.replace(/\D/g, '').slice(0, 5)
}

export async function isValidZip(zip: string): Promise<boolean> {
  const normalized = normalizeZip(zip)
  if (normalized.length !== 5) return false
  const zipcodes = await getZipcodes()
  return zipcodes.lookup(normalized) != null
}

export async function zipDistanceMiles(
  a: string,
  b: string,
): Promise<number | null> {
  const z1 = normalizeZip(a)
  const z2 = normalizeZip(b)
  if (z1.length !== 5 || z2.length !== 5) return null
  const zipcodes = await getZipcodes()
  const distance = zipcodes.distance(z1, z2)
  return distance ?? null
}

export async function isZipWithinRadius(
  userZip: string,
  courseZip: string | null,
  radiusMiles = AREA_RADIUS_MILES,
): Promise<boolean> {
  if (!courseZip) return false
  const distance = await zipDistanceMiles(userZip, courseZip)
  return distance != null && distance <= radiusMiles
}

export async function filterReportsWithinRadius<
  T extends { courses: { zipcode: string | null } },
>(userZip: string, items: T[], radiusMiles = AREA_RADIUS_MILES): Promise<T[]> {
  const zipcodes = await getZipcodes()
  const z1 = normalizeZip(userZip)
  if (z1.length !== 5 || !zipcodes.lookup(z1)) return []

  const results: T[] = []
  for (const item of items) {
    const courseZip = item.courses.zipcode
    if (!courseZip) continue
    const z2 = normalizeZip(courseZip)
    if (z2.length !== 5) continue
    const distance = zipcodes.distance(z1, z2)
    if (distance != null && distance <= radiusMiles) {
      results.push(item)
    }
  }
  return results
}

export function isZipFormatValid(zip: string): boolean {
  return normalizeZip(zip).length === 5
}

/** Pick a representative zip for a city/state (exact city name match). */
export async function suggestZipFromCityState(
  city: string,
  state: string,
): Promise<string | null> {
  const c = city.trim()
  const s = state.trim()
  if (c.length < 2 || s.length < 2) return null

  const zipcodes = await getZipcodes()
  const matches = zipcodes.lookupByName(c, s)
  if (!matches?.length) return null

  const zips = matches
    .map((m) => m.zip)
    .filter((z): z is string => Boolean(z))
    .sort()

  return zips[0] ?? null
}
