export interface ParsedChunk {
  emotion: string;
  text: string;
}

const EMOTION_TAG_REGEX = /\(([^)]+)\)/g;

export function parseEmotionTags(text: string): ParsedChunk[] {
  const chunks: ParsedChunk[] = [];
  const textMatches: Array<{ index: number; length: number }> = [];

  let match;
  while ((match = EMOTION_TAG_REGEX.exec(text)) !== null) {
    textMatches.push({ index: match.index, length: match[0].length });
  }

  if (textMatches.length === 0 && text.trim()) {
    return [{ emotion: 'bình thường', text: text.trim() }];
  }

  for (let i = 0; i < textMatches.length; i++) {
    const tagMatch = textMatches[i];
    const emotion = text.slice(tagMatch.index + 1, tagMatch.index + tagMatch.length - 1)
      .toLowerCase()
      .trim();
    
    const tagEndIndex = tagMatch.index + tagMatch.length;
    const nextTagStartIndex = textMatches[i + 1]?.index ?? text.length;
    const textContent = text.slice(tagEndIndex, nextTagStartIndex).trim();
    
    if (textContent) {
      chunks.push({ emotion, text: textContent });
    }
  }

  return chunks;
}

export function stripEmotionTags(text: string): string {
  return text.replace(EMOTION_TAG_REGEX, '').replace(/\s+/g, ' ').trim();
}