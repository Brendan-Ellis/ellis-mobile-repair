export function getTaxRate(city: string): number {
  const c = city.toLowerCase()
  if (c.includes('council bluffs') || c.includes(', ia') || c.includes('iowa')) return 6.0
  if (c.includes('omaha') || c.includes(', ne') || c.includes('nebraska')) return 5.5
  return 0
}

export const DISCLAIMER = `This quote is an estimate based on the information provided. Final price may vary if additional issues are discovered during service. Any additional work will be discussed and approved before proceeding. Parts are additional unless listed above. Ellis Mobile Repair is not responsible for pre-existing damage or issues unrelated to the requested service. Quote valid for 30 days.`
