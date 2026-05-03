# mealog - Meal Logging & Splitting Web App

## Overview
A mobile-first web app for tracking group meals, splitting bills, and managing dining companions. Deployed on Vercel.

## Tech Stack
- **Framework:** Next.js 15 (App Router)
- **UI:** Tailwind CSS + shadcn/ui
- **Storage:** Vercel KV (Redis)
- **Language:** TypeScript
- **Deploy:** Vercel

## Core Features

### 1. Meal Registration (2-step flow)
- Select: date + meal type (아침/점심/저녁)
- Select people from saved list (tag-style multi-select)
- **Step 1 (Draft):** headcount × ₩14,000 = estimated amount. Saveable as "unconfirmed" (💬)
- **Step 2 (Confirm):** Paste card receipt text OR type actual amount → status becomes "confirmed" (✅)
- Show difference from estimate and per-person over/under ₩14,000

### 2. Card Receipt Parsing
- Paste raw SMS text like:
  ```
  [Web발신]
  [MY COMPANY] 승인
  0607 오경주님
  113,000원 일시불
  김치도가판교테크
  잔여한도1,112,600원
  ```
- Auto-extract: amount (113,000), restaurant name (김치도가판교테크)
- From amount, auto-suggest headcount: Math.round(amount / 14000)

### 3. History Tab
- Monthly summary: total meals, total spending
- List of meals: date, meal type icon, restaurant, people, amount, per-person
- Each entry has "복사해서 새로 등록" (copy to new): clones to today's date with same people, allows editing amount/people
- Unconfirmed entries (💬) are visually distinct and tappable to add actual amount

### 4. People Management Tab
- Unique list of all people ever added
- Each person shows meal count (how many times eaten together)
- Add new person
- "나 (경주)" is always included by default and cannot be removed

### 5. N-Split Calculation
- Real-time: total ÷ headcount
- Show ₩14,000 baseline comparison: "+2,000원 초과" or "-1,000원 절약"
- Red highlight if over ₩14,000/person

## Data Model (KV)

### meals (sorted set or hash)
```typescript
interface Meal {
  id: string;           // uuid
  date: string;         // YYYY-MM-DD
  mealType: 'breakfast' | 'lunch' | 'dinner';
  amount: number | null; // null = unconfirmed
  estimatedAmount: number; // headcount × 14000
  restaurant: string | null;
  people: string[];     // list of person names
  confirmed: boolean;
  createdAt: string;
  updatedAt: string;
}
```

### people (set)
```typescript
interface Person {
  name: string;         // unique key
  mealCount: number;    // computed from meals
  createdAt: string;
}
```

## UI Design
- Mobile-first (max-width: 420px centered)
- 3 tabs: 등록 / 기록 / 사람
- Color scheme: dark text, orange accent, clean white cards
- Meal type chips: 🌅 아침 / ☀️ 점심 / 🌙 저녁
- People as rounded tag chips (tap to select/deselect)
- Unconfirmed meals: dashed border or 💬 badge
- Confirmed meals: solid with ✅

## Constants
- PER_PERSON_LIMIT = 14000 (KRW)
- DEFAULT_PERSON = "경주" (always included)

## Pages
- `/` — main app (SPA-style with tabs)
- `/api/meals` — CRUD for meals
- `/api/people` — CRUD for people

## Important Notes
- All text in Korean UI
- Currency formatting: Korean won (₩) with comma separators
- Date format: Korean style (YYYY년 MM월 DD일)
- Must work well on mobile Safari and Chrome
- No authentication needed (single user)
