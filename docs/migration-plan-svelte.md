# SvelteKit Migration Plan

## Project Context

- **Repo root**: `c:\Works\Others\english-learning-platform\`
- **Current stack**: Vite 8 + TypeScript 5.9 MPA, 20 HTML entry points in `vite.config.ts`
- **Target stack**: SvelteKit + `@sveltejs/adapter-static` (GitHub Pages)
- **Svelte version**: **Svelte 5** (runes syntax)
- **Deployment**: GitHub Actions → `dist/` → GitHub Pages (`.github/workflows/deploy.yml`)
- **Node package manager**: npm

---

## Svelte 5 Syntax Reference

All components and stores in this project use **Svelte 5 runes**. Do not use Svelte 4 syntax.

### State

```svelte
<!-- Svelte 5 -->
<script lang="ts">
  let lives = $state(3);
  let questions = $state<Question[]>([]);
</script>
```

### Derived State

```svelte
<script lang="ts">
  let lives = $state(3);
  let isGameOver = $derived(lives <= 0);
  let heartDisplay = $derived('❤️'.repeat(lives) + '🖤'.repeat(3 - lives));
</script>
```

### Effects

```svelte
<script lang="ts">
  let score = $state(0);

  $effect(() => {
    // runs when score changes, like Svelte 4's $: reactive block
    document.title = `Score: ${score}`;
  });
</script>
```

### Props

```svelte
<script lang="ts">
  // Svelte 5 — use $props()
  let {
    title,
    subtitle = '',
    returnHref = '/grammar-hub',
    onRestart,
  }: {
    title: string;
    subtitle?: string;
    returnHref?: string;
    onRestart: () => void;
  } = $props();
</script>
```

### Event Handlers (no more `on:click`, no more `createEventDispatcher`)

```svelte
<!-- Svelte 5: use lowercase DOM event attributes -->
<button onclick={handleClick}>Click</button>
<input oninput={handleInput} />
<form onsubmit={handleSubmit}>

<!-- Callback props replace createEventDispatcher -->
<script lang="ts">
  let { onLogin }: { onLogin: (name: string) => void } = $props();
  function submit() { onLogin(trimmedName); }
</script>
```

### `onMount` (still used for browser-only code)

```svelte
<script lang="ts">
  import { onMount } from 'svelte';

  let user = $state('');

  onMount(() => {
    // localStorage is only available in the browser, not during build
    user = localStorage.getItem('current_user') ?? '';
  });
</script>
```

### Shared Reactive State (`.svelte.ts` files)

For state shared across multiple pages/components, use `.svelte.ts` files with runes instead of Svelte 4 `writable` stores.

```typescript
// src/lib/stores/user.svelte.ts
// File extension MUST be .svelte.ts to use runes outside components

const STORAGE_KEY = 'current_user';
let _current = $state<string | null>(null);

export const user = {
  get current() { return _current; },
  init() {
    _current = localStorage.getItem(STORAGE_KEY);
  },
  login(name: string): boolean {
    const trimmed = name.trim();
    if (!trimmed) return false;
    localStorage.setItem(STORAGE_KEY, trimmed);
    _current = trimmed;
    return true;
  },
  logout() {
    localStorage.removeItem(STORAGE_KEY);
    _current = null;
  }
};
```

Usage in a component:
```svelte
<script lang="ts">
  import { user } from '$lib/stores/user.svelte.ts';
  import { onMount } from 'svelte';

  onMount(() => user.init()); // init in browser context only
</script>

