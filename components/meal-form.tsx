"use client"

import { useEffect, useMemo, useState } from "react"
import {
  Check,
  ChevronDown,
  Lock,
  MessageCircle,
  Minus,
  Plus,
  ReceiptText,
  RotateCcw,
  Users,
} from "lucide-react"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { DEFAULT_PERSON } from "@/lib/constants"
import { parseReceiptText } from "@/lib/receipt-parser"
import type { Meal, MealType, Person } from "@/lib/types"
import { cn } from "@/lib/utils"

interface MealFormProps {
  people: Person[]
  initialMeal?: Meal | null
  perPersonLimit: number
  onSaveDraft: (meal: Meal) => void
  onConfirmMeal: (meal: Meal) => void
  onCancelEdit: () => void
  onSavePerson: (name: string) => void
}

const mealTypeOptions: { label: string; value: MealType }[] = [
  { label: "아침", value: "breakfast" },
  { label: "점심", value: "lunch" },
  { label: "저녁", value: "dinner" },
]

function createToday() {
  const now = new Date()
  const offset = now.getTimezoneOffset() * 60_000
  return new Date(now.getTime() - offset).toISOString().slice(0, 10)
}

function formatWon(value: number) {
  return `${value.toLocaleString("ko-KR")}원`
}

function normalizeName(value: string) {
  return value.replace(/\s+/g, " ").trim()
}

function createPeopleSlots(headcount: number, names: string[] = []) {
  const cleanNames = names
    .map(normalizeName)
    .filter((name, index, array) => Boolean(name) && array.indexOf(name) === index)
    .filter((name) => name !== DEFAULT_PERSON)

  const slots = Array.from({ length: Math.max(1, headcount) }, (_, index) => {
    if (index === 0) {
      return DEFAULT_PERSON
    }

    return cleanNames[index - 1] ?? ""
  })

  return slots
}

function ensureSlotLength(slots: string[], headcount: number) {
  const nextSlots = Array.from({ length: Math.max(1, headcount) }, (_, index) => {
    if (index === 0) {
      return DEFAULT_PERSON
    }

    return slots[index] ?? ""
  })

  nextSlots[0] = DEFAULT_PERSON
  return nextSlots
}

function uniqueFilledPeople(slots: string[]) {
  const names = slots
    .map(normalizeName)
    .filter(Boolean)
    .filter((name, index, array) => array.indexOf(name) === index)

  return names.includes(DEFAULT_PERSON) ? names : [DEFAULT_PERSON, ...names]
}

