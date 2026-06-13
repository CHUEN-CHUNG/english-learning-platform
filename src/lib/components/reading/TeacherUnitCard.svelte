<script lang="ts">
  import { onMount } from 'svelte';
  import { base } from '$app/paths';
  import { readingProgress } from '$lib/stores/readingProgress.svelte';
  import { openTeacherDataPanel } from '$lib/teacher-data';
  import type { ReadingUnit } from '$lib/data/reading-units';

  let { unit }: { unit: ReadingUnit } = $props();

  // let hasHandout = $state(false);
  // let hasPhrase = $state(false);
  // let handoutDownloads = $state(0);
  // let phraseDownloads = $state(0);
  let surveyCount = $state(0);

  /*
  const handoutUrl = $derived(`${base}/content/handouts/vocabulary/${unit.unitCode}/${unit.unitCode}-Handout.pdf`);
  const phraseUrl = $derived(
    `${base}/content/handouts/phrase-reorganization/${unit.unitCode}/${unit.unitCode}-Phrase.pdf`
  );

  async function checkFileExists(url: string): Promise<boolean> {
    try {
      const res = await fetch(url, { method: 'HEAD' });
      return res.ok;
    } catch {
      return false;
    }
  }
  */

  function openData(gameType: string) {
    openTeacherDataPanel({
      tab: 'reading',
      gameType,
      unit: { unitCode: unit.unitCode, unitNumber: unit.unitNumber },
      unitTitle: unit.title
    });
  }

  onMount(async () => {
    /*
    const [h, p] = await Promise.all([checkFileExists(handoutUrl), checkFileExists(phraseUrl)]);
    hasHandout = h;
    hasPhrase = p;

    const stats = readingProgress.getPlatformStats(unit.id);
    handoutDownloads = stats.handoutDownloads;
    phraseDownloads = stats.phraseDownloads;
    */
    surveyCount = readingProgress.getSurveyCompletions(unit.id);
  });
</script>

<div class="unit-card">
  <h2 class="unit-title">{unit.title}</h2>
  <div class="action-grid">
    <button type="button" onclick={() => openData('Matching')} class="action-btn data-btn w-100">
      <div class="action-title">📊 同反義詞連連看 (數據)</div>
      <div class="action-desc">Synonyms Match Data</div>
    </button>

    <button type="button" onclick={() => openData('Reading')} class="action-btn data-btn w-100">
      <div class="action-title">📈 閱讀練習 (數據)</div>
      <div class="action-desc">Reading Practice Data</div>
    </button>

    <!--
    <span class="action-btn stats-btn {hasHandout ? '' : 'disabled'}">
      <div class="action-title">📥 課堂講義 (下載次數)</div>
      <div class="action-desc">{hasHandout ? `累積下載: ${handoutDownloads} 次` : '教材準備中 (Not Ready)'}</div>
    </span>

    <span class="action-btn stats-btn {hasPhrase ? '' : 'disabled'}">
      <div class="action-title">📥 例句重組測驗 (下載次數)</div>
      <div class="action-desc">{hasPhrase ? `累積下載: ${phraseDownloads} 次` : '教材準備中 (Not Ready)'}</div>
    </span>
    -->

    <button type="button" onclick={() => openData('Quiz')} class="action-btn data-btn">
      <div class="action-title">📝 單字總測驗 (數據)</div>
      <div class="action-desc">Vocabulary Quiz Data</div>
    </button>

    <span class="action-btn survey-btn">
      <div class="action-title">📋 問卷回復 (已填寫)</div>
      <div class="action-desc">共 {surveyCount} 位學生完成</div>
    </span>
  </div>
</div>
