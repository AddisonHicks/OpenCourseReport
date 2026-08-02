import zipcodes from 'npm:zipcodes@8.0.0'

export const DEFAULT_RADIUS_MILES = 75

const US_STATES = [
  'AL', 'AK', 'AZ', 'AR', 'CA', 'CO', 'CT', 'DE', 'DC', 'FL', 'GA', 'HI', 'ID',
  'IL', 'IN', 'IA', 'KS', 'KY', 'LA', 'ME', 'MD', 'MA', 'MI', 'MN', 'MS', 'MO',
  'MT', 'NE', 'NV', 'NH', 'NJ', 'NM', 'NY', 'NC', 'ND', 'OH', 'OK', 'OR', 'PA',
  'RI', 'SC', 'SD', 'TN', 'TX', 'UT', 'VT', 'VA', 'WA', 'WV', 'WI', 'WY',
] as const

const STATE_NAMES: Record<string, string> = {
  alabama: 'AL', alaska: 'AK', arizona: 'AZ', arkansas: 'AR', california: 'CA',
  colorado: 'CO', connecticut: 'CT', delaware: 'DE', 'district of columbia': 'DC',
  florida: 'FL', georgia: 'GA', hawaii: 'HI', idaho: 'ID', illinois: 'IL',
  indiana: 'IN', iowa: 'IA', kansas: 'KS', kentucky: 'KY', louisiana: 'LA',
  maine: 'ME', maryland: 'MD', massachusetts: 'MA', michigan: 'MI',
  minnesota: 'MN', mississippi: 'MS', missouri: 'MO', montana: 'MT',
  nebraska: 'NE', nevada: 'NV', 'new hampshire': 'NH', 'new jersey': 'NJ',
  'new mexico': 'NM', 'new york': 'NY', 'north carolina': 'NC',
  'north dakota': 'ND', ohio: 'OH', oklahoma: 'OK', oregon: 'OR',
  pennsylvania: 'PA', 'rhode island': 'RI', 'south carolina': 'SC',
  'south dakota': 'SD', tennessee: 'TN', texas: 'TX', utah: 'UT',
  vermont: 'VT', virginia: 'VA', washington: 'WA', 'west virginia': 'WV',
  wisconsin: 'WI', wyoming: 'WY',
}

export function normalizeZip(zip: string): string {
  return zip.replace(/\D/g, '').slice(0, 5)
}

export function normalizeState(input: string): string | null {
  const trimmed = input.trim()
  if (trimmed.length === 2) {
    const code = trimmed.toUpperCase()
    return (US_STATES as readonly string[]).includes(code) ? code : null
  }
  return STATE_NAMES[trimmed.toLowerCase()] ?? null
}

export function suggestZipFromCityState(
  city: string,
  state: string,
): string | null {
  const c = city.trim()
  const s = state.trim()
  if (c.length < 2 || s.length < 2) return null
  const matches = zipcodes.lookupByName(c, s)
  if (!matches?.length) return null
  const zips = matches
    .map((m: { zip?: string }) => m.zip)
    .filter((z: string | undefined): z is string => Boolean(z))
    .sort()
  return zips[0] ?? null
}

export function isZipWithinRadius(
  centerZip: string,
  courseZip: string | null,
  radiusMiles = DEFAULT_RADIUS_MILES,
): boolean {
  if (!courseZip) return false
  const z1 = normalizeZip(centerZip)
  const z2 = normalizeZip(courseZip)
  if (z1.length !== 5 || z2.length !== 5) return false
  const distance = zipcodes.distance(z1, z2)
  return distance != null && distance <= radiusMiles
}
