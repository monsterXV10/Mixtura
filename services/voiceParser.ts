export interface ParsedVoiceItem {
  nom_produit: string
  quantite: number | null
  unite: string | null
  prix: number | null
  confidence: 'high' | 'medium' | 'low'
}

const UNIT_ALIASES: Record<string, string> = {
  cl: 'cl', centilitres: 'cl', centilitre: 'cl',
  ml: 'ml', millilitres: 'ml', millilitre: 'ml',
  l: 'l', litres: 'l', litre: 'l',
  g: 'g', grammes: 'g', gramme: 'g',
  kg: 'kg', kilos: 'kg', kilo: 'kg', kilogrammes: 'kg',
  oz: 'oz', onces: 'oz',
  pièce: 'pièce', pièces: 'pièce',
  bouteille: 'bouteille', bouteilles: 'bouteille',
  trait: 'trait', traits: 'trait', dash: 'trait',
  goutte: 'goutte', gouttes: 'goutte',
}

const NUMBER_WORDS: Record<string, number> = {
  un: 1, une: 1, deux: 2, trois: 3, quatre: 4, cinq: 5,
  six: 6, sept: 7, huit: 8, neuf: 9, dix: 10,
  onze: 11, douze: 12, quinze: 15, vingt: 20, trente: 30,
  quarante: 40, cinquante: 50, cent: 100,
  demi: 0.5, quart: 0.25,
}

function parseNumberWord(word: string): number | null {
  const lower = word.toLowerCase()
  if (NUMBER_WORDS[lower] !== undefined) return NUMBER_WORDS[lower]
  const num = parseFloat(lower.replace(',', '.'))
  return isNaN(num) ? null : num
}

export function parseVoiceTranscript(transcript: string): ParsedVoiceItem[] {
  const text = transcript.toLowerCase().trim()
  const segments = text.split(/\s+(?:et|puis|ensuite|après|aussi)\s+/)
  const items: ParsedVoiceItem[] = []

  for (const segment of segments) {
    const item = parseSegment(segment.trim())
    if (item) items.push(item)
  }

  if (items.length === 0) {
    const single = parseSegment(text)
    if (single) items.push(single)
  }

  return items
}

function parseSegment(text: string): ParsedVoiceItem | null {
  if (!text || text.length < 3) return null

  let quantite: number | null = null
  let unite: string | null = null
  let prix: number | null = null
  let nom = text

  // Extraction du prix
  const pricePatterns: RegExp[] = [
    /(?:à|au prix de|prix|coût|coute|coûte)\s+(\d+(?:[.,]\d+)?)\s*(?:euros?|€)/i,
    /(\d+)\s+euros?\s+(\d{2})\b/i,
    /(\d+(?:[.,]\d+)?)\s*(?:euros?|€)/i,
  ]

  for (const pattern of pricePatterns) {
    const match = nom.match(pattern)
    if (match) {
      if (pattern === pricePatterns[1]) {
        prix = parseFloat(`${match[1]}.${match[2]}`)
      } else {
        prix = parseFloat(match[1].replace(',', '.'))
      }
      nom = nom.replace(match[0], '').trim()
      break
    }
  }

  // Extraction quantité + unité
  const unitPattern = Object.keys(UNIT_ALIASES).join('|')
  const numberPattern = Object.keys(NUMBER_WORDS).join('|')
  const qtyUnitRe = new RegExp(
    `(\\d+(?:[.,]\\d+)?|${numberPattern})\\s+(${unitPattern})(?:\\s+de)?`,
    'i'
  )

  const qtyMatch = nom.match(qtyUnitRe)
  if (qtyMatch) {
    quantite = parseNumberWord(qtyMatch[1])
    unite = UNIT_ALIASES[qtyMatch[2].toLowerCase()] ?? qtyMatch[2].toLowerCase()
    nom = nom.replace(qtyMatch[0], '').trim()
  } else {
    const qtyOnlyRe = new RegExp(`^(\\d+(?:[.,]\\d+)?|${numberPattern})\\s+`, 'i')
    const qtyOnly = nom.match(qtyOnlyRe)
    if (qtyOnly) {
      quantite = parseNumberWord(qtyOnly[1])
      nom = nom.replace(qtyOnly[0], '').trim()
    }
  }

  // Nettoyage du nom produit
  nom = nom
    .replace(/^(?:de\s+|du\s+|d'|le\s+|la\s+|les\s+|un\s+|une\s+)/i, '')
    .replace(/\s+/g, ' ')
    .trim()
    .split(' ')
    .map(w => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ')

  if (!nom || nom.length < 2) return null

  const filled = [quantite !== null, unite !== null, prix !== null].filter(Boolean).length
  const confidence: ParsedVoiceItem['confidence'] =
    filled >= 2 ? 'high' : filled === 1 ? 'medium' : 'low'

  return { nom_produit: nom, quantite, unite, prix, confidence }
}
