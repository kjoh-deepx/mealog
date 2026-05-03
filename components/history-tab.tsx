"use client"

import { Check, Copy, MessageCircle, Pencil, ReceiptText } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import type { Meal } from "@/lib/types"
import { cn } from "@/lib/utils"

interface HistoryTabProps {
  meals: Meal[]
  perPersonLimit: number
  onCopyMeal: (meal: Meal) => void
  onEditMeal: (meal: Meal) => void
}

const mealLabels = {
  breakfast: "아침",
  lunch: "점심",
  dinner: "저녁",
}

function formatWon(value: number) {
  return `${value.toLocaleString("ko-KR")}원`
}

function formatDate(date: string) {
  return new Intl.DateTimeFormat("ko-KR", {
    month: "long",
    day: "numeric",
    weekday: "short",
  }).format(new Date(`${date}T00:00:00`))
}

function monthKey(date: string) {
  return date.slice(0, 7)
}

function monthLabel(date: string) {
  const [year, month] = monthKey(date).split("-")
  return `${year}년 ${month}월`
}

export function HistoryTab({ meals, perPersonLimit, onCopyMeal, onEditMeal }: HistoryTabProps) {
  const groups = meals.reduce<Record<string, Meal[]>>((accumulator, meal) => {
    const key = monthKey(meal.date)
    accumulator[key] ??= []
    accumulator[key].push(meal)
    return accumulator
  }, {})

  const sortedKeys = Object.keys(groups).sort((a, b) => b.localeCompare(a))

  if (meals.length === 0) {
    return (
      <Card className="rounded-[28px] border border-zinc-200 bg-white shadow-[0_18px_40px_rgba(15,23,42,0.06)]">
        <CardContent className="py-12 text-center text-sm text-zinc-500">
          아직 기록이 없습니다. 등록 탭에서 첫 초안을 만들어 보세요.
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-4">
      {sortedKeys.map((key) => {
        const monthMeals = groups[key]
        const totalSpent = monthMeals.reduce((sum, meal) => sum + (meal.amount ?? 0), 0)

        return (
          <section key={key} className="space-y-3">
            <Card className="rounded-[24px] border border-zinc-200 bg-white shadow-[0_12px_30px_rgba(15,23,42,0.05)]">
              <CardHeader className="flex flex-row items-center justify-between space-y-0">
                <div>
                  <CardTitle className="text-base font-semibold text-zinc-950">
                    {monthLabel(monthMeals[0].date)}
                  </CardTitle>
                  <div className="mt-1 text-sm text-zinc-500">{monthMeals.length}건 기록</div>
                </div>
                <div className="text-right">
                  <div className="text-xs text-zinc-500">확정 총액</div>
                  <div className="mt-1 text-lg font-semibold text-zinc-950">{formatWon(totalSpent)}</div>
                </div>
              </CardHeader>
            </Card>

            <div className="space-y-3">
              {monthMeals.map((meal) => {
                const divisor = Math.max(1, meal.headcount)
                const splitAmount = meal.amount ? Math.round(meal.amount / divisor) : Math.round((meal.headcount * perPersonLimit) / divisor)
                const delta = splitAmount - perPersonLimit

                return (
                  <Card
                    key={meal.id}
                    className={cn(
                      "rounded-[26px] border shadow-[0_18px_40px_rgba(15,23,42,0.06)] transition-all duration-200",
                      meal.confirmed
                        ? "border-zinc-200 bg-white"
                        : "border-orange-200 bg-orange-50/70"
                    )}
                  >
                    <CardContent className="space-y-4 py-5">
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="rounded-full bg-zinc-100 px-3 py-1 text-xs font-medium text-zinc-600">
                              {mealLabels[meal.mealType]}
                            </span>
                            <span
                              className={cn(
                                "inline-flex items-center gap-1 rounded-full px-3 py-1 text-xs font-semibold",
                                meal.confirmed
                                  ? "bg-emerald-100 text-emerald-700"
                                  : "bg-orange-100 text-orange-700"
                              )}
                            >
                              {meal.confirmed ? <Check className="size-3.5" /> : <MessageCircle className="size-3.5" />}
                              {meal.confirmed ? "확정" : "미확정"}
                            </span>
                          </div>
                          <div className="mt-3 text-lg font-semibold text-zinc-950">
                            {meal.restaurant || "식당명 미확인"}
                          </div>
                          <div className="mt-1 text-sm text-zinc-500">{formatDate(meal.date)}</div>
                        </div>
                        <div className="text-right">
                          <div className="text-xl font-semibold text-zinc-950">
                            {formatWon(meal.amount ?? meal.headcount * perPersonLimit)}
                          </div>
                          <div className="mt-1 text-xs text-zinc-500">{meal.headcount}명 기준</div>
                        </div>
                      </div>

                      <div className="rounded-[20px] bg-zinc-50 p-4">
                        <div className="flex items-center justify-between gap-3 text-sm">
                          <div className="text-zinc-600">{meal.people.join(" · ")}</div>
                          <div className="text-zinc-500">{splitAmount.toLocaleString("ko-KR")}원/인</div>
                        </div>
                        <div
                          className={cn(
                            "mt-2 text-sm font-medium",
                            delta > 0 ? "text-red-600" : delta < 0 ? "text-emerald-700" : "text-zinc-500"
                          )}
                        >
                          {delta > 0 && `1인 +${formatWon(delta)} 초과`}
                          {delta < 0 && `1인 ${formatWon(Math.abs(delta))} 여유`}
                          {delta === 0 && "1인 기준과 동일"}
                        </div>
                        {meal.receiptText ? (
                          <div className="mt-3 flex items-center gap-2 text-xs text-zinc-500">
                            <ReceiptText className="size-3.5" />
                            영수증 문자 저장됨
                          </div>
                        ) : null}
                      </div>

                      <div className="flex gap-2">
                        {!meal.confirmed ? (
                          <Button
                            type="button"
                            variant="outline"
                            className="h-11 flex-1 rounded-2xl border-orange-200 bg-white"
                            onClick={() => onEditMeal(meal)}
                          >
                            <Pencil className="size-4" />
                            이어서 확정
                          </Button>
                        ) : null}
                        <Button
                          type="button"
                          variant="outline"
                          className="h-11 flex-1 rounded-2xl border-zinc-200 bg-white"
                          onClick={() => onCopyMeal(meal)}
                        >
                          <Copy className="size-4" />
                          복사해서 등록
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                )
              })}
            </div>
          </section>
        )
      })}
    </div>
  )
}
