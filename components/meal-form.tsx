"use client"

import { useEffect, useMemo, useState } from "react"
import { Check, MessageCircle, ReceiptText, RotateCcw, Users } from "lucide-react"

import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { DEFAULT_PERSON, PER_PERSON_LIMIT } from "@/lib/constants"
import { parseReceiptText } from "@/lib/receipt-parser"
import type { Meal, MealType, Person } from "@/lib/types"
import { cn } from "@/lib/utils"

interface MealFormProps {
  people: Person[]
  initialMeal?: Meal | null
  onSaveDraft: (meal: Meal) => void
  onConfirmMeal: (meal: Meal) => void
  onCancelEdit: () => void
}

const mealTypeOptions: { label: string; icon: string; value: MealType }[] = [
  { label: "아침", icon: "🌅", value: "breakfast" },
  { label: "점심", icon: "☀️", value: "lunch" },
  { label: "저녁", icon: "🌙", value: "dinner" },
]

function createToday() {
  const now = new Date()
  const offset = now.getTimezoneOffset() * 60_000
  return new Date(now.getTime() - offset).toISOString().slice(0, 10)
}

function formatWon(value: number) {
  return `₩${value.toLocaleString("ko-KR")}`
}

function formatDelta(value: number) {
  return formatWon(Math.abs(value))
}

function parseAmountInput(value: string) {
  const digits = value.replace(/[^\d]/g, "")
  return digits ? Number(digits) : null
}