{#if user.current}
  <p>Hello, {user.current}</p>
{/if}
```

### `$page` (URL params in SvelteKit — syntax unchanged)

```svelte
<script lang="ts">
  import { page } from '$app/stores';

  // $page is a Svelte store; $ prefix auto-subscribes
  let unit = $derived($page.url.searchParams.get('unit') ?? '');
  let returnTo = $derived($page.url.searchParams.get('returnTo') ?? '/grammar-hub');
</script>
```

---

## Prerender + Browser-Only Code Rule

Every route page **must** have this in its `+page.ts`:

```typescript
// src/routes/games/multiple-choice/+page.ts
export const prerender = true;
export const ssr = false;  // disables SSR, all code runs in browser only
```

Setting `ssr = false` means you do NOT need to wrap every `localStorage` / `window` / `document` call in `onMount`. It runs only in the browser. **Exception**: `onMount` is still required for code that must run after the DOM is mounted (e.g., measuring element sizes, setting up canvas, `html2canvas`).

---

## Source File Inventory

### Entry points (vite.config.ts `input`) — all replaced by SvelteKit routes
```
index.html
APPs/grammar-hub/index.html
APPs/reading-hub/index.html
APPs/reading-practice/index.html
APPs/teacher-hub/index.html
APPs/comic-reader/index.html
APPs/Matching-Game/index.html
APPs/Vocabulary-Quiz/index.html
APPs/grammar-poster-editor/index.html
APPs/grammar-games/finish/multiple-choice/index.html
APPs/grammar-games/finish/unscramble/index.html
APPs/grammar-games/to-do/fill-in/index.html
APPs/grammar-games/to-do/correction/index.html
APPs/grammar-games/dialogue-roleplay/index.html
APPs/grammar-games/traveler-quest/index.html
APPs/grammar-games/traveler-quest/level1-journey/index.html
APPs/grammar-games/traveler-quest/level2-itinerary/index.html
APPs/grammar-games/traveler-quest/level2-how-often/index.html
APPs/grammar-games/traveler-quest/level2-how-long/index.html
APPs/grammar-games/traveler-quest/level3-souvenir/index.html
APPs/grammar-games/time-cop/index.html
APPs/grammar-games/time-cop/game/index.html
```

### Shared source files → migration target
```
shared/game-core/GrammarDataTracker.ts   → src/lib/game-core/GrammarDataTracker.ts  (COPY AS-IS)
shared/game-core/GrammarDashboard.ts     → src/lib/components/game/TeacherDashboard.svelte  (rewrite)
shared/game-core/GrammarScoreboard.ts    → src/lib/components/game/Scoreboard.svelte  (rewrite)
shared/utils/english-tts.ts             → src/lib/utils/english-tts.ts  (COPY AS-IS)
shared/utils/ProgressTracker.js         → src/lib/stores/user.svelte.ts  (rewrite in Svelte 5 runes)
shared/utils/counter.ts                 → (evaluate on use)
shared/components/UIFactory.js          → (evaluate on use)
shared/components/teacher-dashboard.js  → absorbed into TeacherDashboard.svelte
shared/styles/hub-layout.css            → src/app.scss  (merge)
shared/styles/style.scss                → src/app.scss  (merge)
shared/config/tailwind-theme.js         → tailwind.config.ts  (migrate values)
```

### Traveler Quest shared modules → migration target
```
APPs/grammar-games/traveler-quest/shared/npc-ui.ts
  → src/lib/components/game/NpcBlock.svelte
     (renderNpcBlock() returns HTML string — convert to Svelte component)

APPs/grammar-games/traveler-quest/shared/traveler-npc-speech.ts
  → src/lib/utils/traveler-npc-speech.ts  (COPY AS-IS)

APPs/grammar-games/traveler-quest/shared/traveler-audio.ts
  → src/lib/utils/audio.ts  (merge with enter-game-sfx.ts)

APPs/grammar-games/traveler-quest/shared/traveler-quest-bank.ts
  → src/lib/game-core/traveler-quest-bank.ts  (COPY AS-IS)
```

### Static data (must move to `static/`)
```
Content/Vocabulary/           → static/content/vocabulary/
Content/ReadingQA/            → static/content/reading-qa/
Content/grammar/              → static/content/grammar/
Content/Article/              → static/content/articles/
Content/handouts/             → static/content/handouts/
APPs/grammar-games/time-cop/music/  → static/audio/time-cop/
APPs/grammar-games/shared/*.mp3     → static/audio/
```

### Files not part of migration (leave unchanged)
```
scripts/                (Python/Node scripts)
tools/                  (Python content generators)
docs/                   (documentation, including this file)
Grammar/                (CSV grammar rules)
Reading-TOFEL-2026.csv
generated_data.json
presentation.slidev.md
profolio/               (standalone HTML portfolio pages — move to static/profolio/ as-is)
public/generator.html   (move to static/generator.html as-is)
.github/workflows/deploy.yml  (NO CHANGES NEEDED — already uses dist/ and npm run build)
```

---

## Target Directory Structure

```
src/
├── app.html                          # SvelteKit HTML shell
├── app.scss                          # global styles (merged from hub-layout.css + style.scss)
│
├── lib/
│   ├── components/
│   │   ├── game/
│   │   │   ├── GameLayout.svelte     # shared game wrapper: header + timer + lives + hub-link
│   │   │   ├── Scoreboard.svelte     # replaces shared/game-core/GrammarScoreboard.ts
│   │   │   ├── TeacherDashboard.svelte  # replaces shared/game-core/GrammarDashboard.ts
│   │   │   ├── LoginModal.svelte     # shared login modal (currently duplicated in each Hub HTML)
│   │   │   └── NpcBlock.svelte       # replaces traveler-quest/shared/npc-ui.ts
│   │   └── ui/
│   │       ├── HubLayout.svelte      # replaces shared/styles/hub-layout.css structure
│   │       ├── UnitCard.svelte       # grammar hub unit card
│   │       └── ActionBtn.svelte      # grammar hub action button
│   │
│   ├── game-core/
│   │   ├── GrammarDataTracker.ts        # COPY AS-IS
│   │   ├── traveler-quest-bank.ts       # COPY AS-IS
│   │   └── types.ts                     # consolidated interfaces
│   │
│   ├── stores/
│   │   ├── user.svelte.ts               # replaces ProgressTracker.js (Svelte 5 runes)
│   │   └── gameProgress.svelte.ts       # replaces scattered localStorage quest flag reads
│   │
│   └── utils/
│       ├── english-tts.ts               # COPY AS-IS
│       ├── traveler-npc-speech.ts       # COPY AS-IS
│       ├── csv-parser.ts                # consolidated CSV parser
│       └── audio.ts                     # merged: enter-game-sfx + traveler-audio + time-cop-audio
│
└── routes/
    ├── +layout.svelte                # root layout
    ├── +page.svelte                  # / (was: index.html)
    │
    ├── grammar-hub/
    │   ├── +page.ts                  # export const prerender = true; ssr = false
    │   └── +page.svelte              # /grammar-hub
    ├── reading-hub/
    │   ├── +page.ts
    │   └── +page.svelte
    ├── reading-practice/
    │   ├── +page.ts
    │   └── +page.svelte
    ├── teacher-hub/
    │   ├── +page.ts
    │   └── +page.svelte
    ├── comic-reader/
    │   ├── +page.ts
    │   └── +page.svelte
    ├── matching-game/
    │   ├── +page.ts
    │   └── +page.svelte
    ├── vocabulary-quiz/
    │   ├── +page.ts
    │   └── +page.svelte
    ├── grammar-poster-editor/
    │   ├── +page.ts
    │   └── +page.svelte
    │
    └── games/
        ├── multiple-choice/
        │   ├── +page.ts              # prerender=true, ssr=false
        │   └── +page.svelte          # ?unit=XXX&returnTo=XXX&questLevel=XXX
        ├── unscramble/
        │   ├── +page.ts
        │   └── +page.svelte
        ├── fill-in/
        │   ├── +page.ts
        │   └── +page.svelte
        ├── correction/
        │   ├── +page.ts
        │   └── +page.svelte
        ├── dialogue-roleplay/
        │   ├── +page.ts
        │   └── +page.svelte
        ├── traveler-quest/
        │   ├── +page.ts
        │   ├── +page.svelte
        │   ├── level1/
        │   │   ├── +page.ts
        │   │   └── +page.svelte
        │   ├── level2-itinerary/
        │   │   ├── +page.ts
        │   │   └── +page.svelte
        │   ├── level2-how-often/
        │   │   ├── +page.ts
        │   │   └── +page.svelte
        │   ├── level2-how-long/
        │   │   ├── +page.ts
        │   │   └── +page.svelte
        │   └── level3/
        │       ├── +page.ts
        │       └── +page.svelte
        └── time-cop/
            ├── +page.ts
            ├── +page.svelte
            └── game/
                ├── +page.ts
                └── +page.svelte

static/
├── content/
│   ├── vocabulary/
│   ├── reading-qa/
│   ├── grammar/
│   │   └── time-tense/
│   ├── articles/
│   └── handouts/
├── audio/
│   ├── enter-game.mp3
│   └── time-cop/
│       ├── game1.mp3
│       ├── game2.mp3
│       ├── game3.mp3
│       └── final.mp3
├── profolio/               # copied as-is from profolio/
└── generator.html          # copied as-is from public/generator.html
```

---

## URL Migration Map

| Old path | New path | Query params |
|----------|----------|--------------|
| `/index.html` | `/` | — |
| `/APPs/grammar-hub/index.html` | `/grammar-hub` | `?tab=wh&series=how` preserved |
| `/APPs/reading-hub/index.html` | `/reading-hub` | — |
| `/APPs/reading-practice/index.html` | `/reading-practice` | — |
| `/APPs/teacher-hub/index.html` | `/teacher-hub` | — |
| `/APPs/comic-reader/index.html` | `/comic-reader` | — |
| `/APPs/Matching-Game/index.html` | `/matching-game` | — |
| `/APPs/Vocabulary-Quiz/index.html` | `/vocabulary-quiz` | — |
| `/APPs/grammar-poster-editor/index.html` | `/grammar-poster-editor` | — |
| `/APPs/grammar-games/finish/multiple-choice/index.html` | `/games/multiple-choice` | `?unit=XXX&returnTo=XXX&questLevel=XXX` preserved |
| `/APPs/grammar-games/finish/unscramble/index.html` | `/games/unscramble` | `?unit=XXX` preserved |
| `/APPs/grammar-games/to-do/fill-in/index.html` | `/games/fill-in` | — |
| `/APPs/grammar-games/to-do/correction/index.html` | `/games/correction` | — |
| `/APPs/grammar-games/dialogue-roleplay/index.html` | `/games/dialogue-roleplay` | — |
| `/APPs/grammar-games/traveler-quest/index.html` | `/games/traveler-quest` | — |
| `/APPs/grammar-games/traveler-quest/level1-journey/index.html` | `/games/traveler-quest/level1` | — |
| `/APPs/grammar-games/traveler-quest/level2-itinerary/index.html` | `/games/traveler-quest/level2-itinerary` | — |
| `/APPs/grammar-games/traveler-quest/level2-how-often/index.html` | `/games/traveler-quest/level2-how-often` | — |
| `/APPs/grammar-games/traveler-quest/level2-how-long/index.html` | `/games/traveler-quest/level2-how-long` | — |
| `/APPs/grammar-games/traveler-quest/level3-souvenir/index.html` | `/games/traveler-quest/level3` | — |
| `/APPs/grammar-games/time-cop/index.html` | `/games/time-cop` | — |
| `/APPs/grammar-games/time-cop/game/index.html` | `/games/time-cop/game` | — |

---

## localStorage Keys (DO NOT CHANGE — backward compatibility)

```
grammar_platform_data             # { [userName]: { history: GameSessionData[], abandons: GameSessionData[] } }
current_user                      # string
grammarPosterEdits                # grammar poster editor save data
traveler_quest_level1_complete    # "true"
traveler_quest_level2_complete    # "true"
traveler_quest_how_often_complete # "true"
traveler_quest_how_long_complete  # "true"
traveler_quest_level3_complete    # "true"
time_cop_level1_complete          # "true"
time_cop_level2_complete          # "true"
time_cop_level3_complete          # "true"
```

---

## Config Files to Create

### `svelte.config.js`
```javascript
import adapter from '@sveltejs/adapter-static';
import { vitePreprocess } from '@sveltejs/vite-plugin-svelte';

export default {
  preprocess: vitePreprocess(),
  kit: {
    adapter: adapter({
      pages: 'dist',
      assets: 'dist',
      fallback: '404.html'
    }),
    paths: {
      // set to your GitHub Pages repo sub-path, e.g. '/english-learning-platform'
      base: process.env.NODE_ENV === 'production' ? '/english-learning-platform' : ''
    }
  }
};
```

### `vite.config.ts`
```typescript
import { sveltekit } from '@sveltejs/kit/vite';
import { defineConfig } from 'vite';

export default defineConfig({
  plugins: [sveltekit()],
  // remove old rollupOptions.input entirely — SvelteKit handles routing
});
```

### `tsconfig.json`
```json
{
  "extends": "./.svelte-kit/tsconfig.json",
  "compilerOptions": {
    "strict": true,
    "noFallthroughCasesInSwitch": true
  }
}
```

### `tailwind.config.ts`
```typescript
import type { Config } from 'tailwindcss';

export default {
  content: ['./src/**/*.{html,js,svelte,ts}'],
  theme: {
    extend: {
      // migrate color values from shared/config/tailwind-theme.js
    }
  }
} satisfies Config;
```

### `postcss.config.js`
```javascript
export default {
  plugins: {
    tailwindcss: {},
    autoprefixer: {},
  }
};
```

### `package.json` dependencies to install
```bash
# framework
npm install -D @sveltejs/kit @sveltejs/vite-plugin-svelte @sveltejs/adapter-static svelte

