"use client"

import { useEffect, useState } from "react"
import { CalendarClock, Soup, Users } from "lucide-react"

import { HistoryTab } from "@/components/history-tab"
import { MealForm } from "@/components/meal-form"
import { PeopleTab } from "@/components/people-tab"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { DEFAULT_PERSON, PER_PERSON_LIMIT } from "@/lib/constants"
import { getMeals, getPeopleWithCounts, saveMeal, savePerson } from "@/lib/storage"
import type { Meal, Person } from "@/lib/types"

function todayString() {
  const now = new Date()
  const offset = now.getTimezoneOffset() * 60_000
  return new Date(now.getTime() - offset).toISOString().slice(0, 10)
}

export default function Home() {
  const [activeTab, setActiveTab] = useState("register")
  const [meals, setMeals] = useState<Meal[]>([])
  const [people, setPeople] = useState<Person[]>([])
  const [editingMeal, setEditingMeal] = useState<Meal | null>(null)

  useEffect(() => {
    setMeals(getMeals())
    setPeople(getPeopleWithCounts())
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
      amount: null,
      restaurant: meal.restaurant,
      receiptText: null,
      estimatedAmount: meal.people.length * PER_PERSON_LIMIT,
      confirmed: false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    })
    setActiveTab("register")
  }

  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_top,_rgba(251,146,60,0.18),_transparent_36%),linear-gradient(180deg,_#fff7ed_0%,_#fffdf9_28%,_#ffffff_100%)] px-4 py-6">
      <div className="mx-auto flex w-full max-w-[420px] flex-col gap-5">
        <section className="rounded-[28px] border border-orange-200/80 bg-white/90 p-5 shadow-[0_18px_60px_rgba(251,146,60,0.14)] backdrop-blur">
          <div className="flex items-center justify-between gap-3">
            <div>
              <div className="text-xs font-semibold uppercase tracking-[0.24em] text-orange-500">
                mealog
              </div>
              <h1 className="mt-2 text-[28px] leading-8 font-semibold text-zinc-950">
                같이 먹은 밥,
                <br />
                깔끔하게 기록하기
              </h1>
            </div>
            <div className="rounded-3xl bg-orange-100 px-3 py-2 text-right text-xs text-orange-700">
              <div>{DEFAULT_PERSON} 기본 포함</div>
              <div className="mt-1 font-semibold">
                1인 기준 ₩{PER_PERSON_LIMIT.toLocaleString("ko-KR")}
              </div>
            </div>
          </div>
          <div className="mt-4 flex items-center gap-2 text-sm text-zinc-600">
            <CalendarClock className="size-4 text-orange-500" />
            초안은 💬, 확정은 ✅로 구분됩니다.
          </div>
        </section>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="gap-4">
          <TabsList className="grid h-auto w-full grid-cols-3 rounded-2xl bg-orange-100/80 p-1">
            <TabsTrigger
              value="register"
              className="h-11 rounded-xl text-sm data-active:bg-white data-active:text-orange-700"
            >
              <Soup className="size-4" />
              등록
            </TabsTrigger>
            <TabsTrigger
              value="history"
              className="h-11 rounded-xl text-sm data-active:bg-white data-active:text-orange-700"
            >
              <CalendarClock className="size-4" />
              기록
            </TabsTrigger>
            <TabsTrigger
              value="people"
              className="h-11 rounded-xl text-sm data-active:bg-white data-active:text-orange-700"
            >
              <Users className="size-4" />
              사람
            </TabsTrigger>
          </TabsList>

          <TabsContent value="register">
            <MealForm
              people={people}
              initialMeal={editingMeal}
              onSaveDraft={handleSaveDraft}
              onConfirmMeal={handleConfirmMeal}
              onCancelEdit={() => setEditingMeal(null)}
            />
          </TabsContent>

          <TabsContent value="history">
            <HistoryTab
              meals={meals}
              onCopyMeal={handleCopyMeal}
              onEditMeal={(meal) => {
                setEditingMeal(meal)
                setActiveTab("register")
              }}
            />
          </TabsContent>

          <TabsContent value="people">
            <PeopleTab people={people} onAddPerson={handleAddPerson} />
          </TabsContent>
        </Tabs>
      </div>
    </main>
  )
}
