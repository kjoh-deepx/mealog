import { describe, expect, it } from "vitest"

import { parseReceiptText } from "@/lib/receipt-parser"

describe("parseReceiptText", () => {
  it("extracts the amount and restaurant from a standard SMS-style receipt", () => {
    const text = `[Web발신]
승인
12,500원
동백식당
일시불`

    expect(parseReceiptText(text)).toEqual({
      amount: 12_500,
      restaurant: "동백식당",
    })
  })

  it("handles comma-separated and non-comma amount formats", () => {
    expect(parseReceiptText("24,000원\n마포갈비")).toEqual({
      amount: 24_000,
      restaurant: "마포갈비",
    })

    expect(parseReceiptText("24000원\n마포갈비")).toEqual({
      amount: 24_000,
      restaurant: "마포갈비",
    })
  })

  it("returns null for missing fields", () => {
    expect(parseReceiptText("18,000원\n승인\n일시불")).toEqual({
      amount: 18_000,
      restaurant: null,
    })

    expect(parseReceiptText("을지식당\n승인")).toEqual({
      amount: null,
      restaurant: null,
    })
  })

  it("returns nulls for empty text and unrelated text", () => {
    expect(parseReceiptText("")).toEqual({
      amount: null,
      restaurant: null,
    })

    expect(parseReceiptText("hello world\nthis is not a receipt")).toEqual({
      amount: null,
      restaurant: null,
    })
  })
})
