/**
 * Line-level diff between two versions of the session document, used to flash
 * what a prompt just changed. Classic LCS — the docs are a page or two, so
 * O(n·m) is nothing.
 */

export type DiffBlock = {
  type: 'same' | 'added' | 'changed'
  lines: string[]
}

export function diffLines(prev: string, next: string): DiffBlock[] {
  const a = prev.split('\n')
  const b = next.split('\n')

  // lcs[i][j] = length of the LCS of a[i:] and b[j:]
  const lcs: number[][] = Array.from({ length: a.length + 1 }, () => new Array(b.length + 1).fill(0))
  for (let i = a.length - 1; i >= 0; i--) {
    for (let j = b.length - 1; j >= 0; j--) {
      lcs[i][j] = a[i] === b[j] ? lcs[i + 1][j + 1] + 1 : Math.max(lcs[i + 1][j], lcs[i][j + 1])
    }
  }

  // Walk the table, tagging each output line; removed lines don't render, but
  // a removal adjacent to an addition marks that block 'changed' not 'added'.
  const blocks: DiffBlock[] = []
  let removedPending = false

  const push = (type: DiffBlock['type'], line: string) => {
    const last = blocks[blocks.length - 1]
    if (last && last.type === type) last.lines.push(line)
    else blocks.push({ type, lines: [line] })
  }

  let i = 0
  let j = 0
  while (i < a.length && j < b.length) {
    if (a[i] === b[j]) {
      removedPending = false
      push('same', b[j])
      i++
      j++
    } else if (lcs[i + 1][j] >= lcs[i][j + 1]) {
      removedPending = true
      i++
    } else {
      push(removedPending ? 'changed' : 'added', b[j])
      j++
    }
  }
  while (j < b.length) {
    push(removedPending ? 'changed' : 'added', b[j])
    j++
  }

  return blocks
}

/** First non-same block's first non-empty line — where the buddy points. */
export function firstChange(blocks: DiffBlock[]): string | null {
  for (const block of blocks) {
    if (block.type === 'same') continue
    const line = block.lines.find((l) => l.trim())
    if (line) return line
  }
  return null
}