# type checking
npm install -D svelte-check

# styles
npm install -D tailwindcss postcss autoprefixer sass

# keep existing
# html2canvas @types/html2canvas @slidev/* typescript vite
```

### `package.json` scripts
```json
{
  "scripts": {
    "dev": "vite dev",
    "build": "vite build",
    "preview": "vite preview",
    "check": "svelte-kit sync && svelte-check --tsconfig ./tsconfig.json"
  }
}
```

### `.gitignore` — add these lines
```
.svelte-kit/
```

### `.github/workflows/deploy.yml` — NO CHANGES NEEDED
The existing workflow already runs `npm run build` and uploads `./dist`. It will work without modification after the migration.

---

## Component Specs

### `src/lib/stores/user.svelte.ts`
Replaces: `shared/utils/ProgressTracker.js`

```typescript
const STORAGE_KEY = 'current_user';

let _current = $state<string | null>(null);

export const user = {
  get current() { return _current; },

  init() {
    _current = localStorage.getItem(STORAGE_KEY);
  },

  login(name: string): boolean {
    const trimmed = name.trim();
    if (!trimmed) return false;
    localStorage.setItem(STORAGE_KEY, trimmed);
    _current = trimmed;
    return true;
  },

  logout() {
    localStorage.removeItem(STORAGE_KEY);
    _current = null;
  }
};
```

Call `user.init()` inside `onMount` in the root `+layout.svelte`.

---

### `src/lib/stores/gameProgress.svelte.ts`
Replaces: scattered `localStorage.getItem('traveler_quest_level1_complete')` calls.

```typescript
const QUEST_KEYS = [
  'traveler_quest_level1_complete',
  'traveler_quest_level2_complete',
  'traveler_quest_how_often_complete',
  'traveler_quest_how_long_complete',
  'traveler_quest_level3_complete',
  'time_cop_level1_complete',
  'time_cop_level2_complete',
  'time_cop_level3_complete',
] as const;

