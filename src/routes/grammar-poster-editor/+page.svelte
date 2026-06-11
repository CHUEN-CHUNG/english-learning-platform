<script lang="ts">
  import { onMount } from 'svelte';
  import { base } from '$app/paths';
  import { grammarDatabase, type GrammarUnit, type PosterConfig } from '$lib/data/grammar-posters';
  import '$lib/styles/grammar-poster-editor.scss';

  onMount(() => {
    const unitSelector = document.getElementById('unit-selector') as HTMLSelectElement;
    const posterSelector = document.getElementById('poster-selector') as HTMLSelectElement;
    const canvas = document.getElementById('canvas-container') as HTMLDivElement;
    const exportBtn = document.getElementById('export-btn') as HTMLButtonElement;

    const cleanups: Array<() => void> = [];

    // 深拷貝預設資料 + 合併本地暫存
    const appDatabase: GrammarUnit[] = JSON.parse(JSON.stringify(grammarDatabase));
    const savedData = localStorage.getItem('grammarPosterEdits');
    if (savedData) {
      try {
        const parsedData = JSON.parse(savedData);
        appDatabase.forEach((unit) => {
          const savedUnit = parsedData.find((u: any) => u.id === unit.id);
          if (savedUnit) {
            unit.posters.forEach((poster) => {
              const savedPoster = savedUnit.posters.find((p: any) => p.id === poster.id);
              if (savedPoster) {
                poster.blocks.forEach((block) => {
                  const savedBlock = savedPoster.blocks.find((b: any) => b.id === block.id);
                  if (savedBlock) {
                    if (savedBlock.content) block.content = savedBlock.content;
                    if (savedBlock.top) block.top = savedBlock.top;
                    if (savedBlock.left) block.left = savedBlock.left;
                    if (savedBlock.width) block.width = savedBlock.width;
                    if (savedBlock.rotation !== undefined) block.rotation = savedBlock.rotation;
                    if (savedBlock.scale !== undefined) block.scale = savedBlock.scale;
                  }
                });
              }
            });
          }
        });
      } catch (e) {
        console.error('讀取暫存失敗', e);
      }
    }

    function saveEdits() {
      localStorage.setItem('grammarPosterEdits', JSON.stringify(appDatabase));
    }

    function resolveBg(src: string): string {
      // data uses absolute "/images/..." — prefix with SvelteKit base
      return src.startsWith('/') ? `${base}${src}` : `${base}/${src}`;
    }

    let currentUnit: GrammarUnit | undefined;
    let currentPoster: PosterConfig | undefined;

    function renderBlocks() {
      if (!currentPoster) return;
      canvas.innerHTML = '';
      currentPoster.blocks.forEach((block) => {
        const wrapper = document.createElement('div');
        wrapper.className = 'block-wrapper';
        wrapper.style.top = block.top;
        wrapper.style.left = block.left;
        wrapper.style.width = block.width;
        wrapper.style.height = 'auto';

        const handle = document.createElement('div');
        handle.className = 'drag-handle';

        const handleText = document.createElement('span');
        handleText.className = 'drag-handle-text';
        handleText.innerHTML = '✥ 拖曳';

        const rotateHandle = document.createElement('span');
        rotateHandle.className = 'rotate-handle';
        rotateHandle.innerHTML = '↻';
        rotateHandle.title = '左右拖曳以旋轉';

        const scaleHandle = document.createElement('span');
        scaleHandle.className = 'rotate-handle';
        scaleHandle.innerHTML = '⤡';
        scaleHandle.title = '左右拖曳以等比縮放';

        handle.appendChild(handleText);
        handle.appendChild(rotateHandle);
        handle.appendChild(scaleHandle);

        const div = document.createElement('div');
        div.className = `editable-block ${block.className || ''}`;
        div.contentEditable = 'true';
        div.innerHTML = block.content;

        let currentRotation = block.rotation || 0;
        let currentScale = block.scale || 1;
        function updateTransform() {
          wrapper.style.transform = `rotate(${currentRotation}deg) scale(${currentScale})`;
        }
        updateTransform();

        div.style.resize = 'horizontal';
        div.style.overflow = 'hidden';

        // 拖曳移動
        handleText.addEventListener('mousedown', (e) => {
          const startX = e.clientX;
          const startY = e.clientY;
          const startLeft = wrapper.offsetLeft;
          const startTop = wrapper.offsetTop;
          let dragging = true;

          const onMouseMove = (ev: MouseEvent) => {
            if (!dragging) return;
            const dx = ev.clientX - startX;
            const dy = ev.clientY - startY;
            const parentRect = canvas.getBoundingClientRect();
            const newLeft = ((startLeft + dx) / parentRect.width) * 100;
            const newTop = ((startTop + dy) / parentRect.height) * 100;
            wrapper.style.left = `${newLeft}%`;
            wrapper.style.top = `${newTop}%`;
            block.left = `${newLeft}%`;
            block.top = `${newTop}%`;
            saveEdits();
          };
          const onMouseUp = () => {
            dragging = false;
            document.removeEventListener('mousemove', onMouseMove);
            document.removeEventListener('mouseup', onMouseUp);
          };
          document.addEventListener('mousemove', onMouseMove);
          document.addEventListener('mouseup', onMouseUp);
        });

        // 旋轉
        rotateHandle.addEventListener('mousedown', (e) => {
          e.stopPropagation();
          const rotateStartX = e.clientX;
          const startRotation = currentRotation;
          let rotating = true;
          const onRotateMove = (ev: MouseEvent) => {
            if (!rotating) return;
            const dx = ev.clientX - rotateStartX;
            currentRotation = startRotation + dx * 0.5;
            updateTransform();
            block.rotation = currentRotation;
            saveEdits();
          };
          const onRotateUp = () => {
            rotating = false;
            document.removeEventListener('mousemove', onRotateMove);
            document.removeEventListener('mouseup', onRotateUp);
          };
          document.addEventListener('mousemove', onRotateMove);
          document.addEventListener('mouseup', onRotateUp);
        });

        // 等比縮放
        scaleHandle.addEventListener('mousedown', (e) => {
          e.stopPropagation();
          const scaleStartX = e.clientX;
          const startScaleVal = currentScale;
          let scaling = true;
          const onScaleMove = (ev: MouseEvent) => {
            if (!scaling) return;
            const dx = ev.clientX - scaleStartX;
            currentScale = Math.max(0.2, startScaleVal + dx * 0.01);
            updateTransform();
            block.scale = currentScale;
            saveEdits();
          };
          const onScaleUp = () => {
            scaling = false;
            document.removeEventListener('mousemove', onScaleMove);
            document.removeEventListener('mouseup', onScaleUp);
          };
          document.addEventListener('mousemove', onScaleMove);
          document.addEventListener('mouseup', onScaleUp);
        });

        div.addEventListener('input', (e) => {
          const target = e.target as HTMLDivElement;
          block.content = target.innerHTML;
          saveEdits();
        });

        let resizeTimeout: number;
        const resizeObserver = new ResizeObserver((entries) => {
          clearTimeout(resizeTimeout);
          resizeTimeout = window.setTimeout(() => {
            for (const _entry of entries) {
              const divWidth = div.offsetWidth;
              const parentWidth = canvas.clientWidth;
              if (parentWidth === 0 || divWidth === 0) return;
              const newWidthPercent = (divWidth / parentWidth) * 100;
              wrapper.style.width = `${newWidthPercent}%`;
              wrapper.style.height = 'auto';
              block.width = `${newWidthPercent}%`;
              saveEdits();
            }
          }, 500);
        });
        resizeObserver.observe(div);
        cleanups.push(() => resizeObserver.disconnect());

        wrapper.appendChild(handle);
        wrapper.appendChild(div);
        canvas.appendChild(wrapper);
      });
    }

    function renderPoster(posterId: string) {
      if (!currentUnit) return;
      currentPoster = currentUnit.posters.find((p) => p.id === posterId);
      if (!currentPoster) return;

      canvas.innerHTML = '';
      const bg = resolveBg(currentPoster.bgImage);
      const img = new Image();
      img.onload = () => {
        canvas.style.width = `${img.naturalWidth}px`;
        canvas.style.height = `${img.naturalHeight}px`;
        canvas.style.backgroundImage = `url('${bg}')`;
        renderBlocks();
      };
      img.onerror = () => {
        // 背景圖缺失時仍提供可用的預設畫布尺寸
        canvas.style.width = '1024px';
        canvas.style.height = '768px';
        canvas.style.backgroundImage = 'none';
        renderBlocks();
      };
      img.src = bg;
    }

    function selectUnit(unitId: string) {
      currentUnit = appDatabase.find((u) => u.id === unitId);
      if (!currentUnit) return;
      posterSelector.innerHTML = '';
      currentUnit.posters.forEach((poster) => {
        const option = document.createElement('option');
        option.value = poster.id;
        option.textContent = poster.name;
        posterSelector.appendChild(option);
      });
      if (currentUnit.posters.length > 0) {
        renderPoster(currentUnit.posters[0].id);
      }
    }

    function initUnitSelector() {
      unitSelector.innerHTML = '';
      appDatabase.forEach((unit) => {
        const option = document.createElement('option');
        option.value = unit.id;
        option.textContent = unit.name;
        unitSelector.appendChild(option);
      });
      if (appDatabase.length > 0) selectUnit(appDatabase[0].id);
    }

    // 工具列
    const btnBold = document.getElementById('btn-bold');
    const onBold = (e: Event) => {
      e.preventDefault();
      document.execCommand('bold', false);
      saveEdits();
    };
    btnBold?.addEventListener('mousedown', onBold);

    const colorPicker = document.getElementById('color-picker') as HTMLInputElement | null;
    const onColor = (e: Event) => {
      const color = (e.target as HTMLInputElement).value;
      document.execCommand('foreColor', false, color);
      saveEdits();
    };
    colorPicker?.addEventListener('input', onColor);

    function changeFontSize(specificSize: string) {
      const selection = window.getSelection();
      if (!selection || selection.rangeCount === 0 || selection.isCollapsed) return;
      document.execCommand('fontSize', false, '7');
      const fonts = document.querySelectorAll('font[size="7"]');
      fonts.forEach((font) => {
        const newSize = parseInt(specificSize);
        const newSpan = document.createElement('span');
        newSpan.style.fontSize = `${newSize}px`;
        newSpan.innerHTML = font.innerHTML;
        font.parentNode?.replaceChild(newSpan, font);
      });
      saveEdits();
    }

    const fontSizeSelector = document.getElementById('font-size-selector') as HTMLSelectElement | null;
    const onFontSize = (e: Event) => changeFontSize((e.target as HTMLSelectElement).value);
    fontSizeSelector?.addEventListener('change', onFontSize);

    const toggleBgBtn = document.getElementById('btn-toggle-bg');
    const onToggleBg = () => {
      canvas.querySelectorAll('.editable-block').forEach((block) => {
        block.classList.toggle('transparent-bg');
      });
    };
    toggleBgBtn?.addEventListener('click', onToggleBg);

    async function exportPoster() {
      if (!currentUnit || !currentPoster) return;
      exportBtn.disabled = true;
      exportBtn.textContent = '⏳ 處理中...';
      try {
        const { default: html2canvas } = await import('html2canvas');
        const canvasElement = await html2canvas(canvas, {
          scale: 2,
          useCORS: true,
          backgroundColor: null,
          x: window.scrollX,
          y: window.scrollY,
          width: canvas.offsetWidth,
          height: canvas.offsetHeight,
          scrollX: 0,
          scrollY: 0,
          onclone: (clonedDoc) => {
            const clonedCanvas = clonedDoc.getElementById('canvas-container');
            if (clonedCanvas) {
              clonedCanvas.querySelectorAll('.editable-block').forEach((b) => {
                const el = b as HTMLElement;
                el.style.border = 'none';
                el.style.backgroundColor = 'transparent';
                el.style.boxShadow = 'none';
                el.style.outline = 'none';
                el.style.resize = 'none';
                el.style.setProperty('border', 'none', 'important');
              });
              clonedCanvas.querySelectorAll('.drag-handle').forEach((h) => {
                (h as HTMLElement).style.display = 'none';
              });
            }
          }
        });
        const link = document.createElement('a');
        link.download = `Grammar_${currentUnit.id}_${currentPoster.id}.png`;
        link.href = canvasElement.toDataURL('image/png');
        link.click();
      } catch (error) {
        console.error('匯出失敗:', error);
        alert('匯出圖片時發生錯誤！');
      } finally {
        exportBtn.disabled = false;
        exportBtn.textContent = '📸 匯出海報 (Export Image)';
      }
    }

    const onUnitChange = (e: Event) => selectUnit((e.target as HTMLSelectElement).value);
    const onPosterChange = (e: Event) => renderPoster((e.target as HTMLSelectElement).value);
    unitSelector.addEventListener('change', onUnitChange);
    posterSelector.addEventListener('change', onPosterChange);
    exportBtn.addEventListener('click', exportPoster);

    const clearBtn = document.getElementById('clear-btn');
    const onClear = () => {
      if (confirm('確定要清除所有編輯紀錄，恢復成最初的預設文字嗎？')) {
        localStorage.removeItem('grammarPosterEdits');
        location.reload();
      }
    };
    clearBtn?.addEventListener('click', onClear);

    initUnitSelector();

    return () => {
      cleanups.forEach((fn) => fn());
      btnBold?.removeEventListener('mousedown', onBold);
      colorPicker?.removeEventListener('input', onColor);
      fontSizeSelector?.removeEventListener('change', onFontSize);
      toggleBgBtn?.removeEventListener('click', onToggleBg);
      unitSelector.removeEventListener('change', onUnitChange);
      posterSelector.removeEventListener('change', onPosterChange);
      exportBtn.removeEventListener('click', exportPoster);
      clearBtn?.removeEventListener('click', onClear);
    };
  });
