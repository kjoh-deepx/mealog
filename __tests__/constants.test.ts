import { describe, expect, it } from "vitest"

import { DEFAULT_PERSON, PER_PERSON_LIMIT } from "@/lib/constants"

describe("constants", () => {
  it("exports the expected per-person limit", () => {
    expect(PER_PERSON_LIMIT).toBe(14_000)
  })

  it("exports the expected default person", () => {
    expect(DEFAULT_PERSON).toBe("경주")
  })
})
