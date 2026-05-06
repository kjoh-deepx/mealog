"use client"

import { useState } from "react"
import { Check, ChevronDown, Copy, MessageCircle, ReceiptText, Trash2 } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import type { Meal } from "@/lib/types"
import { cn } from "@/lib/utils"

interface HistoryTabProps {
  meals: Meal[]
  perPersonLimit: number
  onCopyMeal: (meal: Meal) => void
  onEditMeal: (meal: Meal) => void
  onDeleteMeal: (id: string) => void
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

function formatDateTime(iso: string) {
  return new Intl.DateTimeFormat("ko-KR", {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(iso))
}

function monthKey(date: string) {
  return date.slice(0, 7)
}

function monthLabel(date: string) {
  const [year, month] = monthKey(date).split("-")
  return `${year}년 ${month}월`
}

function MealCard({
  meal,
  perPersonLimit,
  onCopyMeal,
  onEditMeal,
  onDeleteMeal,
}: {
  meal: Meal
  perPersonLimit: number
  onCopyMeal: (meal: Meal) => void
  onEditMeal: (meal: Meal) => void
  onDeleteMeal: (id: string) => void
}) {
  const [open, setOpen] = useState(false)

  const divisor = Math.max(1, meal.headcount)
  const mealLimit = meal.perPersonLimit ?? perPersonLimit
  const splitAmount = meal.amount
    ? Math.round(meal.amount / divisor)
    : Math.round((meal.headcount * mealLimit) / divisor)
  const delta = splitAmount - mealLimit
  const totalAmount = meal.amount ?? meal.headcount * mealLimit

  return (
    <Card
      className={cn(
        "rounded-[22px] border transition-all duration-200",
        meal.confirmed
          ? "border-zinc-200 bg-white"
          : "border-orange-200 bg-orange-50/70"
      )}
    >
      {/* Collapsed summary — always visible, tap to toggle */}
      <button
        type="button"
        className="w-full px-4 py-3.5 text-left"
        onClick={() => setOpen(!open)}
      >
        <div className="flex items-center justify-between gap-3">
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <span className="rounded-full bg-zinc-100 px-2.5 py-0.5 text-xs font-medium text-zinc-600">
                {mealLabels[meal.mealType]}
              </span>
              <span
                className={cn(
                  "inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-semibold",
                  meal.confirmed
                    ? "bg-emerald-100 text-emerald-700"
                    : "bg-orange-100 text-orange-700"
                )}
              >
                {meal.confirmed ? <Check className="size-3" /> : <MessageCircle className="size-3" />}
                {meal.confirmed ? "확정" : "미확정"}
              </span>
            </div>
            <div className="mt-1.5 truncate text-base font-semibold text-zinc-950">
              {meal.restaurant || "식당명 미확인"}
            </div>
            <div className="mt-0.5 text-xs text-zinc-500">{formatDate(meal.date)}</div>
          </div>
          <div className="flex items-center gap-2">
            <div className="text-right">
              <div className="text-lg font-semibold text-zinc-950">{formatWon(totalAmount)}</div>
              <div className="text-xs text-zinc-500">{meal.headcount}명</div>
            </div>
            <ChevronDown
              className={cn(
                "size-4 text-zinc-400 transition-transform duration-200",
                open && "rotate-180"
              )}
            />
          </div>
        </div>
      </button>

      {/* Expanded detail */}
      {open && (
        <CardContent className="space-y-3 border-t border-zinc-100 px-4 pb-4 pt-3">
          {/* People */}
          <div>
            <div className="text-xs font-medium text-zinc-500">참석자</div>
            <div className="mt-1.5 flex flex-wrap gap-1.5">
              {meal.people.map((name) => (
                <span
                  key={name}
                  className="rounded-full bg-zinc-100 px-2.5 py-1 text-xs text-zinc-700"
                >
                  {name}
                </span>
              ))}
            </div>
          </div>

          {/* Split calculation */}
          <div className="rounded-2xl bg-zinc-50 p-3">
            <div className="flex items-center justify-between text-sm">
              <span className="text-zinc-600">1인당</span>
              <span className="font-medium text-zinc-900">{formatWon(splitAmount)}</span>
            </div>
            <div className="mt-1 flex items-center justify-between text-sm">
              <span className="text-zinc-600">단가 기준</span>
              <span className="text-zinc-500">{formatWon(mealLimit)}</span>
            </div>
            <div
              className={cn(
                "mt-1.5 text-sm font-medium",
                delta > 0 ? "text-red-600" : delta < 0 ? "text-emerald-700" : "text-zinc-500"
              )}
            >
              {delta > 0 && `+${formatWon(delta)} 초과`}
              {delta < 0 && `${formatWon(Math.abs(delta))} 여유`}
              {delta === 0 && "기준과 동일"}
            </div>
          </div>

          {/* Receipt */}
          {meal.receiptText ? (
            <div className="rounded-2xl bg-zinc-50 p-3">
              <div className="flex items-center gap-1.5 text-xs font-medium text-zinc-500">
                <ReceiptText className="size-3.5" />
                영수증 원문
              </div>
              <pre className="mt-2 whitespace-pre-wrap text-xs leading-5 text-zinc-600">
                {meal.receiptText}
              </pre>
            </div>
          ) : null}

          {/* Timestamps */}
          <div className="flex gap-4 text-xs text-zinc-400">
            <span>등록 {formatDateTime(meal.createdAt)}</span>
            {meal.updatedAt !== meal.createdAt && (
              <span>수정 {formatDateTime(meal.updatedAt)}</span>
            )}
          </div>

          {/* Actions */}
          <div className="flex gap-2 pt-1">
            {!meal.confirmed && (
              <Button
                type="button"
                variant="outline"
                className="h-10 flex-1 rounded-xl border-orange-200 bg-white text-sm"
                onClick={() => onEditMeal(meal)}
              >
                <ReceiptText className="size-3.5" />
                이어서 하기
              </Button>
            )}
            <Button
              type="button"
              variant="outline"
              className="h-10 flex-1 rounded-xl border-zinc-200 bg-white text-sm"
              onClick={() => onCopyMeal(meal)}
            >
              <Copy className="size-3.5" />
              복사
            </Button>
            <Button
              type="button"
              variant="outline"
              className="h-10 rounded-xl border-red-200 bg-white text-sm text-red-500 hover:bg-red-50"
              onClick={() => onDeleteMeal(meal.id)}
            >
              <Trash2 className="size-3.5" />
            </Button>
          </div>
        </CardContent>
      )}
    </Card>
  )
}

export function HistoryTab({ meals, perPersonLimit, onCopyMeal, onEditMeal, onDeleteMeal }: HistoryTabProps) {
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
          <section key={key} className="space-y-2">
            <Card className="rounded-[20px] border border-zinc-200 bg-white shadow-[0_8px_20px_rgba(15,23,42,0.04)]">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 px-4 py-3">
                <div>
                  <CardTitle className="text-sm font-semibold text-zinc-950">
                    {monthLabel(monthMeals[0].date)}
                  </CardTitle>
                  <div className="mt-0.5 text-xs text-zinc-500">{monthMeals.length}건</div>
                </div>
                <div className="text-right">
                  <div className="text-base font-semibold text-zinc-950">{formatWon(totalSpent)}</div>
                </div>
              </CardHeader>
            </Card>

            <div className="space-y-2">
              {monthMeals.map((meal) => (
                <MealCard
                  key={meal.id}
                  meal={meal}
                  perPersonLimit={perPersonLimit}
                  onCopyMeal={onCopyMeal}
                  onEditMeal={onEditMeal}
                  onDeleteMeal={onDeleteMeal}
                />
              ))}
            </div>
          </section>
        )
      })}
    </div>
  )
}
