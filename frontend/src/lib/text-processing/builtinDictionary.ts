/**
 * Built-in Vietnamese pronunciation dictionary for TTS.
 *
 * Loads a static JSON file containing 17K+ entries from the vietnormalizer library:
 * - Non-Vietnamese words (container -> cong-te-no, server -> xo-vo)
 * - Acronyms (NASA -> na-sa, GDP -> tong san pham quoc noi)
 *
 * Performance: O(n_words) — splits text into words, does O(1) Map lookup per word.
 * Dictionary is loaded once and cached.
 */

interface BuiltinDict {
  ready: boolean
  promise: Promise<Record<string, string>> | null
  map: Map<string, string> | null
  error: string | null
}

const dict: BuiltinDict = {
  ready: false,
  promise: null,
  map: null,
  error: null,
}

const WORD_PATTERN = /[\w\u00C0-\u1EFF]+/g

export function loadBuiltinDict(): Promise<Record<string, string>> {
  if (dict.ready && dict.promise) return dict.promise
  if (dict.promise) return dict.promise

  dict.promise = fetch("/data/builtin-dict.json")
    .then((res) => {
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      return res.json() as Promise<Record<string, string>>
    })
    .then((entries) => {
      dict.map = new Map(Object.entries(entries))
      dict.ready = true
      return entries
    })
    .catch((err) => {
      dict.error = String(err)
      dict.ready = true
      console.warn("[BuiltinDict] Failed to load:", dict.error)
      return {}
    })

  return dict.promise
}

/**
 * Apply built-in dictionary to text.
 *
 * Splits text into words and replaces each word found in the dictionary
 * with its Vietnamese pronunciation. Uses O(1) Map lookup per word.
 *
 * @param text - The pre-normalized Vietnamese text.
 * @returns Text with dictionary words replaced.
 */
export async function applyBuiltinDictionary(text: string): Promise<string> {
  if (!text) return text

  await loadBuiltinDict()

  const map = dict.map
  if (!map || map.size === 0) return text

  WORD_PATTERN.lastIndex = 0

  return text.replace(WORD_PATTERN, (match) => {
    const lower = match.toLowerCase()
    const replacement = map.get(lower)
    if (replacement !== undefined) return replacement
    return match
  })
}