</script>

<svelte:head>
  <title>魔法文法海報編輯器</title>
</svelte:head>

<div class="poster-editor-root">
  <div id="app">
    <header>
      <h1>✨ 魔法文法海報編輯器 ✨</h1>
      <div class="controls">
        <select id="unit-selector"></select>
        <select id="poster-selector"></select>
        <button id="export-btn">📸 匯出海報 (Export Image)</button>
        <button id="clear-btn" style="background-color:#e07a5f;">🔄 恢復預設文字</button>
        <a class="pe-back" href="{base}/grammar-hub">
          <button type="button" style="background-color:#888;">🏠 回 Hub</button>
        </a>
      </div>
      <div class="format-toolbar" id="format-toolbar">
        <button type="button" id="btn-bold" title="粗體"><b>B</b></button>
        <input type="color" id="color-picker" title="文字顏色" value="#000000" />
        <select id="font-size-selector" title="選擇字體大小">
          <option value="12">12px</option>
          <option value="14">14px</option>
          <option value="16" selected>16px</option>
          <option value="18">18px</option>
          <option value="20">20px</option>
          <option value="24">24px</option>
          <option value="28">28px</option>
          <option value="32">32px</option>
          <option value="36">36px</option>
          <option value="42">42px</option>
          <option value="48">48px</option>
        </select>
        <button type="button" id="btn-toggle-bg" title="切換文字框底色 (透明/半透明白)">🔳 透明底</button>
        <span class="toolbar-hint">選取文字後修改樣式</span>
      </div>
      <p class="hint">💡 提示：拖曳左上角的「✥」可以移動文字框。編輯完成後點擊「匯出海報」即可下載圖片。</p>
    </header>

    <main style="width: 100%; display: flex; justify-content: center; padding-bottom: 50px; overflow-x: auto;">
      <div id="canvas-container" class="poster-canvas"></div>
    </main>
  </div>
</div>
