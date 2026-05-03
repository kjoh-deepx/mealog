"use client"

import { Check, Copy, MessageCircle, Pencil, UtensilsCrossed } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { PER_PERSON_LIMIT } from "@/lib/constants"
import type { Meal } from "@/lib/types"
import { cn } from "@/lib/utils"

interface HistoryTabProps {
  meals: Meal[]
  onCopyMeal: (meal: Meal) => void
  onEditMeal: (meal: Meal) => void
}

const mealLabels = {
  breakfast: "🌅 아침",
  lunch: "☀️ 점심",
  dinner: "🌙 저녁",
}

function formatWon(value: number) {
  return `₩${value.toLocaleString("ko-KR")}`
}

function formatDelta(value: number) {
  return formatWon(Math.abs(value))
}

function formatDate(date: string) {
  return new Intl.DateTimeFormat("ko-KR", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date(`${date}T00:00:00`))
}

function monthKey(date: string) {
  return date.slice(0, 7)
}

function monthLabel(date: string) {
  const [year, month] = monthKey(date).split("-")
  return `${year}년 ${month}월`
}

export function HistoryTab({ meals, onCopyMeal, onEditMeal }: HistoryTabProps) {
  const groups = meals.reduce<Record<string, Meal[]>>((accumulator, meal) => {
    const key = monthKey(meal.date)
    accumulator[key] ??= []
    accumulator[key].push(meal)
    return accumulator
  }, {})

  const sortedKeys = Object.keys(groups).sort((a, b) => b.localeCompare(a))

  if (meals.length === 0) {
    return (
      <Card className="border-orange-200/70 bg-white/95">
        <CardContent className="py-10 text-center text-sm text-zinc-500">
          아직 식사 기록이 없습니다. 등록 탭에서 첫 식사를 남겨보세요.
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-4">
      {sortedKeys.map((key) => {
        const monthMeals = groups[key]
        const totalSpent = monthMeals.reduce(
          (sum, meal) => sum + (meal.confirmed ? meal.amount ?? 0 : 0),
          0
        )

        return (
          <section key={key} className="space-y-3">
            <Card className="border-orange-200/70 bg-white/95">
              <CardHeader className="flex flex-row items-center justify-between space-y-0">
                <CardTitle className="text-base">{monthLabel(monthMeals[0].date)}</CardTitle>
                <div className="text-right text-xs text-zinc-500">
                  <div>{monthMeals.length}번 식사</div>
                  <div className="mt-1 text-sm font-semibold text-zinc-900">
                    {formatWon(totalSpent)}
                  </div>
                </div>
              </CardHeader>
            </Card>

            <div className="space-y-3">
              {monthMeals.map((meal) => {
                const perPerson = meal.confirmed && meal.amount
                  ? Math.round(meal.amount / meal.people.length)
                  : PER_PERSON_LIMIT
                const delta = perPerson - PER_PERSON_LIMIT

                return (
                  <div
                    key={meal.id}
                    role={!meal.confirmed ? "button" : undefined}
                    tabIndex={!meal.confirmed ? 0 : undefined}
                    onClick={() => {
                      if (!meal.confirmed) {
                        onEditMeal(meal)
                      }
                    }}
                    onKeyDown={(event) => {
                      if (!meal.confirmed && (event.key === "Enter" || event.key === " ")) {
                        event.preventDefault()
                        onEditMeal(meal)
                      }
                    }}
                    className={cn(
                      "w-full rounded-3xl border text-left transition",
                      meal.confirmed
                        ? "border-zinc-200 bg-white shadow-[0_8px_30px_rgba(15,23,42,0.06)]"
                        : "cursor-pointer border-dashed border-orange-300 bg-orange-50/70 shadow-[0_8px_24px_rgba(251,146,60,0.12)]"
                    )}
                  >
                    <div className="space-y-4 p-4">
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <div className="flex items-center gap-2 text-sm font-medium text-zinc-900">
                            <UtensilsCrossed className="size-4 text-orange-500" />
                            {mealLabels[meal.mealType]}
                            {meal.confirmed ? (
                              <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2 py-1 text-[11px] text-emerald-700">
                                <Check className="size-3" />
                                확정
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 rounded-full bg-orange-200 px-2 py-1 text-[11px] text-orange-800">
                                <MessageCircle className="size-3" />
                                초안
                              </span>
                            )}
                          </div>
                          <div className="mt-1 text-xs text-zinc-500">{formatDate(meal.date)}</div>
                        </div>
                        <div className="text-right">
                          <div className="text-lg font-semibold text-zinc-950">
                            {meal.confirmed && meal.amount
                              ? formatWon(meal.amount)
                              : `${formatWon(meal.estimatedAmount)} 예정`}
                          </div>
                          <div
                            className={cn(
                              "mt-1 text-xs font-medium",
                              delta > 0 ? "text-red-500" : delta < 0 ? "text-emerald-600" : "text-zinc-500"
                            )}
                          >
                            {delta > 0 && `1인 +${formatDelta(delta)}`}
                            {delta < 0 && `1인 -${formatDelta(delta)}`}
                            {delta === 0 && "1인 기준 동일"}
                          </div>
                        </div>
                      </div>

                      <div className="space-y-2 text-sm">
                        <div className="font-medium text-zinc-800">
                          {meal.restaurant || "식당명 미입력"}
                        </div>
                        <div className="text-zinc-600">{meal.people.join(" · ")}</div>
                        <div className="text-xs text-zinc-500">{meal.people.length}명 N빵</div>
                      </div>

                      <div className="flex gap-2">
                        {!meal.confirmed && (
                          <Button
                            type="button"
                            variant="outline"
                            className="h-9 flex-1 border-orange-200 bg-white"
                            onClick={(event) => {
                              event.stopPropagation()
                              onEditMeal(meal)
                            }}
                          >
                            <Pencil className="size-4" />
                            금액 입력
                          </Button>
                        )}
                        <Button
                          type="button"
                          variant="outline"
                          className="h-9 flex-1 border-zinc-200 bg-white"
                          onClick={(event) => {
                            event.stopPropagation()
                            onCopyMeal(meal)
                          }}
                        >
                          <Copy className="size-4" />
                          복사해서 새로 등록
                        </Button>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          </section>
        )
      })}
    </div>
  )
}
