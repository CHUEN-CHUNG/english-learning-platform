<script lang="ts">
  import { onMount } from 'svelte';
  import { base } from '$app/paths';
  import { readingProgress } from '$lib/stores/readingProgress.svelte';
  import type { ReadingUnit } from '$lib/data/reading-units';

  let { unit }: { unit: ReadingUnit } = $props();

  let hasHandout = $state(false);
  let hasPhrase = $state(false);
  let paragraphsCount = $state(unit.paragraphs || 2);
  let progressPercent = $state(0);
  let openMenu = $state<'synonyms' | 'reading' | ''>('');
  let rootEl: HTMLDivElement;

  const handoutUrl = $derived(`${base}/content/handouts/Handout/${unit.unitCode}/${unit.unitCode}-Handout.pdf`);
  const phraseUrl = $derived(`${base}/content/handouts/phrase-reorganization/${unit.unitCode}/${unit.unitCode}-Phrase.pdf`);

  async function checkFileExists(url: string): Promise<boolean> {
    try {
      const res = await fetch(url, { method: 'HEAD' });
      return res.ok;
    } catch {
      return false;
    }
  }

  function stripBom(s: string): string {
    return s.replace(/^\uFEFF/, '');
  }

  function parseCsvLine(line: string): string[] {
    const parts: string[] = [];
    let cur = '';
    let inQ = false;
    for (const c of line) {
      if (c === '"') inQ = !inQ;
      else if (c === ',' && !inQ) {
        parts.push(cur);
        cur = '';
      } else cur += c;
    }
    parts.push(cur);
    return parts;
  }

  function minParagraph(cell: string): number {
    if (!cell || !String(cell).trim()) return 1;
    const s = String(cell).trim().replace(/^["']|["']$/g, '');
    const nums = s
      .split(/[,，\s]+/)
      .map((x) => parseInt(x.trim(), 10))
      .filter((n) => !Number.isNaN(n));
    if (!nums.length) return 1;
    return Math.min(...nums);
  }

  async function fetchDictionaryMaxParagraph(unitNumber: string): Promise<number | null> {
    const url = `${base}/content/vocabulary/YLE-${unitNumber}/YLE-${unitNumber}-Dictionary.csv`;
    try {
      const r = await fetch(url);
      if (!r.ok) return null;
      let text = await r.text();
      text = stripBom(text);
      const lines = text
        .split(/\n/)
        .map((l) => l.trim())
        .filter((l) => l.length);
      if (lines.length < 2) return null;
      const heads = parseCsvLine(lines[0]).map((h) => stripBom(h).trim().toLowerCase().replace(/\s+/g, ' '));
      const paraIdx = heads.indexOf('para');
      if (paraIdx < 0) return null;
      let maxP = 0;
      for (let i = 1; i < lines.length; i++) {
        const parts = parseCsvLine(lines[i]);
        const m = minParagraph(parts[paraIdx] || '');
        if (m > maxP) maxP = m;
      }
      return maxP > 0 ? maxP : null;
    } catch {
      return null;
    }
  }

  function toggle(menu: 'synonyms' | 'reading', e: MouseEvent) {
    e.stopPropagation();
    openMenu = openMenu === menu ? '' : menu;
  }

  function markTask(taskType: string) {
    readingProgress.markTaskComplete(unit.id, taskType);
  }

  function recordDownload(type: 'handout' | 'phrase') {
    readingProgress.recordDownload(unit.id, type);
  }

  function onQuestionnaire() {
    markTask('questionnaire');
    setTimeout(() => window.location.reload(), 1000);
  }

  onMount(() => {
    progressPercent = readingProgress.getUnitProgress(unit.id);

    void (async () => {
      const [h, p] = await Promise.all([checkFileExists(handoutUrl), checkFileExists(phraseUrl)]);
      hasHandout = h;
      hasPhrase = p;
      const dictMax = await fetchDictionaryMaxParagraph(unit.unitNumber);
      paragraphsCount = dictMax != null ? Math.max(unit.paragraphs || 2, dictMax) : unit.paragraphs || 2;
    })();

    const onDocClick = (ev: MouseEvent) => {
      if (rootEl && !rootEl.contains(ev.target as Node)) openMenu = '';
    };
    document.addEventListener('click', onDocClick);
    return () => document.removeEventListener('click', onDocClick);
  });

  const paragraphs = $derived(Array.from({ length: paragraphsCount }, (_, i) => i + 1));
</script>

<div class="unit-card" bind:this={rootEl}>
  <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px;">
    <h2 class="unit-title" style="margin-bottom: 0;">{unit.title}</h2>
    <div class="progress-container" style="width: 150px; text-align: right;">
      <div style="font-size: 0.85em; color: #666; margin-bottom: 4px;">完成度: {progressPercent}%</div>
      <div style="width: 100%; background-color: #e9ecef; border-radius: 4px; height: 8px; overflow: hidden;">
        <div
          style="width: {progressPercent}%; background-color: {progressPercent === 100 ? '#28a745' : '#007bff'}; height: 100%; transition: width 0.3s ease;"
        ></div>
      </div>
    </div>
  </div>

  <div class="action-grid">
    <div class="dropdown-container">
      <button type="button" class="action-btn w-100" onclick={(e) => toggle('synonyms', e)}>
        <div class="action-title">🎮 同反義詞連連看</div>
        <div class="action-desc">Synonyms &amp; Antonyms Match</div>
      </button>
      <div class="dropdown-menu" class:show={openMenu === 'synonyms'}>
        <a href="{base}/matching-game?unit={unit.unitNumber}" class="dropdown-item" onclick={() => markTask('synonyms')}>Full Article (全文章)</a>
        {#each paragraphs as i (i)}
          <a href="{base}/matching-game?unit={unit.unitNumber}&para={i}" class="dropdown-item" onclick={() => markTask('synonyms')}>Paragraph {i} (第{i}段)</a>
        {/each}
      </div>
    </div>

    <div class="dropdown-container">
      <button type="button" class="action-btn w-100" onclick={(e) => toggle('reading', e)}>
        <div class="action-title">📖 閱讀練習</div>
        <div class="action-desc">Reading Practice</div>
      </button>
      <div class="dropdown-menu" class:show={openMenu === 'reading'}>
        {#each paragraphs as i (i)}
          <a href="{base}/reading-practice?unit={unit.unitNumber}&para={i}" class="dropdown-item" onclick={() => markTask('reading')}>Paragraph {i} (第{i}段)</a>
        {/each}
        <a
          href="{base}/reading-practice?unit={unit.unitNumber}&mode=summary"
          class="dropdown-item"
          style="color: #6b21a8; font-weight: bold;"
          onclick={() => markTask('reading')}>📝 Unit Summary Challenge (文章主旨填空)</a
        >
      </div>
    </div>

    <a
      href={hasHandout ? handoutUrl : '#'}
      target={hasHandout ? '_blank' : '_self'}
      rel="noopener"
      class="action-btn {hasHandout ? '' : 'disabled'}"
      onclick={() => hasHandout && recordDownload('handout')}
    >
      <div class="action-title">📥 課堂講義下載</div>
      <div class="action-desc">{hasHandout ? 'Class Handout (PDF)' : '教材準備中 (Not Ready)'}</div>
    </a>

    <a
      href={hasPhrase ? phraseUrl : '#'}
      target={hasPhrase ? '_blank' : '_self'}
      rel="noopener"
      class="action-btn {hasPhrase ? '' : 'disabled'}"
      onclick={() => hasPhrase && recordDownload('phrase')}
    >
      <div class="action-title">📥 例句重組測驗下載</div>
      <div class="action-desc">{hasPhrase ? 'Phrase Reorganization Quiz (PDF)' : '教材準備中 (Not Ready)'}</div>
    </a>

    <a href="{base}/vocabulary-quiz?unit={unit.unitNumber}" class="action-btn" onclick={() => markTask('quiz')}>
      <div class="action-title">📝 單字總測驗</div>
      <div class="action-desc">Comprehensive Vocabulary Quiz</div>
    </a>

    <button
      type="button"
      data-tally-open="44PkBr"
      data-tally-layout="modal"
      data-tally-width="1500"
      data-tally-overlay="1"
      data-tally-emoji-text="👋"
      data-tally-emoji-animation="wave"
      class="action-btn"
      onclick={onQuestionnaire}
    >
      <div class="action-title">📋 課後問卷</div>
      <div class="action-desc">Unit Questionnaire</div>
    </button>
  </div>
</div>