type QuestKey = typeof QUEST_KEYS[number];

let _flags = $state<Record<QuestKey, boolean>>({} as Record<QuestKey, boolean>);

export const gameProgress = {
  get flags() { return _flags; },

  init() {
    for (const key of QUEST_KEYS) {
      _flags[key] = localStorage.getItem(key) === 'true';
    }
  },

  complete(key: QuestKey) {
    localStorage.setItem(key, 'true');
    _flags[key] = true;
  }
};
```

Call `gameProgress.init()` inside `onMount` in the root `+layout.svelte`.

---

### `src/lib/utils/csv-parser.ts`
Replaces: each game's inline `parseCSVLine()` + `parseCSV()`.

```typescript
export function parseCSVLine(line: string): string[] {
  const parts: string[] = [];
  let current = '';
  let inQuotes = false;
  for (const char of line) {
    if (char === '"') { inQuotes = !inQuotes; }
    else if (char === ',' && !inQuotes) { parts.push(current); current = ''; }
    else { current += char; }
  }
  parts.push(current);
  return parts;
}

export function parseCSVRows(csv: string): string[][] {
  return csv.trim().split('\n')
    .slice(1)
    .map(line => line.trim())
    .filter(line => line.length > 0)
    .map(line => parseCSVLine(line));
}
```

---

### `src/lib/game-core/types.ts`
Consolidates interfaces currently scattered across multiple files.

```typescript
export interface GameEvent {
  event: string;
  timestamp: string;
}

