import { DEFAULT_PERSON } from "@/lib/constants"
import type { Meal, Person } from "@/lib/types"

const MEALS_KEY = "mealog:meals"
const PEOPLE_KEY = "mealog:people"

function hasWindow() {
  return typeof window !== "undefined"
}

function readJson<T>(key: string, fallback: T): T {
  if (!hasWindow()) {
    return fallback
  }

  const raw = window.localStorage.getItem(key)

  if (!raw) {
    return fallback
  }

  try {
    return JSON.parse(raw) as T
  } catch {
    return fallback
  }
}

function writeJson<T>(key: string, value: T) {
  if (!hasWindow()) {
    return
  }

  window.localStorage.setItem(key, JSON.stringify(value))
}

function uniqueNames(names: string[]) {
  return Array.from(
    new Set(
      names
        .map((name) => name.trim())
        .filter(Boolean)
    )
  )
}

export function getMeals() {
  const meals = readJson<Meal[]>(MEALS_KEY, [])

  return meals.sort((a, b) => {
    if (a.date !== b.date) {
      return b.date.localeCompare(a.date)
    }

    return b.updatedAt.localeCompare(a.updatedAt)
  })
}

export function saveMeal(meal: Meal) {
  const meals = getMeals()
  const nextMeals = meals.filter((item) => item.id !== meal.id)

  nextMeals.push({
    ...meal,
    people: uniqueNames([DEFAULT_PERSON, ...meal.people]),
  })

  writeJson(MEALS_KEY, nextMeals)

  return getMeals()
}

export function getMealById(id: string) {
  return getMeals().find((meal) => meal.id === id) ?? null
}

export function updateMeal(meal: Meal) {
  return saveMeal(meal)
}

export function deleteMeal(id: string) {
  const nextMeals = getMeals().filter((meal) => meal.id !== id)
  writeJson(MEALS_KEY, nextMeals)
  return nextMeals
}

export function getPeople() {
  const raw = readJson<Omit<Person, "mealCount">[]>(PEOPLE_KEY, [])
  const names = uniqueNames([DEFAULT_PERSON, ...raw.map((person) => person.name)])

  const people = names.map((name) => {
    const existing = raw.find((person) => person.name === name)

    return {
      name,
      mealCount: 0,
      createdAt: existing?.createdAt ?? new Date().toISOString(),
    }
  })

  writeJson(
    PEOPLE_KEY,
    people.map(({ mealCount, ...person }) => person)
  )

  return people.sort((a, b) => a.createdAt.localeCompare(b.createdAt))
}

export function savePerson(name: string) {
  const trimmed = name.trim()

  if (!trimmed) {
    return getPeople()
  }

  const people = getPeople()

  if (people.some((person) => person.name === trimmed)) {
    return people
  }

  const nextPeople = [
    ...people.map(({ mealCount, ...person }) => person),
    {
      name: trimmed,
      createdAt: new Date().toISOString(),
    },
  ]

  writeJson(PEOPLE_KEY, nextPeople)
  return getPeople()
}

export function deletePerson(name: string) {
  if (name === DEFAULT_PERSON) {
    return getPeople()
  }

  const nextPeople = getPeople()
    .filter((person) => person.name !== name)
    .map(({ mealCount, ...person }) => person)

  writeJson(PEOPLE_KEY, nextPeople)
  return getPeople()
}

export function getPeopleWithCounts() {
  const people = getPeople()
  const meals = getMeals()

  return people
    .map((person) => ({
      ...person,
      mealCount: meals.filter((meal) => meal.people.includes(person.name)).length,
    }))
    .sort((a, b) => {
      if (a.name === DEFAULT_PERSON) {
        return -1
      }

      if (b.name === DEFAULT_PERSON) {
        return 1
      }

      if (b.mealCount !== a.mealCount) {
        return b.mealCount - a.mealCount
      }

      return a.createdAt.localeCompare(b.createdAt)
    })
}
