"use client"

import { useState } from "react"
import { Plus, UserRound } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { DEFAULT_PERSON } from "@/lib/constants"
import type { Person } from "@/lib/types"

interface PeopleTabProps {
  people: Person[]
  onAddPerson: (name: string) => void
}

function normalizeName(value: string) {
  return value.replace(/\s+/g, " ").trim()
}

export function PeopleTab({ people, onAddPerson }: PeopleTabProps) {
  const [name, setName] = useState("")

  const frequentPeople = people.filter((person) => person.name !== DEFAULT_PERSON).slice(0, 10)

  function submit() {
    const normalized = normalizeName(name)

    if (!normalized) {
      return
    }

    onAddPerson(normalized)
    setName("")
  }

  return (
    <div className="space-y-4">
      <Card className="rounded-[28px] border border-zinc-200 bg-white shadow-[0_18px_40px_rgba(15,23,42,0.06)]">
        <CardHeader>
          <CardTitle className="text-lg font-semibold text-zinc-950">사람 관리</CardTitle>
          <div className="text-sm text-zinc-500">
            자주 함께 식사한 사람을 저장해 두면 등록 화면에서 바로 선택할 수 있습니다.
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-2">
            <Input
              value={name}
              onChange={(event) => setName(event.target.value)}
              placeholder="새 사람 이름 추가"
              className="h-12 rounded-2xl border-zinc-200 bg-zinc-50"
              onKeyDown={(event) => {
                if (event.key === "Enter") {
                  event.preventDefault()
                  submit()
                }
              }}
            />
            <Button
              type="button"
              className="h-12 rounded-2xl bg-orange-500 px-4 text-white hover:bg-orange-600"
              onClick={submit}
            >
              <Plus className="size-4" />
              추가
            </Button>
          </div>

          <div className="rounded-[22px] bg-zinc-50 p-4">
            <div className="text-xs font-semibold text-zinc-500">빠른 선택용 상위 멤버</div>
            <div className="mt-3 flex flex-wrap gap-2">
              {frequentPeople.length > 0 ? (
                frequentPeople.map((person) => (
                  <div
                    key={person.name}
                    className="rounded-full bg-white px-3 py-2 text-sm text-zinc-700 shadow-sm"
                  >
                    {person.name}
                  </div>
                ))
              ) : (
                <div className="text-sm text-zinc-400">아직 저장된 추가 인원이 없습니다.</div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="space-y-3">
        {people.map((person) => (
          <Card
            key={person.name}
            className="rounded-[24px] border border-zinc-200 bg-white shadow-[0_12px_24px_rgba(15,23,42,0.05)]"
          >
            <CardContent className="flex items-center justify-between py-5">
              <div className="flex items-center gap-3">
                <div className="rounded-2xl bg-orange-100 p-3 text-orange-700">
                  <UserRound className="size-4" />
                </div>
                <div>
                  <div className="font-medium text-zinc-950">
                    {person.name === DEFAULT_PERSON ? `${DEFAULT_PERSON} (기본)` : person.name}
                  </div>
                  <div className="mt-1 text-sm text-zinc-500">
                    {person.name === DEFAULT_PERSON ? "항상 1번 슬롯에 포함됩니다." : "저장된 참석자"}
                  </div>
                </div>
              </div>
              <div className="rounded-2xl bg-zinc-50 px-3 py-2 text-right">
                <div className="text-lg font-semibold text-zinc-950">{person.mealCount}</div>
                <div className="text-xs text-zinc-500">함께한 식사</div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}
