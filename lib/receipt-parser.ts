export interface ReceiptParseResult {
  amount: number | null
  restaurant: string | null
}

const NOISE_PATTERNS = [
  /^\[.*\]$/,
  /승인/,
  /일시불/,
  /할부/,
  /잔여한도/,
  /한도/,
  /누적/,
  /카드/,
  /국민/,
  /신한/,
  /삼성/,
  /현대/,
  /롯데/,
  /우리/,
  /하나/,
  /농협/,
]

function normalizeLine(line: string) {
  return line.replace(/\s+/g, " ").trim()
}

function parseAmount(line: string) {
  if (/잔여한도|이용가능|누적/.test(line)) {
    return null
  }

  const match = line.match(/(\d{1,3}(?:,\d{3})+|\d+)\s*원/)

  if (!match) {
    return null
  }

  return Number(match[1].replaceAll(",", ""))
}

function findRestaurant(lines: string[], amountLineIndex: number) {
  for (let index = amountLineIndex + 1; index < lines.length; index += 1) {
    const line = lines[index]

    if (
      !line ||
      NOISE_PATTERNS.some((pattern) => pattern.test(line)) ||
      /\d{1,3}(?:,\d{3})*\s*원/.test(line)
    ) {
      continue
    }

    return line
  }

  for (const line of lines) {
    if (
      !line ||
      NOISE_PATTERNS.some((pattern) => pattern.test(line)) ||
      /\d{1,3}(?:,\d{3})*\s*원/.test(line)
    ) {
      continue
    }

    return line
  }

  return null
}

export function parseReceiptText(text: string): ReceiptParseResult {
  const lines = text
    .split(/\r?\n/)
    .map(normalizeLine)
    .filter(Boolean)

  let amount: number | null = null
  let amountLineIndex = -1

  lines.forEach((line, index) => {
    const parsedAmount = parseAmount(line)

    if (parsedAmount !== null && amount === null) {
      amount = parsedAmount
      amountLineIndex = index
    }
  })

  return {
    amount,
    restaurant: amountLineIndex >= 0 ? findRestaurant(lines, amountLineIndex) : null,
  }
}