export interface QuestionStat {
  grammarPoint: string;
  isCorrect: boolean;
  timeMs: number;
  text?: string;
  targetSentence?: string;
  clicks?: number;
  wrongClicks?: number;
  wrongSubmits?: number;
  attaches?: number;
  detaches?: number;
}

export interface GameSessionData {
  gameType: string;
  date: string;
  unit: string;
  status: 'completed' | 'abandoned';
  score: number;
  duration: number;
  livesLeft: number;
  totalQuestions: number;
  events: GameEvent[];
  stats: QuestionStat[];
}

export interface MCQuestion {
  grammarPoint: string;
  questionText: string;
  options: { key: string; text: string }[];
  correctAnswer: string;
  explanation: string;
}

// Also copy content from APPs/grammar-games/to-do/correction/src/types.ts
```

---

### `src/lib/components/game/GameLayout.svelte`
Shared wrapper used by all game pages.

```svelte
<script lang="ts">
  let {
    title,
    subtitle = '',
    returnHref = '/grammar-hub',
    onTitleClick = undefined,
  }: {
    title: string;
    subtitle?: string;
    returnHref?: string;
    onTitleClick?: () => void;
  } = $props();
</script>

<!-- header, hub return link, slot for game content -->
<div class="game-layout">
  <header>
    <h1 onclick={onTitleClick}>{title}</h1>
    {#if subtitle}<p>{subtitle}</p>{/if}
    <a href={returnHref}>← Back to Hub</a>
  </header>
  <main>
    {@render children()}
  </main>
</div>
```

Note: Svelte 5 uses `{@render children()}` instead of `<slot />`.

---

### `src/lib/components/game/Scoreboard.svelte`
Replaces: `shared/game-core/GrammarScoreboard.ts` (610 lines)

```svelte
<script lang="ts">
  import type { GameSessionData } from '$lib/game-core/types';

  let {
    sessionData = null,
    userName = '',
    onRestart,
    onHome,
  }: {
    sessionData?: GameSessionData | null;
    userName?: string;
    onRestart: () => void;
    onHome: () => void;
  } = $props();

  type Screen = 'result' | 'review' | 'history';
  let screen = $state<Screen>('result');
  let historyUserFilter = $state('all');
  let overlayVisible = $state(false);

  // read grammar_platform_data from localStorage directly (same key, same structure)
</script>

{#if overlayVisible}
  <!-- overlay with {#if screen === 'result'} / 'review' / 'history' blocks -->
{/if}

<!-- Floating action button — always visible -->
<button class="fixed bottom-8 right-8 ..." onclick={() => { screen = 'history'; overlayVisible = true; }}>
  History Score
</button>
```

Key behavior:
- Remove `(window as any).grammarShowHistoryReview` — use Svelte state + onclick instead
- `{#if screen === 'result'}` replaces all `classList.add('hidden')` / `classList.remove('hidden')`
- Reads `grammar_platform_data` from localStorage (same key)

---

### `src/lib/components/game/TeacherDashboard.svelte`
Replaces: `shared/game-core/GrammarDashboard.ts` (290 lines)

```svelte
<script lang="ts">
  let { triggerCount = $bindable(0) }: { triggerCount?: number } = $props();

  const PASSWORD = 'admin';
  let visible = $state(false);

  $effect(() => {
    if (triggerCount > 0 && triggerCount % 5 === 0) {
      const pwd = prompt('請輸入教師密碼 (預設: admin)：');
      if (pwd === PASSWORD) visible = true;
      else if (pwd !== null) alert('密碼錯誤！');
    }
  });
</script>

{#if visible}
  <!-- dashboard overlay — reads grammar_platform_data from localStorage -->
  <!-- also reads legacy keys: grammar_choice_data, grammar_unscramble_data -->
{/if}
```

Usage in a game page:
```svelte
<script lang="ts">
  let titleClickCount = $state(0);
</script>

<TeacherDashboard bind:triggerCount={titleClickCount} />
<h1 onclick={() => titleClickCount++}>Game Title</h1>
```

---

### `src/lib/components/game/LoginModal.svelte`
Replaces: inline login modal repeated in each Hub HTML.

```svelte
<script lang="ts">
  import { user } from '$lib/stores/user.svelte.ts';

  let {
    hubName = '大廳',
    onLogin,
  }: {
    hubName?: string;
    onLogin: (name: string) => void;
  } = $props();

  let nameInput = $state('');

  function submit() {
    if (user.login(nameInput)) onLogin(nameInput);
    else alert('請輸入有效的名字！');
  }
</script>

{#if !user.current}
  <div class="modal-overlay">
    <div class="login-modal">
      <h2>歡迎來到{hubName}</h2>
      <input bind:value={nameInput} onkeydown={e => e.key === 'Enter' && submit()} />
      <button onclick={submit}>開始學習 🚀</button>
    </div>
  </div>
{/if}
```

---

### `src/lib/components/game/NpcBlock.svelte`
Replaces: `APPs/grammar-games/traveler-quest/shared/npc-ui.ts` `renderNpcBlock()` function.

```svelte
<script lang="ts">
  import type { TravelerNpcId } from '$lib/utils/traveler-npc-speech';

  const NPC_META: Record<TravelerNpcId, { emoji: string; label: string }> = {
    guide:      { emoji: '🧳', label: 'Tour Guide' },
    planner:    { emoji: '⏱️', label: 'Time Planner' },
    classmate:  { emoji: '🎒', label: 'Classmate' },
    shopkeeper: { emoji: '👨‍💼', label: 'Shop Owner' },
    customer:   { emoji: '😤', label: 'Difficult Customer' },
  };

  let {
    id,
    line,
    subline = '',
  }: {
    id: TravelerNpcId;
    line: string;
    subline?: string;
  } = $props();

  let meta = $derived(NPC_META[id]);
</script>

<div class="npc-area">
  <div class="npc-avatar" role="img" aria-label={meta.label}>
    <span class="npc-avatar__emoji">{meta.emoji}</span>
  </div>
  <div class="speech-bubble">
    <p>{line}</p>
    {#if subline}<p class="npc-subline">{subline}</p>{/if}
  </div>
</div>
```

---

## Pattern: URL Parameter Handling

Replace:
```typescript
// OLD
const params = new URLSearchParams(window.location.search);
const unit = params.get('unit');
```

With:
```svelte
<!-- NEW (Svelte 5 + SvelteKit) -->
<script lang="ts">
  import { page } from '$app/stores';

  let unit = $derived($page.url.searchParams.get('unit') ?? '');
  let returnTo = $derived($page.url.searchParams.get('returnTo') ?? '/grammar-hub');
  let questLevel = $derived($page.url.searchParams.get('questLevel'));
</script>
```

---

## Pattern: Navigation

Replace:
```typescript
// OLD
window.location.href = '../../../grammar-hub/index.html';
window.location.href = '../../../grammar-hub/index.html?tab=wh';
```

With:
```svelte
<script lang="ts">
  import { goto } from '$app/navigation';
  import { base } from '$app/paths';

  function goHome() {
    goto(`${base}/grammar-hub`);
  }
</script>

<!-- or for static links -->
<a href="{base}/grammar-hub">← Back to Hub</a>
<a href="{base}/grammar-hub?tab=wh">← Wh- Questions</a>
```

---

## Pattern: CSV Fetch

Replace:
```typescript
// OLD — relative paths that break depending on which HTML page you're in
fetch('../../../Content/grammar/Present-Simple-Choice.csv')
```

With:
```typescript
// NEW — always absolute from static/, independent of route
import { base } from '$app/paths';
const res = await fetch(`${base}/content/grammar/Present-Simple-Choice.csv`);
```

---

## Pattern: html2canvas (Grammar Poster Editor)

`html2canvas` accesses the DOM and cannot be imported at the top level. Use dynamic import inside `onMount`.

```svelte
<script lang="ts">
  import { onMount } from 'svelte';

  onMount(async () => {
    const { default: html2canvas } = await import('html2canvas');
    // use html2canvas here
  });
</script>
```

---

## `+page.ts` template (required for every route)

```typescript
// src/routes/games/multiple-choice/+page.ts  (same for all routes)
export const prerender = true;
export const ssr = false;
```

---

## Execution Phases

### Phase 0 — Scaffold
- [ ] Create SvelteKit skeleton: run `npx sv create` in a **temp directory**, then copy `src/`, `svelte.config.js`, `vite.config.ts`, `tsconfig.json` into repo root. Do NOT run it directly in the repo root (it overwrites `package.json` destructively).
- [ ] Install dependencies (see Config Files section)
- [ ] Create `svelte.config.js` with static adapter and correct `base` path
- [ ] Create `src/app.html` (copy `<head>` meta tags from existing `index.html`)
- [ ] Create `src/app.scss` (merge `shared/styles/hub-layout.css` + `shared/styles/style.scss`)
- [ ] Create `tailwind.config.ts` and `postcss.config.js`
- [ ] Add `.svelte-kit/` to `.gitignore`
- [ ] Create placeholder `src/routes/+page.svelte` with `<h1>Hello</h1>`
- [ ] Verify `npm run dev` starts without errors
- [ ] Verify `npm run build` produces `dist/`
- [ ] Verify GitHub Pages deployment succeeds (push to main, check Actions)

### Phase 1 — Shared Infrastructure
- [ ] Copy `shared/game-core/GrammarDataTracker.ts` → `src/lib/game-core/GrammarDataTracker.ts`
- [ ] Copy `shared/utils/english-tts.ts` → `src/lib/utils/english-tts.ts`
- [ ] Copy `APPs/grammar-games/traveler-quest/shared/traveler-npc-speech.ts` → `src/lib/utils/traveler-npc-speech.ts`
- [ ] Copy `APPs/grammar-games/traveler-quest/shared/traveler-quest-bank.ts` → `src/lib/game-core/traveler-quest-bank.ts`
- [ ] Create `src/lib/game-core/types.ts` (consolidate all interfaces)
- [ ] Create `src/lib/utils/csv-parser.ts` (spec above)
- [ ] Create `src/lib/utils/audio.ts` (merge `enter-game-sfx.ts` + `traveler-audio.ts` + `time-cop-audio.ts`)
- [ ] Create `src/lib/stores/user.svelte.ts` (spec above)
- [ ] Create `src/lib/stores/gameProgress.svelte.ts` (spec above)
- [ ] Create `src/lib/components/game/LoginModal.svelte` (spec above)
- [ ] Create `src/lib/components/game/NpcBlock.svelte` (spec above)
- [ ] Create `src/lib/components/ui/HubLayout.svelte`
- [ ] Move `Content/` → `static/content/`
- [ ] Move audio files → `static/audio/`
- [ ] Copy `profolio/` → `static/profolio/`
- [ ] Copy `public/generator.html` → `static/generator.html`

### Phase 2 — Root Layout + Home + Grammar Hub
- [ ] Create `src/routes/+layout.svelte` — call `user.init()` and `gameProgress.init()` in `onMount`
- [ ] Create `src/routes/+page.svelte` (migrate `index.html`)
- [ ] Create `src/lib/components/ui/UnitCard.svelte`
- [ ] Create `src/lib/components/ui/ActionBtn.svelte`
- [ ] Create `src/routes/grammar-hub/+page.ts` (`prerender=true, ssr=false`)
- [ ] Create `src/routes/grammar-hub/+page.svelte`
  - Tab state: `'tenses' | 'wh' | 'adj-np' | 'adv-conj'` driven by `$page.url.searchParams`
  - Series state (inside wh): `'picker' | 'how' | 'when'` driven by `?series=`
  - Quest completion badges read from `gameProgress.flags`
  - Time Cop iframe embed + postMessage listener

### Phase 3 — Shared Game Components
- [ ] Create `src/lib/components/game/GameLayout.svelte` (spec above)
- [ ] Create `src/lib/components/game/Scoreboard.svelte` (spec above)
- [ ] Create `src/lib/components/game/TeacherDashboard.svelte` (spec above)

### Phase 4 — Game Pages (priority order)
For each entry: create `+page.ts` (prerender + ssr), then `+page.svelte` migrating from source files listed. Integrate `GameLayout`, `Scoreboard`, `TeacherDashboard`.

- [ ] `src/routes/games/multiple-choice/`
  - Source: `APPs/grammar-games/finish/multiple-choice/src/main.ts`
  - Source: `APPs/grammar-games/finish/multiple-choice/src/csv-banks.ts`
  - Source: `APPs/grammar-games/finish/multiple-choice/index.html`
  - `GrammarDataTracker` gameType: `"MultipleChoice"`

- [ ] `src/routes/games/unscramble/`
  - Source: `APPs/grammar-games/finish/unscramble/src/main.ts`
  - Source: `APPs/grammar-games/finish/unscramble/index.html`
  - `GrammarDataTracker` gameType: `"Unscramble"`

- [ ] `src/routes/games/correction/`
  - Source: `APPs/grammar-games/to-do/correction/src/main.ts`
  - Source: `APPs/grammar-games/to-do/correction/src/question-banks.ts`
  - Source: `APPs/grammar-games/to-do/correction/src/types.ts`

- [ ] `src/routes/games/fill-in/`
  - Source: `APPs/grammar-games/to-do/fill-in/index.html`

- [ ] `src/routes/games/traveler-quest/` (level picker page)
- [ ] `src/routes/games/traveler-quest/level1/`
  - Source: `APPs/grammar-games/traveler-quest/level1-journey/src/main.ts`
- [ ] `src/routes/games/traveler-quest/level2-itinerary/`
  - Source: `APPs/grammar-games/traveler-quest/level2-itinerary/src/main.ts`
- [ ] `src/routes/games/traveler-quest/level2-how-often/`
  - Source: `APPs/grammar-games/traveler-quest/level2-how-often/src/main.ts`
- [ ] `src/routes/games/traveler-quest/level2-how-long/`
  - Source: `APPs/grammar-games/traveler-quest/level2-how-long/src/main.ts`
- [ ] `src/routes/games/traveler-quest/level3/`
  - Source: `APPs/grammar-games/traveler-quest/level3-souvenir/src/main.ts`

- [ ] `src/routes/games/time-cop/` (level picker)
- [ ] `src/routes/games/time-cop/game/`
  - Source: `APPs/grammar-games/time-cop/game/src/main.ts`
  - Source: `APPs/grammar-games/time-cop/game/src/time-cop-audio.ts`

- [ ] `src/routes/games/dialogue-roleplay/`
  - Source: `APPs/grammar-games/dialogue-roleplay/src/main.js` → convert to TypeScript

### Phase 5 — Hub & Utility Pages
Each entry: create `+page.ts` + `+page.svelte`.

- [ ] `src/routes/reading-hub/` — Source: `APPs/reading-hub/index.html`
- [ ] `src/routes/reading-practice/` — Source: `APPs/reading-practice/src/reading.ts` + HTML
- [ ] `src/routes/teacher-hub/` — Source: `APPs/teacher-hub/index.html` + `teacher-data.js` + `dashboard.js`
- [ ] `src/routes/comic-reader/` — Source: `APPs/comic-reader/index.html`
- [ ] `src/routes/matching-game/` — Source: `APPs/Matching-Game/src/main.ts` + HTML
- [ ] `src/routes/vocabulary-quiz/` — Source: `APPs/Vocabulary-Quiz/src/main.ts` + HTML (if exists)
- [ ] `src/routes/grammar-poster-editor/`
  - Source: `APPs/grammar-poster-editor/main.ts` + `data.ts` + HTML
  - Use dynamic `import('html2canvas')` inside `onMount` (see html2canvas pattern above)
  - localStorage key `grammarPosterEdits` must remain unchanged

### Phase 6 — Cleanup
- [ ] Delete `APPs/` directory
- [ ] Delete `shared/` directory
- [ ] Remove `rollupOptions.input` from `vite.config.ts` (now fully replaced by `svelte.config.js`)
- [ ] Verify all `returnTo` query param values in `grammar-hub/+page.svelte` point to new paths (e.g. `/games/multiple-choice` not `/APPs/...`)
- [ ] Verify localStorage backward compatibility: load the app, check that existing student data in `grammar_platform_data` is still readable
- [ ] Run `npm run check` — zero TypeScript/Svelte errors
- [ ] Run `npm run build` — zero build errors
- [ ] Confirm GitHub Pages deployment and spot-check 3–5 pages in production

---

## Constraints

1. **Never rename localStorage keys** listed in the localStorage Keys section.
2. **Preserve all URL query parameters** (`unit`, `returnTo`, `questLevel`, `tab`, `series`) — these are embedded in teacher-created materials and must keep working.
3. **`GrammarDataTracker.ts`** — copy without modification. Its public interface is stable.
4. **`english-tts.ts`** — copy without modification.
5. **CSV file contents** — do not modify. Only move to `static/content/`.
6. **Every route must have `+page.ts`** with `export const prerender = true` and `export const ssr = false`.
7. **All internal `href` and `fetch()` calls** must be prefixed with `base` from `$app/paths`.
8. **Svelte 5 syntax only** — do not use `export let`, `on:event`, `createEventDispatcher`, or `writable` stores. Use `$props()`, `onclick={}`, callback props, and `.svelte.ts` rune files respectively.
9. **`.github/workflows/deploy.yml` must not be modified** — it already works correctly with the SvelteKit build output.

---

## Recommended AI Models (Cursor)

### Phase → Model mapping

| Phase | Work type | Recommended model |
|-------|-----------|-------------------|
| 0 — Scaffold | Config files, install commands | Claude Sonnet 4.5 |
| 1 — Shared Infrastructure | Copy files, write stores/utils | Claude Sonnet 4.5 |
| 2 — Home + Grammar Hub | 750-line HTML → Svelte | Claude Sonnet 4.5 |
| 3 — Scoreboard / TeacherDashboard | 600-line innerHTML UI → components | Claude Sonnet 4.5 (retry with Opus if errors) |
| 4 — Game pages | 637-line state-machine TS → reactive Svelte | **Claude Opus 4** |
| 5 — Hub & utility pages | Medium pages | Claude Sonnet 4.5 |
| 6 — Cleanup | Delete, verify | Claude Sonnet 4.5 |

### Why not cheaper models for Phase 4

Svelte 5 runes (`$state`, `$derived`, `$effect`, `$props`) are recent syntax. Smaller/faster models frequently produce Svelte 4 syntax or miss reactive bindings when converting 500+ line DOM-manipulation files. Phase 4 files are the highest-risk for silent logic errors.

### Cursor operation strategy

**Use Agent Mode (Composer), not Chat.**
Each Phase requires: read multiple source files → write multiple new files → run `npm run check`. Agent can execute `npm run check` autonomously and fix TypeScript errors before finishing.

**One Phase per session.** Do not ask the agent to execute multiple Phases in a single session. Context accumulation degrades output quality for later files.

**Phase 4: one game per session.** Each game page is an independent task. Do not batch multiple game migrations in one session.

### Prompt template for each Phase

```
Please read @docs/migration-plan-svelte.md

Execute Phase N — [Phase name].

Rules:
- Use Svelte 5 runes syntax only (see "Svelte 5 Syntax Reference" section at top of plan)
- Do not rename any localStorage keys
- Prefix all href and fetch() with base from $app/paths
- After creating all files, run: npm run check
- Fix all TypeScript/Svelte errors before finishing
```
