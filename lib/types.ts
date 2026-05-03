export type MealType = "breakfast" | "lunch" | "dinner"

export interface Meal {
  id: string
  date: string
  mealType: MealType
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
