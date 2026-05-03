import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"

import { DEFAULT_PERSON } from "@/lib/constants"
import type { Meal } from "@/lib/types"
import {
  deleteMeal,
  deletePerson,
  getMealById,
  getMeals,
  getPeople,
  getSettings,
  saveMeal,
  savePerson,
  saveSettings,
  updateMeal,
} from "@/lib/storage"

function createMeal(overrides: Partial<Meal> = {}): Meal {
  return {
    id: "meal-1",
    date: "2026-05-03",
    mealType: "lunch",
    headcount: 2,
    perPersonLimit: 14_000,
    amount: 14_000,
    estimatedAmount: 14_000,
    restaurant: "식당",
    people: [DEFAULT_PERSON, "민수"],
    confirmed: true,
    receiptText: "14,000원\n식당",
    createdAt: "2026-05-03T10:00:00.000Z",
    updatedAt: "2026-05-03T10:00:00.000Z",
    ...overrides,
  }
}

describe("storage", () => {
  beforeEach(() => {
    window.localStorage.clear()
    vi.useFakeTimers()
    vi.setSystemTime(new Date("2026-05-03T12:00:00.000Z"))
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it("saves meals, reads them back, gets by id, updates, and deletes", () => {
    const first = createMeal()
    const second = createMeal({
      id: "meal-2",
      date: "2026-05-04",
      updatedAt: "2026-05-04T09:00:00.000Z",
      restaurant: "두번째 식당",
    })

    saveMeal(first)
    saveMeal(second)

    expect(getMeals().map((meal) => meal.id)).toEqual(["meal-2", "meal-1"])
    expect(getMealById("meal-1")).toMatchObject({
      id: "meal-1",
      restaurant: "식당",
    })
    expect(getMealById("missing")).toBeNull()

    updateMeal({
      ...first,
      restaurant: "수정된 식당",
      updatedAt: "2026-05-05T08:00:00.000Z",
    })

    expect(getMealById("meal-1")).toMatchObject({
      id: "meal-1",
      restaurant: "수정된 식당",
    })

    deleteMeal("meal-2")

    expect(getMeals().map((meal) => meal.id)).toEqual(["meal-1"])
  })

  it("persists meal data across calls and replaces duplicate ids", () => {
    saveMeal(
      createMeal({
        people: ["민수", "민수"],
      })
    )

    expect(getMeals()).toHaveLength(1)
    expect(getMeals()[0]?.people).toEqual([DEFAULT_PERSON, "민수"])

    saveMeal(
      createMeal({
        restaurant: "대체된 식당",
        updatedAt: "2026-05-03T11:00:00.000Z",
      })
    )

    expect(getMeals()).toHaveLength(1)
    expect(getMeals()[0]?.restaurant).toBe("대체된 식당")
  })

  it("persists settings with a safe default", () => {
    expect(getSettings()).toEqual({
      perPersonLimit: 14_000,
    })

    saveSettings({ perPersonLimit: 16_500 })

    expect(getSettings()).toEqual({
      perPersonLimit: 16_500,
    })

    saveSettings({ perPersonLimit: 0 })

    expect(getSettings()).toEqual({
      perPersonLimit: 14_000,
    })
  })

  it("manages people, persists them, and handles empty storage", () => {
    expect(getMeals()).toEqual([])
    expect(getMealById("missing")).toBeNull()
    expect(getPeople()).toEqual([
      {
        name: DEFAULT_PERSON,
        mealCount: 0,
        createdAt: "2026-05-03T12:00:00.000Z",
      },
    ])

    savePerson("민수")
    savePerson("서연")

    expect(getPeople().map((person) => person.name)).toEqual([
      DEFAULT_PERSON,
      "민수",
      "서연",
    ])

    deletePerson("민수")

    expect(getPeople().map((person) => person.name)).toEqual([
      DEFAULT_PERSON,
      "서연",
    ])
  })

  it("ignores duplicate people, blank names, and deletion of the default person", () => {
    savePerson("민수")
    savePerson("민수")
    savePerson("   ")
    deletePerson(DEFAULT_PERSON)

    expect(getPeople().map((person) => person.name)).toEqual([
      DEFAULT_PERSON,
      "민수",
    ])
  })
})
