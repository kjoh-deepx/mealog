export type MealType = "breakfast" | "lunch" | "dinner"

export interface Meal {
  id: string
  date: string
  mealType: MealType
  headcount: number
  amount: number | null
  estimatedAmount: number
  restaurant: string | null
  people: string[]
  confirmed: boolean
  receiptText?: string | null
  createdAt: string
  updatedAt: string
}

export interface Person {
  name: string
  mealCount: number
  createdAt: string
}

export interface Settings {
  perPersonLimit: number
}
