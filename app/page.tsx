"use client"

import { useEffect, useState } from "react"
import { CalendarClock, Settings2, Soup, Users, X } from "lucide-react"

import { HistoryTab } from "@/components/history-tab"
import { MealForm } from "@/components/meal-form"
import { PeopleTab } from "@/components/people-tab"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { DEFAULT_PERSON, PER_PERSON_LIMIT } from "@/lib/constants"
import {
  deleteMeal,
  getMeals,
  getPeopleWithCounts,
  getSettings,
  saveMeal,
  savePerson,
  saveSettings,
} from "@/lib/storage"
import type { Meal, Person } from "@/lib/types"

function todayString() {
  const now = new Date()
  const offset = now.getTimezoneOffset() * 60_000
  return new Date(now.getTime() - offset).toISOString().slice(0, 10)
}

function formatWon(value: number) {
  return `${value.toLocaleString("ko-KR")}원`
}

export default function Home() {
  const [activeTab, setActiveTab] = useState("register")
  const [meals, setMeals] = useState<Meal[]>([])
  const [people, setPeople] = useState<Person[]>([])
  const [editingMeal, setEditingMeal] = useState<Meal | null>(null)
  const [perPersonLimit, setPerPersonLimit] = useState(PER_PERSON_LIMIT)
  const [settingsOpen, setSettingsOpen] = useState(false)
  const [settingsInput, setSettingsInput] = useState(String(PER_PERSON_LIMIT))

  useEffect(() => {
    setMeals(getMeals())
    setPeople(getPeopleWithCounts())

    const settings = getSettings()
    setPerPersonLimit(settings.perPersonLimit)
    setSettingsInput(String(settings.perPersonLimit))
  }, [])

  function refreshAll() {
    setMeals(getMeals())
    setPeople(getPeopleWithCounts())
  }

  function handleSaveDraft(meal: Meal) {
    saveMeal(meal)
    setEditingMeal(meal)
    refreshAll()
  }

  function handleConfirmMeal(meal: Meal) {
    saveMeal(meal)
    setEditingMeal(null)
    refreshAll()
    setActiveTab("history")
  }

  function handleAddPerson(name: string) {
    savePerson(name)
    refreshAll()
  }

  function handleCopyMeal(meal: Meal) {
    setEditingMeal({
      ...meal,
      id: "",
      date: todayString(),
      headcount: meal.headcount,
      amount: null,
      restaurant: meal.restaurant,
      receiptText: null,
      estimatedAmount: meal.headcount * perPersonLimit,
      confirmed: false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    })
    setActiveTab("register")
  }

  function handleDeleteMeal(id: string) {
    deleteMeal(id)
    setMeals(getMeals())
  }

  function handleSaveSettings() {
    const nextValue = Number(settingsInput.replace(/[^\d]/g, "")) || PER_PERSON_LIMIT
    const saved = saveSettings({ perPersonLimit: nextValue })

    setPerPersonLimit(saved.perPersonLimit)
    setSettingsInput(String(saved.perPersonLimit))
    setSettingsOpen(false)
  }

  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_top,_rgba(249,115,22,0.18),_transparent_30%),linear-gradient(180deg,_#fffaf5_0%,_#fffefe_34%,_#f8fafc_100%)] px-4 py-5">
      <div className="mx-auto flex w-full max-w-[420px] flex-col gap-5">
        <section className="rounded-[32px] border border-white/70 bg-white/90 p-5 shadow-[0_24px_60px_rgba(15,23,42,0.08)] backdrop-blur">
          <div className="flex items-start justify-between gap-4">
            <div>
              <div className="text-xs font-semibold uppercase tracking-[0.24em] text-orange-500">
                mealog
              </div>
              <h1 className="mt-2 text-[26px] leading-8 font-medium text-zinc-950">
                Split meals,
                <br />
                track everything.
              </h1>
              <p className="mt-3 text-sm leading-6 text-zinc-500">
                Draft first, confirm with receipt later.
              </p>
            </div>
            <Button
              type="button"
              variant="outline"
              size="icon-lg"
              className="size-12 rounded-full border-zinc-200 bg-white"
              onClick={() => setSettingsOpen(true)}
            >
              <Settings2 className="size-5 text-zinc-700" />
            </Button>
          </div>

          <div className="mt-5 flex items-center justify-between rounded-[24px] bg-zinc-950 px-4 py-3 text-white">
            <div>
              <div className="text-xs text-zinc-300">현재 1인 기준</div>
              <div className="mt-1 text-lg font-semibold">{formatWon(perPersonLimit)}</div>
            </div>
            <div className="text-right text-xs text-zinc-300">
              <div>{DEFAULT_PERSON}는 항상 포함</div>
              <div className="mt-1">초안은 💬, 확정은 ✅</div>
            </div>
          </div>
        </section>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="gap-4">
          <TabsList className="grid h-auto w-full grid-cols-3 rounded-[24px] bg-white/80 p-1.5 shadow-[0_12px_30px_rgba(15,23,42,0.05)]">
            <TabsTrigger
              value="register"
              className="h-12 rounded-[18px] text-sm font-medium data-active:bg-orange-500 data-active:text-white"
            >
              <Soup className="size-4" />
              등록
            </TabsTrigger>
            <TabsTrigger
              value="history"
              className="h-12 rounded-[18px] text-sm font-medium data-active:bg-orange-500 data-active:text-white"
            >
              <CalendarClock className="size-4" />
              기록
            </TabsTrigger>
            <TabsTrigger
              value="people"
              className="h-12 rounded-[18px] text-sm font-medium data-active:bg-orange-500 data-active:text-white"
            >
              <Users className="size-4" />
              사람
            </TabsTrigger>
          </TabsList>

          <TabsContent value="register">
            <MealForm
              people={people}
              initialMeal={editingMeal}
              perPersonLimit={perPersonLimit}
              onSaveDraft={handleSaveDraft}
              onConfirmMeal={handleConfirmMeal}
              onCancelEdit={() => setEditingMeal(null)}
              onSavePerson={handleAddPerson}
            />
          </TabsContent>

          <TabsContent value="history">
            <HistoryTab
              meals={meals}
              perPersonLimit={perPersonLimit}
              onCopyMeal={handleCopyMeal}
              onDeleteMeal={handleDeleteMeal}
              onEditMeal={(meal) => {
                setEditingMeal(meal)
                setActiveTab("register")
                // Scroll to STEP 2 receipt section after tab switch
                setTimeout(() => {
                  document.getElementById("step2-receipt")?.scrollIntoView({ behavior: "smooth", block: "start" })
                }, 100)
              }}
            />
          </TabsContent>

          <TabsContent value="people">
            <PeopleTab people={people} onAddPerson={handleAddPerson} />
          </TabsContent>
        </Tabs>
      </div>

      {settingsOpen ? (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-zinc-950/30 px-4 pb-4 pt-16 backdrop-blur-sm">
          <div className="w-full max-w-[420px] rounded-[28px] border border-white/70 bg-white p-5 shadow-[0_30px_80px_rgba(15,23,42,0.16)]">
            <div className="flex items-start justify-between gap-3">
              <div>
                <div className="text-lg font-semibold text-zinc-950">설정</div>
                <div className="mt-1 text-sm text-zinc-500">
                  모든 예상 금액, N빵 계산, 초과 여부에 이 기준값을 사용합니다.
                </div>
              </div>
              <Button
                type="button"
                variant="ghost"
                size="icon-lg"
                className="size-10 rounded-full"
                onClick={() => setSettingsOpen(false)}
              >
                <X className="size-4" />
              </Button>
            </div>

            <div className="mt-5 rounded-[22px] bg-zinc-50 p-4">
              <label className="space-y-2">
                <span className="text-sm font-medium text-zinc-700">1인 기준 금액</span>
                <Input
                  inputMode="numeric"
                  value={settingsInput}
                  onChange={(event) => setSettingsInput(event.target.value.replace(/[^\d]/g, ""))}
                  className="h-12 rounded-2xl border-zinc-200 bg-white text-base"
                />
              </label>
              <div className="mt-2 text-xs text-zinc-500">
                기본값은 {formatWon(PER_PERSON_LIMIT)}이며, 변경값은 브라우저에 저장됩니다.
              </div>
            </div>

            <div className="mt-5 flex gap-2">
              <Button
                type="button"
                variant="outline"
                className="h-12 flex-1 rounded-2xl border-zinc-200"
                onClick={() => setSettingsOpen(false)}
              >
                취소
              </Button>
              <Button
                type="button"
                className="h-12 flex-1 rounded-2xl bg-orange-500 text-white hover:bg-orange-600"
                onClick={handleSaveSettings}
              >
                저장
              </Button>
            </div>
          </div>
        </div>
      ) : null}
    </main>
  )
}
