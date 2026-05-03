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

export function PeopleTab({ people, onAddPerson }: PeopleTabProps) {
  const [name, setName] = useState("")

  return (
    <div className="space-y-4">
      <Card className="border-orange-200/70 bg-white/95">
        <CardHeader>
          <CardTitle className="text-base">함께 먹는 사람 추가</CardTitle>
        </CardHeader>
        <CardContent className="flex gap-2">
          <Input
            value={name}
            onChange={(event) => setName(event.target.value)}
            placeholder="이름 입력"
            className="h-11 border-orange-200 bg-white"
            onKeyDown={(event) => {
              if (event.key === "Enter") {
                event.preventDefault()
                if (name.trim()) {
                  onAddPerson(name)
                  setName("")
                }
              }
            }}
          />
          <Button
            type="button"
            className="h-11 bg-orange-500 text-white hover:bg-orange-600"
            onClick={() => {
              if (!name.trim()) {
                return
              }

              onAddPerson(name)
              setName("")
            }}
          >
            <Plus className="size-4" />
            추가
          </Button>
        </CardContent>
      </Card>

      <div className="space-y-3">
        {people.map((person) => (
          <Card key={person.name} className="border-zinc-200 bg-white/95">
            <CardContent className="flex items-center justify-between py-4">
              <div className="flex items-center gap-3">
                <div className="rounded-2xl bg-orange-100 p-2 text-orange-700">
                  <UserRound className="size-4" />
                </div>
                <div>
                  <div className="font-medium text-zinc-900">
                    {person.name === DEFAULT_PERSON ? `나 (${person.name})` : person.name}
                  </div>
                  <div className="text-xs text-zinc-500">
                    {person.name === DEFAULT_PERSON ? "기본 포함 인물" : "함께한 식사 기록"}
                  </div>
                </div>
              </div>
              <div className="text-right">
                <div className="text-lg font-semibold text-zinc-950">{person.mealCount}</div>
                <div className="text-xs text-zinc-500">회</div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}