export function MealForm({
  people,
  initialMeal,
  onSaveDraft,
  onConfirmMeal,
  onCancelEdit,
}: MealFormProps) {
  const [id, setId] = useState<string | null>(null)
  const [date, setDate] = useState(createToday)
  const [mealType, setMealType] = useState<MealType>("lunch")
  const [selectedPeople, setSelectedPeople] = useState<string[]>([DEFAULT_PERSON])
  const [amountInput, setAmountInput] = useState("")
  const [receiptText, setReceiptText] = useState("")
  const [restaurant, setRestaurant] = useState("")
  const [savedDraftAt, setSavedDraftAt] = useState<string | null>(null)
  const [amountTouched, setAmountTouched] = useState(false)

  useEffect(() => {
    if (!initialMeal) {
      setId(null)
      setDate(createToday())
      setMealType("lunch")
      setSelectedPeople([DEFAULT_PERSON])
      setAmountInput("")
      setReceiptText("")
      setRestaurant("")
      setSavedDraftAt(null)
      setAmountTouched(false)
      return
    }

    setId(initialMeal.id || null)
    setDate(initialMeal.date)
    setMealType(initialMeal.mealType)
    setSelectedPeople(initialMeal.people)
    setAmountInput(initialMeal.amount ? String(initialMeal.amount) : "")
    setReceiptText(initialMeal.receiptText ?? "")
    setRestaurant(initialMeal.restaurant ?? "")
    setSavedDraftAt(initialMeal.id ? initialMeal.id : null)
    setAmountTouched(Boolean(initialMeal.amount))
  }, [initialMeal])

  const estimatedAmount = useMemo(
    () => selectedPeople.length * PER_PERSON_LIMIT,
    [selectedPeople.length]
  )

  const parsedAmount = useMemo(
    () => parseAmountInput(amountInput),
    [amountInput]
  )

  const actualAmount = parsedAmount
  const headcountSuggestion = actualAmount
    ? Math.max(1, Math.round(actualAmount / PER_PERSON_LIMIT))
    : selectedPeople.length
  const perPerson = actualAmount
    ? Math.round(actualAmount / Math.max(selectedPeople.length, 1))
    : PER_PERSON_LIMIT
  const difference = actualAmount === null ? 0 : perPerson - PER_PERSON_LIMIT
  const canSaveDraft = Boolean(date && selectedPeople.length > 0)
  const canConfirm = Boolean(savedDraftAt && actualAmount)

  useEffect(() => {
    if (!receiptText.trim()) {
      return
    }

    const parsed = parseReceiptText(receiptText)

    if (parsed.amount !== null && !amountTouched) {
      setAmountInput(String(parsed.amount))
    }

    if (parsed.restaurant && !restaurant.trim()) {
      setRestaurant(parsed.restaurant)
    }
  }, [amountTouched, receiptText, restaurant])

  useEffect(() => {
    if (!actualAmount) {
      return
    }

    const onlyDefaultSelected =
      selectedPeople.length === 1 && selectedPeople[0] === DEFAULT_PERSON

    if (!onlyDefaultSelected) {
      return
    }

    const nextCount = Math.min(Math.max(1, headcountSuggestion), people.length)
    const sortedNames = [
      DEFAULT_PERSON,
      ...people
        .map((person) => person.name)
        .filter((name) => name !== DEFAULT_PERSON),
    ]

    setSelectedPeople(sortedNames.slice(0, nextCount))
  }, [actualAmount, headcountSuggestion, people, selectedPeople])

  function togglePerson(name: string) {
    if (name === DEFAULT_PERSON) {
      return
    }

    setSelectedPeople((current) => {
      const hasName = current.includes(name)

      if (hasName) {
        return current.filter((item) => item !== name)
      }

      return [DEFAULT_PERSON, ...current.filter((item) => item !== DEFAULT_PERSON), name]
    })
  }

  function buildMeal(confirmed: boolean): Meal {
    const now = new Date().toISOString()
    const mealId = id ?? crypto.randomUUID()

    return {
      id: mealId,
      date,
      mealType,
      amount: confirmed ? actualAmount : null,
      estimatedAmount,
      restaurant: restaurant.trim() || null,
      people: selectedPeople,
      confirmed,
      receiptText: receiptText.trim() || null,
      createdAt: initialMeal?.id === mealId ? initialMeal.createdAt : now,
      updatedAt: now,
    }
  }

  function handleSaveDraft() {
    if (!canSaveDraft) {
      return
    }

    const meal = buildMeal(false)
    setId(meal.id)
    setSavedDraftAt(meal.id)
    onSaveDraft(meal)
  }

  function handleConfirm() {
    if (!canConfirm) {
      return
    }

    const meal = buildMeal(true)
    setId(meal.id)
    setSavedDraftAt(meal.id)
    onConfirmMeal(meal)
  }

  return (
    <div className="space-y-4">
      <Card className="border-orange-200/70 bg-white/95 shadow-[0_12px_40px_rgba(251,146,60,0.12)]">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <span className="rounded-full bg-orange-100 px-2 py-1 text-orange-700">등록</span>
            식사 기록 남기기
          </CardTitle>
          <CardDescription>
            먼저 함께 먹은 사람을 고르고 초안을 저장한 뒤, 영수증 금액으로 확정하세요.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-5">
          <section className="space-y-3">
            <div className="flex items-center gap-2 text-sm font-medium text-zinc-700">
              <Users className="size-4 text-orange-500" />
              1단계. 기본 정보
            </div>
            <div className="grid grid-cols-2 gap-3">
              <label className="space-y-1.5">
                <span className="text-xs font-medium text-zinc-600">날짜</span>
                <Input
                  type="date"
                  value={date}
                  onChange={(event) => setDate(event.target.value)}
                  className="h-11 border-orange-200 bg-orange-50/40"
                />
              </label>
              <div className="space-y-1.5">
                <span className="text-xs font-medium text-zinc-600">식사</span>
                <div className="grid grid-cols-3 gap-2">
                  {mealTypeOptions.map((option) => (
                    <button
                      key={option.value}
                      type="button"
                      onClick={() => setMealType(option.value)}
                      className={cn(
                        "flex h-11 items-center justify-center gap-1 rounded-xl border text-sm font-medium transition",
                        mealType === option.value
                          ? "border-orange-500 bg-orange-500 text-white shadow-sm"
                          : "border-orange-200 bg-white text-zinc-700 hover:bg-orange-50"
                      )}
                    >
                      <span>{option.icon}</span>
                      <span>{option.label}</span>
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-zinc-600">함께한 사람</span>
                <span className="text-xs text-zinc-500">{selectedPeople.length}명 선택</span>
              </div>
              <div className="flex flex-wrap gap-2">
                {people.map((person) => {
                  const active = selectedPeople.includes(person.name)
                  const locked = person.name === DEFAULT_PERSON

                  return (
                    <button
                      key={person.name}
                      type="button"
                      onClick={() => togglePerson(person.name)}
                      className={cn(
                        "rounded-full border px-3 py-2 text-sm font-medium transition",
                        active
                          ? "border-orange-500 bg-orange-500 text-white"
                          : "border-orange-200 bg-white text-zinc-700 hover:bg-orange-50",
                        locked && "cursor-default border-orange-300 bg-orange-100 text-orange-800"
                      )}
                    >
                      {locked ? `나 (${person.name})` : person.name}
                    </button>
                  )
                })}
              </div>
            </div>

            <div className="rounded-2xl border border-orange-200 bg-orange-50/70 p-4">
              <div className="flex items-center justify-between text-sm">
                <span className="font-medium text-zinc-700">예상 금액</span>
                <span className="text-lg font-semibold text-orange-700">
                  {selectedPeople.length}명 × {formatWon(PER_PERSON_LIMIT)}
                </span>
              </div>
              <div className="mt-1 text-2xl font-semibold text-zinc-950">
                {formatWon(estimatedAmount)}
              </div>
            </div>
          </section>

          <section className="space-y-3">
            <div className="flex items-center gap-2 text-sm font-medium text-zinc-700">
              <ReceiptText className="size-4 text-orange-500" />
              2단계. 영수증으로 확정
            </div>
            <label className="space-y-1.5">
              <span className="text-xs font-medium text-zinc-600">카드 문자 붙여넣기</span>
              <Textarea
                value={receiptText}
                onChange={(event) => setReceiptText(event.target.value)}
                placeholder="[Web발신] 승인 문자 전체를 붙여넣으세요."
                className="min-h-28 border-orange-200 bg-white"
              />
            </label>
            <div className="grid grid-cols-[1fr_auto] gap-3">
              <label className="space-y-1.5">
                <span className="text-xs font-medium text-zinc-600">실결제 금액</span>
                <Input
                  inputMode="numeric"
                  value={amountInput ? Number(amountInput).toLocaleString("ko-KR") : ""}
                  onChange={(event) => {
                    setAmountTouched(true)
                    setAmountInput(event.target.value.replace(/[^\d]/g, ""))
                  }}
                  placeholder="113,000"
                  className="h-11 border-orange-200 bg-white"
                />
              </label>
              <div className="flex items-end">
                <div className="rounded-xl border border-zinc-200 bg-zinc-50 px-3 py-2 text-center text-xs text-zinc-600">
                  추천 인원
                  <div className="mt-1 text-base font-semibold text-zinc-900">
                    {headcountSuggestion}명
                  </div>
                </div>
              </div>
            </div>
            <label className="space-y-1.5">
              <span className="text-xs font-medium text-zinc-600">식당명</span>
              <Input
                value={restaurant}
                onChange={(event) => setRestaurant(event.target.value)}
                placeholder="문자에서 자동 추출되면 여기 채워집니다."
                className="h-11 border-orange-200 bg-white"
              />
            </label>

            <div className="rounded-2xl border border-zinc-200 bg-zinc-50 p-4">
              <div className="flex items-center justify-between text-sm text-zinc-600">
                <span>1인당 금액</span>
                <span>{formatWon(perPerson)}</span>
              </div>
              <div
                className={cn(
                  "mt-2 text-sm font-semibold",
                  difference > 0 ? "text-red-500" : difference < 0 ? "text-emerald-600" : "text-zinc-700"
                )}
              >
                {difference > 0 && `+${formatDelta(difference)} 초과`}
                {difference < 0 && `-${formatDelta(difference)} 절약`}
                {difference === 0 && "기준 금액과 동일"}
              </div>
            </div>
          </section>
        </CardContent>
        <CardFooter className="flex flex-col gap-2 bg-orange-50/60 sm:flex-row">
          <Button
            type="button"
            onClick={handleSaveDraft}
            disabled={!canSaveDraft}
            className="h-11 w-full bg-orange-500 text-white hover:bg-orange-600 sm:flex-1"
          >
            <MessageCircle className="size-4" />
            초안 저장
          </Button>
          <Button
            type="button"
            onClick={handleConfirm}
            disabled={!canConfirm}
            className="h-11 w-full bg-zinc-950 text-white hover:bg-zinc-800 sm:flex-1"
          >
            <Check className="size-4" />
            금액 확정
          </Button>
          {initialMeal && (
            <Button
              type="button"
              variant="outline"
              onClick={onCancelEdit}
              className="h-11 w-full border-zinc-200 sm:w-auto"
            >
              <RotateCcw className="size-4" />
              새로 작성
            </Button>
          )}
        </CardFooter>
      </Card>

      {!savedDraftAt && (
        <div className="rounded-2xl border border-dashed border-orange-300 bg-orange-50/60 px-4 py-3 text-sm text-zinc-600">
          초안을 먼저 저장하면 이후 실제 금액을 입력해 ✅ 확정할 수 있습니다.
        </div>
      )}
    </div>
  )
}
