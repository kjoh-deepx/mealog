import { describe, expect, it, expectTypeOf } from "vitest"

import type { Meal, MealType, Person } from "@/lib/types"

describe("types", () => {
  it("compiles the meal and person interfaces", () => {
    const mealType: MealType = "lunch"

    const meal: Meal = {
      id: "meal-1",
      date: "2026-05-03",
      mealType,
      amount: 15_000,
      estimatedAmount: 14_000,
      restaurant: "식당",
      people: ["경주"],
      confirmed: true,
      receiptText: null,
      createdAt: "2026-05-03T10:00:00.000Z",
      updatedAt: "2026-05-03T10:00:00.000Z",
    }

    const person: Person = {
      name: "경주",
      mealCount: 1,
      createdAt: "2026-05-03T10:00:00.000Z",
    }

    expectTypeOf(meal.mealType).toEqualTypeOf<MealType>()
    expectTypeOf(person.mealCount).toEqualTypeOf<number>()
    expect(meal.people).toContain(person.name)
  })
})