export function MealForm({
  people,
  initialMeal,
  perPersonLimit,
  onSaveDraft,
  onConfirmMeal,
  onCancelEdit,
  onSavePerson,
}: MealFormProps) {
  const [id, setId] = useState("")
  const [date, setDate] = useState(createToday)
  const [mealType, setMealType] = useState<MealType>("lunch")
  const [headcount, setHeadcount] = useState(1)
  const [peopleSlots, setPeopleSlots] = useState<string[]>([DEFAULT_PERSON])
  const [receiptText, setReceiptText] = useState("")
  const [focusedSlot, setFocusedSlot] = useState<number | null>(null)
  const [hasDraft, setHasDraft] = useState(false)

  useEffect(() => {
    if (!initialMeal) {
      setId("")
      setDate(createToday())
      setMealType("lunch")
      setHeadcount(1)
      setPeopleSlots([DEFAULT_PERSON])
      setReceiptText("")
      setFocusedSlot(null)
      setHasDraft(false)
      return
    }

    const nextHeadcount = Math.max(1, initialMeal.headcount ?? initialMeal.people.length)

    setId(initialMeal.id)
    setDate(initialMeal.date)
    setMealType(initialMeal.mealType)
    setHeadcount(nextHeadcount)
    setPeopleSlots(createPeopleSlots(nextHeadcount, initialMeal.people))
    setReceiptText(initialMeal.receiptText ?? "")
    setFocusedSlot(null)
    setHasDraft(Boolean(initialMeal.id))
  }, [initialMeal])

  const savedPeople = useMemo(
    () => people.map((person) => person.name).filter((name) => name !== DEFAULT_PERSON),
    [people]
  )

  const frequentPeople = useMemo(
    () => people
      .filter((person) => person.name !== DEFAULT_PERSON)
      .slice(0, 8)
      .map((person) => person.name),
    [people]
  )

  const estimatedTotal = headcount * perPersonLimit
  const parsedReceipt = useMemo(() => parseReceiptText(receiptText), [receiptText])
  const parsedAmount = parsedReceipt.amount
  const parsedRestaurant = parsedReceipt.restaurant
  const suggestedHeadcount = parsedAmount ? Math.max(1, Math.round(parsedAmount / perPersonLimit)) : null
  const splitAmount = parsedAmount ? Math.round(parsedAmount / headcount) : null
  const overage = splitAmount === null ? null : splitAmount - perPersonLimit
  const selectedPeople = useMemo(() => uniqueFilledPeople(peopleSlots), [peopleSlots])
  const filledCount = selectedPeople.length
  const canSaveDraft = Boolean(date && mealType && headcount >= 1)
  const canConfirm = hasDraft && parsedAmount !== null

  function resizeHeadcount(nextHeadcount: number) {
    const safeHeadcount = Math.min(30, Math.max(1, nextHeadcount))
    setHeadcount(safeHeadcount)
    setPeopleSlots((current) => ensureSlotLength(current, safeHeadcount))
  }

  function persistName(name: string) {
    const normalized = normalizeName(name)

    if (!normalized || normalized === DEFAULT_PERSON) {
      return
    }

    onSavePerson(normalized)
  }

  function updateSlot(index: number, value: string) {
    if (index === 0) {
      return
    }

    setPeopleSlots((current) =>
      current.map((slot, slotIndex) => (slotIndex === index ? value : slot))
    )
  }

  function commitSlot(index: number) {
    if (index === 0) {
      return
    }

    setPeopleSlots((current) => {
      const nextSlots = [...current]
      const normalized = normalizeName(nextSlots[index] ?? "")

      if (!normalized) {
        nextSlots[index] = ""
        return nextSlots
      }

      const duplicateIndex = nextSlots.findIndex(
        (slot, slotIndex) => slotIndex !== index && normalizeName(slot) === normalized
      )

      if (duplicateIndex >= 0) {
        nextSlots[index] = ""
        return nextSlots
      }

      nextSlots[index] = normalized
      persistName(normalized)
      return nextSlots
    })
  }

  function assignPerson(name: string, preferredSlot?: number | null) {
    const normalized = normalizeName(name)

    if (!normalized) {
      return
    }

    const targetSlot =
      preferredSlot && preferredSlot > 0
        ? preferredSlot
        : focusedSlot && focusedSlot > 0
          ? focusedSlot
          : peopleSlots.findIndex((slot, index) => index > 0 && !normalizeName(slot))

    if (targetSlot <= 0) {
      return
    }

    const alreadyUsedElsewhere = peopleSlots.some(
      (slot, index) => index !== targetSlot && normalizeName(slot) === normalized
    )

    if (alreadyUsedElsewhere) {
      return
    }

    setPeopleSlots((current) =>
      current.map((slot, index) => (index === targetSlot ? normalized : slot))
    )
    persistName(normalized)
  }

  function buildMeal(confirmed: boolean): Meal {
    const now = new Date().toISOString()
    const mealId = id || crypto.randomUUID()

    return {
      id: mealId,
      date,
      mealType,
      headcount,
      amount: confirmed ? parsedAmount : null,
      estimatedAmount: estimatedTotal,
      restaurant: parsedRestaurant ?? initialMeal?.restaurant ?? null,
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

    peopleSlots.forEach((name, index) => {
      if (index > 0) {
        persistName(name)
      }
    })

    const meal = buildMeal(false)
    setId(meal.id)
    setHasDraft(true)
    onSaveDraft(meal)
  }

  function handleConfirm() {
    if (!canConfirm) {
      return
    }

    peopleSlots.forEach((name, index) => {
      if (index > 0) {
        persistName(name)
      }
    })

    const meal = buildMeal(true)
    setId(meal.id)
    setHasDraft(true)
    onConfirmMeal(meal)
  }

  function slotSuggestions(index: number) {
    const query = normalizeName(peopleSlots[index] ?? "").toLowerCase()

    return savedPeople.filter((name) => {
      if (!query) {
        return true
      }

      return name.toLowerCase().includes(query)
    })
  }

  return (
    <div className="space-y-4">
      <Card className="rounded-[28px] border border-zinc-200/80 bg-white shadow-[0_18px_40px_rgba(15,23,42,0.06)]">
        <CardHeader className="space-y-3">
          <div className="flex items-center justify-between gap-3">
            <div>
              <CardTitle className="text-lg font-semibold text-zinc-950">식사 등록</CardTitle>
              <CardDescription className="mt-1 text-sm text-zinc-500">
                초안을 먼저 저장하고, 카드 영수증으로 금액을 확정합니다.
              </CardDescription>
            </div>
            {initialMeal ? (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="h-9 rounded-full px-3 text-zinc-600"
                onClick={onCancelEdit}
              >
                <RotateCcw className="size-4" />
                새로 작성
              </Button>
            ) : null}
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <section className="rounded-[24px] border border-orange-200 bg-orange-50/60 p-4">
            <div className="flex items-center justify-between">
              <div>
                <div className="inline-flex items-center gap-2 rounded-full bg-white px-3 py-1 text-xs font-semibold text-orange-600 shadow-sm">
                  <MessageCircle className="size-3.5" />
                  STEP 1. 미확정
                </div>
                <p className="mt-3 text-sm font-medium text-zinc-900">
                  날짜, 식사 종류, 인원과 참석자 이름을 먼저 입력하세요.
                </p>
              </div>
              <div className="rounded-2xl bg-white px-3 py-2 text-right shadow-sm">
                <div className="text-xs text-zinc-500">예상 총액</div>
                <div className="text-base font-semibold text-zinc-950">{formatWon(estimatedTotal)}</div>
              </div>
            </div>

            <div className="mt-4 grid grid-cols-2 gap-3">
              <label className="space-y-2">
                <span className="text-xs font-medium text-zinc-500">날짜</span>
                <Input
                  type="date"
                  value={date}
                  onChange={(event) => setDate(event.target.value)}
                  className="h-12 rounded-2xl border-orange-200 bg-white text-sm shadow-sm"
                />
              </label>
              <div className="space-y-2">
                <span className="text-xs font-medium text-zinc-500">식사 종류</span>
                <div className="flex gap-2">
                  {mealTypeOptions.map((option) => (
                    <button
                      key={option.value}
                      type="button"
                      onClick={() => setMealType(option.value)}
                      className={cn(
                        "h-12 flex-1 rounded-full border text-sm font-medium transition-all duration-200",
                        mealType === option.value
                          ? "border-orange-500 bg-orange-500 text-white shadow-[0_10px_20px_rgba(249,115,22,0.22)]"
                          : "border-orange-200 bg-white text-zinc-700"
                      )}
                    >
                      {option.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="mt-4 rounded-[22px] bg-white p-4 shadow-sm">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <div className="text-sm font-medium text-zinc-900">명수</div>
                  <div className="mt-1 text-xs text-zinc-500">
                    {headcount}명 × {formatWon(perPersonLimit)} = {formatWon(estimatedTotal)}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="icon-lg"
                    className="size-11 rounded-full border-zinc-200 bg-white"
                    onClick={() => resizeHeadcount(headcount - 1)}
                  >
                    <Minus className="size-4" />
                  </Button>
                  <Input
                    inputMode="numeric"
                    pattern="[0-9]*"
                    value={String(headcount)}
                    onChange={(event) => resizeHeadcount(Number(event.target.value.replace(/\D/g, "")) || 1)}
                    className="h-12 w-20 rounded-2xl border-zinc-200 bg-zinc-50 text-center text-lg font-semibold"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    size="icon-lg"
                    className="size-11 rounded-full border-zinc-200 bg-white"
                    onClick={() => resizeHeadcount(headcount + 1)}
                  >
                    <Plus className="size-4" />
                  </Button>
                </div>
              </div>
            </div>

            <div className="mt-4 rounded-[22px] bg-white p-4 shadow-sm">
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-2 text-sm font-medium text-zinc-900">
                  <Users className="size-4 text-orange-500" />
                  자주 함께한 사람
                </div>
                <div className="text-xs text-zinc-500">{filledCount}/{headcount}명 입력</div>
              </div>
              <div className="mt-3 flex flex-wrap gap-2">
                {frequentPeople.length > 0 ? (
                  frequentPeople.map((name) => {
                    const isSelected = peopleSlots.some((slot) => normalizeName(slot) === name)

                    return (
                      <button
                        key={name}
                        type="button"
                        onClick={() => assignPerson(name)}
                        disabled={isSelected}
                        className={cn(
                          "rounded-full px-3 py-2 text-sm transition-all duration-200",
                          isSelected
                            ? "bg-zinc-100 text-zinc-400"
                            : "bg-orange-100 text-orange-700 hover:bg-orange-200"
                        )}
                      >
                        {name}
                      </button>
                    )
                  })
                ) : (
                  <div className="text-sm text-zinc-400">저장된 사람이 아직 없습니다.</div>
                )}
              </div>

              <div className="mt-4 space-y-3">
                {peopleSlots.map((slot, index) => {
                  const suggestions = slotSuggestions(index).slice(0, 6)

                  return (
                    <div
                      key={`slot-${index + 1}`}
                      className="rounded-[20px] border border-zinc-200 bg-zinc-50/70 p-3 transition-all duration-200 focus-within:border-orange-300 focus-within:bg-white"
                    >
                      <div className="flex items-center gap-3">
                        <div className="flex min-w-0 flex-1 items-center gap-2">
                          <div className="rounded-full bg-white px-2.5 py-1 text-xs font-semibold text-zinc-500 shadow-sm">
                            {index + 1}번
                          </div>
                          {index === 0 ? (
                            <div className="flex h-12 flex-1 items-center justify-between rounded-2xl border border-zinc-200 bg-white px-4">
                              <span className="font-medium text-zinc-900">{DEFAULT_PERSON}</span>
                              <span className="inline-flex items-center gap-1 rounded-full bg-zinc-100 px-2 py-1 text-xs text-zinc-500">
                                <Lock className="size-3" />
                                고정
                              </span>
                            </div>
                          ) : (
                            <div className="relative flex-1">
                              <Input
                                value={slot}
                                onFocus={() => setFocusedSlot(index)}
                                onBlur={() => {
                                  commitSlot(index)
                                  window.setTimeout(() => setFocusedSlot((current) => (current === index ? null : current)), 120)
                                }}
                                onChange={(event) => updateSlot(index, event.target.value)}
                                onKeyDown={(event) => {
                                  if (event.key === "Enter") {
                                    event.preventDefault()
                                    commitSlot(index)
                                  }
                                }}
                                placeholder={`${index + 1}번 사람 이름`}
                                className="h-12 rounded-2xl border-zinc-200 bg-white pr-10"
                              />
                              <ChevronDown className="pointer-events-none absolute top-1/2 right-3 size-4 -translate-y-1/2 text-zinc-400" />
                            </div>
                          )}
                        </div>
                      </div>

                      {index > 0 ? (
                        <div className="mt-3 space-y-2">
                          {focusedSlot === index && suggestions.length > 0 ? (
                            <div className="flex flex-wrap gap-2">
                              {suggestions.map((name) => {
                                const disabled = peopleSlots.some(
                                  (selectedName, selectedIndex) =>
                                    selectedIndex !== index && normalizeName(selectedName) === name
                                )

                                return (
                                  <button
                                    key={`${index}-${name}`}
                                    type="button"
                                    disabled={disabled}
                                    onMouseDown={(event) => {
                                      event.preventDefault()
                                      assignPerson(name, index)
                                      setFocusedSlot(index)
                                    }}
                                    className={cn(
                                      "rounded-full px-3 py-1.5 text-xs font-medium transition-all duration-200",
                                      disabled
                                        ? "bg-zinc-100 text-zinc-400"
                                        : "bg-sky-100 text-sky-700 hover:bg-sky-200"
                                    )}
                                  >
                                    {name}
                                  </button>
                                )
                              })}
                            </div>
                          ) : null}
                          {normalizeName(slot) && !savedPeople.includes(normalizeName(slot)) ? (
                            <div className="text-xs text-orange-600">
                              새 이름으로 저장됩니다: {normalizeName(slot)}
                            </div>
                          ) : null}
                        </div>
                      ) : null}
                    </div>
                  )
                })}
              </div>
            </div>

            <Button
              type="button"
              className="mt-4 h-12 w-full rounded-2xl bg-orange-500 text-white shadow-[0_12px_24px_rgba(249,115,22,0.24)] hover:bg-orange-600"
              onClick={handleSaveDraft}
              disabled={!canSaveDraft}
            >
              <MessageCircle className="size-4" />
              {hasDraft ? "💬 미확정 저장됨" : "💬 미확정으로 저장"}
            </Button>
          </section>

          <section className="rounded-[24px] border border-zinc-200 bg-zinc-50/80 p-4">
            <div className="flex items-center justify-between gap-3">
              <div>
                <div className="inline-flex items-center gap-2 rounded-full bg-white px-3 py-1 text-xs font-semibold text-emerald-700 shadow-sm">
                  <ReceiptText className="size-3.5" />
                  STEP 2. 카드 영수증 확인
                </div>
                <p className="mt-3 text-sm font-medium text-zinc-900">
                  카드 승인 문자를 붙여 넣으면 금액과 식당명이 바로 파싱됩니다.
                </p>
              </div>
            </div>

            <div className="mt-4">
              <Textarea
                value={receiptText}
                onChange={(event) => setReceiptText(event.target.value)}
                placeholder={`예시)\n[Web발신]\n승인 113,000원\n김치도가판교테크\n일시불`}
                className="min-h-[148px] rounded-[22px] border-zinc-200 bg-white px-4 py-3 leading-6 shadow-sm"
              />
            </div>

            <div className="mt-4 rounded-[22px] border border-emerald-200 bg-emerald-50 p-4 transition-all duration-200">
              <div className="text-xs font-semibold text-emerald-700">실시간 파싱 결과</div>
              <div className="mt-3 flex items-start justify-between gap-3">
                <div>
                  <div className="text-sm text-zinc-500">금액</div>
                  <div className="mt-1 text-xl font-semibold text-zinc-950">
                    {parsedAmount !== null ? formatWon(parsedAmount) : "아직 인식 전"}
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-sm text-zinc-500">식당명</div>
                  <div className="mt-1 text-base font-semibold text-zinc-950">
                    {parsedRestaurant ?? "아직 인식 전"}
                  </div>
                </div>
              </div>
              {suggestedHeadcount ? (
                <div className="mt-3 text-sm text-emerald-800">
                  권장 인원: {suggestedHeadcount}명 ({formatWon(parsedAmount ?? 0)} ÷ {formatWon(perPersonLimit)})
                </div>
              ) : (
                <div className="mt-3 text-sm text-emerald-800">
                  승인 문자를 붙여 넣으면 자동 계산이 시작됩니다.
                </div>
              )}
            </div>

            <div className="mt-3 rounded-[22px] border border-sky-200 bg-sky-50 p-4 transition-all duration-200">
              <div className="text-xs font-semibold text-sky-700">N빵 계산</div>
              <div className="mt-3 text-lg font-semibold text-zinc-950">
                {parsedAmount !== null ? `${formatWon(parsedAmount)} ÷ ${headcount}명 = ${formatWon(splitAmount ?? 0)}` : "금액을 기다리는 중"}
              </div>
              <div
                className={cn(
                  "mt-2 text-sm font-medium",
                  overage !== null && overage > 0
                    ? "text-red-600"
                    : overage !== null && overage < 0
                      ? "text-emerald-700"
                      : "text-zinc-500"
                )}
              >
                {overage === null && "1인 기준과 비교해 초과 여부를 보여줍니다."}
                {overage !== null && overage > 0 && `+${formatWon(overage)} 초과`}
                {overage !== null && overage < 0 && `${formatWon(Math.abs(overage))} 여유`}
                {overage === 0 && "정확히 1인 기준과 같습니다."}
              </div>
            </div>

            <Button
              type="button"
              className="mt-4 h-12 w-full rounded-2xl bg-zinc-950 text-white hover:bg-zinc-800"
              onClick={handleConfirm}
              disabled={!canConfirm}
            >
              <Check className="size-4" />
              ✅ 확정하기
            </Button>
            {!hasDraft ? (
              <div className="mt-2 text-center text-xs text-zinc-500">
                먼저 STEP 1에서 초안을 저장해야 확정할 수 있습니다.
              </div>
            ) : null}
          </section>
        </CardContent>
      </Card>
    </div>
  )
}
