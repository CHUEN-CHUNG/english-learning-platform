import { appStorage } from '../shared/storage/StorageManager';
import html2canvas from 'html2canvas';
import { grammarDatabase } from './data';
import type { GrammarUnit, PosterConfig } from './data';

// DOM 元素參考
const unitSelector = document.getElementById('unit-selector') as HTMLSelectElement;
const posterSelector = document.getElementById('poster-selector') as HTMLSelectElement;
const canvas = document.getElementById('canvas-container') as HTMLDivElement;
const exportBtn = document.getElementById('export-btn') as HTMLButtonElement;

// 1. 載入本地暫存 (LocalStorage)，確保重新整理也不會遺失編輯內容
let appDatabase: GrammarUnit[] = JSON.parse(JSON.stringify(grammarDatabase)); // 深拷貝預設資料

async function initEditor() {
  const savedData = await appStorage.load('grammarPosterEdits');

  if (savedData) {
    try {
      const parsedData = typeof savedData === 'string' ? JSON.parse(savedData) : savedData;
      // 將暫存的文字內容合併回當前的資料庫中 (避免 data.ts 更新時結構壞掉)
      appDatabase.forEach(unit => {
        const savedUnit = parsedData.find((u: any) => u.id === unit.id);
        if (savedUnit) {
          unit.posters.forEach(poster => {
            const savedPoster = savedUnit.posters.find((p: any) => p.id === poster.id);
            if (savedPoster) {
              poster.blocks.forEach(block => {
                const savedBlock = savedPoster.blocks.find((b: any) => b.id === block.id);
                if (savedBlock) {
                  if (savedBlock.content) block.content = savedBlock.content; // 覆蓋為使用者編輯過的內容
                  if (savedBlock.top) block.top = savedBlock.top; // 覆蓋使用者拖曳後的位置
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
  
  initUI();
}

// 儲存編輯內容到 LocalStorage
async function saveEdits() {
  await appStorage.save('grammarPosterEdits', appDatabase);
}

let currentUnit: GrammarUnit | undefined;
let currentPoster: PosterConfig | undefined;

// 初始化單元選單
function initUnitSelector() {
  unitSelector.innerHTML = '';
  appDatabase.forEach(unit => {
    const option = document.createElement('option');
    option.value = unit.id;
    option.textContent = unit.name;
    unitSelector.appendChild(option);
  });

  // 預設選擇第一個單元
  if (appDatabase.length > 0) {
    selectUnit(appDatabase[0].id);
  }
}

// 選擇單元並更新海報選單
function selectUnit(unitId: string) {
  currentUnit = appDatabase.find(u => u.id === unitId);
  if (!currentUnit) return;

  posterSelector.innerHTML = '';
  currentUnit.posters.forEach(poster => {
    const option = document.createElement('option');
    option.value = poster.id;
    option.textContent = poster.name;
    posterSelector.appendChild(option);
  });

  // 預設選擇該單元的第一張海報
  if (currentUnit.posters.length > 0) {
    renderPoster(currentUnit.posters[0].id);
  }
}

// 渲染選定的海報
function renderPoster(posterId: string) {
  if (!currentUnit) return;
  currentPoster = currentUnit.posters.find(p => p.id === posterId);
  if (!currentPoster) return;

  // 清空畫布
  canvas.innerHTML = ''; 

  // 載入圖片以獲取真實寬高
  const img = new Image();
  img.onload = () => {
    // 根據圖片的原始大小，動態設定畫布的寬高
    canvas.style.width = `${img.naturalWidth}px`;
    canvas.style.height = `${img.naturalHeight}px`;
    
    // 設定背景圖片
    canvas.style.backgroundImage = `url('${currentPoster!.bgImage}')`;

    // 注入文字區塊
    currentPoster!.blocks.forEach(block => {
      // 建立拖曳容器
      const wrapper = document.createElement('div');
      wrapper.className = 'block-wrapper';
      wrapper.style.top = block.top;
      wrapper.style.left = block.left;
      
      // 特別處理寬高：如果使用者曾經拉大過，就用舊的寬度
      wrapper.style.width = block.width;
      // 確保高度永遠由內容自然撐開，避免被舊設定裁切
      wrapper.style.height = 'auto';

      // 建立拖曳把手
      const handle = document.createElement('div');
      handle.className = 'drag-handle';
      
      const handleText = document.createElement('span');
      handleText.className = 'drag-handle-text';
      handleText.innerHTML = '✥ 拖曳';
      
      // 旋轉控制把手
      const rotateHandle = document.createElement('span');
      rotateHandle.className = 'rotate-handle';
      rotateHandle.innerHTML = '↻';
      rotateHandle.title = '左右拖曳以旋轉';
      
      // 縮放控制把手
      const scaleHandle = document.createElement('span');
      scaleHandle.className = 'rotate-handle';
      scaleHandle.innerHTML = '⤡';
      scaleHandle.title = '左右拖曳以等比縮放';

      handle.appendChild(handleText);
      handle.appendChild(rotateHandle);
      handle.appendChild(scaleHandle);

      // 即使是預設狀態下，在匯出時也會強制隱藏虛線邊框與背景色，由 onclone 處理
      const div = document.createElement('div');
      div.className = `editable-block ${block.className || ''}`;
      div.contentEditable = 'true'; // 讓元素可編輯
      div.innerHTML = block.content;
      
      // 應用儲存的旋轉和縮放
      let currentRotation = block.rotation || 0;
      let currentScale = block.scale || 1;
      
      function updateTransform() {
        wrapper.style.transform = `rotate(${currentRotation}deg) scale(${currentScale})`;
      }
      updateTransform();
      
      // 【新增】：讓文字框的右下角可以拖拉改變寬度 (高度由內容自動撐開)
      div.style.resize = 'horizontal';
      div.style.overflow = 'hidden';
      
      // --- 實作拖曳邏輯 (移動) ---
      let isDragging = false;
      let startX = 0, startY = 0, startLeft = 0, startTop = 0;

      handleText.addEventListener('mousedown', (e) => {
        isDragging = true;
        startX = e.clientX;
        startY = e.clientY;
        startLeft = wrapper.offsetLeft;
        startTop = wrapper.offsetTop;
        
        const onMouseMove = (e: MouseEvent) => {
          if (!isDragging) return;
          const dx = e.clientX - startX;
          const dy = e.clientY - startY;
          const parentRect = canvas.getBoundingClientRect();
          
          // 計算新的百分比位置
          const newLeft = ((startLeft + dx) / parentRect.width) * 100;
          const newTop = ((startTop + dy) / parentRect.height) * 100;
          
          wrapper.style.left = `${newLeft}%`;
          wrapper.style.top = `${newTop}%`;
          
          // 更新資料模型
          block.left = `${newLeft}%`;
          block.top = `${newTop}%`;
          saveEdits();
        };

        const onMouseUp = () => {
          isDragging = false;
          document.removeEventListener('mousemove', onMouseMove);
          document.removeEventListener('mouseup', onMouseUp);
        };

        document.addEventListener('mousemove', onMouseMove);
        document.addEventListener('mouseup', onMouseUp);
      });

      // --- 實作旋轉邏輯 ---
      let isRotating = false;
      let rotateStartX = 0;
      let startRotation = 0;

      rotateHandle.addEventListener('mousedown', (e) => {
        e.stopPropagation(); // 避免觸發拖曳
        isRotating = true;
        rotateStartX = e.clientX;
        startRotation = currentRotation;

        const onRotateMove = (e: MouseEvent) => {
          if (!isRotating) return;
          const dx = e.clientX - rotateStartX;
          currentRotation = startRotation + dx * 0.5; // 每移動1px旋轉0.5度
          updateTransform();
          block.rotation = currentRotation;
          saveEdits();
        };

        const onRotateUp = () => {
          isRotating = false;
          document.removeEventListener('mousemove', onRotateMove);
          document.removeEventListener('mouseup', onRotateUp);
        };

        document.addEventListener('mousemove', onRotateMove);
        document.addEventListener('mouseup', onRotateUp);
      });

      // --- 實作等比縮放邏輯 ---
      let isScaling = false;
      let scaleStartX = 0;
      let startScaleVal = 1;

      scaleHandle.addEventListener('mousedown', (e) => {
        e.stopPropagation(); // 避免觸發拖曳
        isScaling = true;
        scaleStartX = e.clientX;
        startScaleVal = currentScale;

        const onScaleMove = (e: MouseEvent) => {
          if (!isScaling) return;
          const dx = e.clientX - scaleStartX;
          currentScale = Math.max(0.2, startScaleVal + dx * 0.01); // 每移動1px縮放0.01，最小0.2倍
          updateTransform();
          block.scale = currentScale;
          saveEdits();
        };

        const onScaleUp = () => {
          isScaling = false;
          document.removeEventListener('mousemove', onScaleMove);
          document.removeEventListener('mouseup', onScaleUp);
        };

        document.addEventListener('mousemove', onScaleMove);
        document.addEventListener('mouseup', onScaleUp);
      });

      // 監聽輸入事件：當使用者打字時，即時存檔！
      div.addEventListener('input', (e) => {
        const target = e.target as HTMLDivElement;
        block.content = target.innerHTML; // 更新記憶體中的資料
        saveEdits(); // 同步寫入瀏覽器暫存
      });

      // 監聽使用者縮放文字框大小的事件
      let resizeTimeout: number;
      const resizeObserver = new ResizeObserver((entries) => {
        clearTimeout(resizeTimeout);
        resizeTimeout = window.setTimeout(() => {
          for (let entry of entries) {
            // 【重要修復】：改用 offsetWidth / offsetHeight，避免被 CSS transform (scale) 影響導致無限縮小 Bug！
            const divWidth = div.offsetWidth;
            const divHeight = div.offsetHeight;
            const parentWidth = canvas.clientWidth;
            const parentHeight = canvas.clientHeight;
            
            if (parentWidth === 0 || divWidth === 0) return;

            const newWidthPercent = (divWidth / parentWidth) * 100;
            
            // 同時更新 wrapper 確保拖曳與縮放同步 (只限制寬度，高度 auto)
            wrapper.style.width = `${newWidthPercent}%`;
            wrapper.style.height = 'auto';
            
            block.width = `${newWidthPercent}%`;
            saveEdits();
          }
        }, 500); // 延遲存檔避免太頻繁
      });
      resizeObserver.observe(div);

      wrapper.appendChild(handle);
      wrapper.appendChild(div);
      canvas.appendChild(wrapper);
    });
  };
  img.src = currentPoster.bgImage;
}

// 文字格式工具列邏輯
document.getElementById('btn-bold')?.addEventListener('mousedown', (e) => {
  e.preventDefault(); // 避免失去焦點
  document.execCommand('bold', false);
  saveEdits();
});

document.getElementById('color-picker')?.addEventListener('input', (e) => {
  const color = (e.target as HTMLInputElement).value;
  document.execCommand('foreColor', false, color);
  saveEdits();
});

// 放大縮小文字
function changeFontSize(sizeMode: 'up' | 'down' | 'specific', specificSize?: string) {
  const selection = window.getSelection();
  if (!selection || selection.rangeCount === 0 || selection.isCollapsed) return;
  
  // 為了避免複雜的 DOM 操作，我們使用一個簡單的技巧：
  // 1. 使用 execCommand 加上一個特殊的字體大小 (例如 7)
  document.execCommand('fontSize', false, '7');
  
  // 2. 找出剛剛被改變的 font 標籤
  const fonts = document.querySelectorAll('font[size="7"]');
  fonts.forEach(font => {
    // 如果它已經在一個有字體大小的元素內，就拿舊的大小加減
    let currentSize = 16;
    let parent = font.parentElement;
    while(parent && parent.tagName !== 'DIV') {
      if (parent.style.fontSize) {
        currentSize = parseInt(parent.style.fontSize);
        break;
      }
      parent = parent.parentElement;
    }

    let newSize = currentSize;
    if (sizeMode === 'up') {
      newSize = currentSize + 2;
    } else if (sizeMode === 'down') {
      newSize = Math.max(8, currentSize - 2);
    } else if (sizeMode === 'specific' && specificSize) {
      newSize = parseInt(specificSize);
    }
    
    // 替換成 span 並設定精確的 px
    const newSpan = document.createElement('span');
    newSpan.style.fontSize = `${newSize}px`;
    newSpan.innerHTML = font.innerHTML;
    font.parentNode?.replaceChild(newSpan, font);
  });
  
  // 同步更新選單顯示的值 (如果有對應的值)
  const fontSizeSelector = document.getElementById('font-size-selector') as HTMLSelectElement;
  if (fontSizeSelector) {
    // 取得選取範圍後真正的字體大小 (取第一個)
    const selectionNode = window.getSelection()?.anchorNode?.parentElement;
    if (selectionNode && selectionNode.style.fontSize) {
       const finalSize = parseInt(selectionNode.style.fontSize);
       // 檢查選單內有沒有這個選項
       const hasOption = Array.from(fontSizeSelector.options).some(opt => parseInt(opt.value) === finalSize);
       if (hasOption) {
         fontSizeSelector.value = finalSize.toString();
       }
    }
  }

  saveEdits();
}

document.getElementById('font-size-selector')?.addEventListener('change', (e) => {
  const select = e.target as HTMLSelectElement;
  changeFontSize('specific', select.value);
});

document.getElementById('btn-size-up')?.addEventListener('mousedown', (e) => {
  e.preventDefault();
  changeFontSize('up');
});

document.getElementById('btn-size-down')?.addEventListener('mousedown', (e) => {
  e.preventDefault();
  changeFontSize('down');
});

// 切換文字框底色 (透明/半透明白)
document.getElementById('btn-toggle-bg')?.addEventListener('click', () => {
  const blocks = document.querySelectorAll('.editable-block');
  blocks.forEach(block => {
    block.classList.toggle('transparent-bg');
  });
});

// 匯出圖片功能 (使用 html2canvas)
async function exportPoster() {
  if (!currentUnit || !currentPoster) return;
  
  exportBtn.disabled = true;
  exportBtn.textContent = '⏳ 處理中...';

  try {
    // 解決 html2canvas 在捲動與縮放時發生的向上偏移問題
    const canvasElement = await html2canvas(canvas, {
      scale: 2, // 提高解析度
      useCORS: true,
      backgroundColor: null,
      x: window.scrollX, // 修復滾動偏差，讓 x 和 y 加上當前捲動量
      y: window.scrollY, 
      width: canvas.offsetWidth,
      height: canvas.offsetHeight,
      scrollX: 0,
      scrollY: 0,
      onclone: (clonedDoc) => {
        // 在 clone 出來用來截圖的 DOM 裡面做隱藏，避免影響實際頁面，也更徹底
        const clonedCanvas = clonedDoc.getElementById('canvas-container');
        if (clonedCanvas) {
          const clonedBlocks = clonedCanvas.querySelectorAll('.editable-block');
          clonedBlocks.forEach(b => {
            (b as HTMLElement).style.border = 'none';
            (b as HTMLElement).style.backgroundColor = 'transparent'; // 強制所有底色透明
            (b as HTMLElement).style.boxShadow = 'none'; // 確保沒有陰影
            (b as HTMLElement).style.outline = 'none'; // 確保沒有外框
            (b as HTMLElement).style.resize = 'none'; // 隱藏縮放圖示
            
            // 為了不讓子元素 h2, p 等失去排版，保留 editable-block class
            // 但強制覆寫 border 樣式，避免截圖時因為可能有的 focus 或 active 狀態跑出框線
            (b as HTMLElement).style.setProperty('border', 'none', 'important');
          });
          const clonedHandles = clonedCanvas.querySelectorAll('.drag-handle');
          clonedHandles.forEach(h => {
            (h as HTMLElement).style.display = 'none';
          });
        }
      }
    });

    // 下載圖片 (檔名包含單元與海報名稱)
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

// 新增：清除所有編輯紀錄的按鈕 (可選功能，放在 header 內)
const clearBtn = document.createElement('button');
clearBtn.textContent = '🔄 恢復預設文字';
clearBtn.style.backgroundColor = '#e07a5f';
clearBtn.onclick = async () => {
  if(confirm('確定要清除所有編輯紀錄，恢復成最初的預設文字嗎？')) {
    await appStorage.remove('grammarPosterEdits');
    location.reload();
  }
};
document.querySelector('.controls')?.appendChild(clearBtn);

// 綁定事件
unitSelector.addEventListener('change', (e) => {
  selectUnit((e.target as HTMLSelectElement).value);
});

posterSelector.addEventListener('change', (e) => {
  renderPoster((e.target as HTMLSelectElement).value);
});

exportBtn.addEventListener('click', exportPoster);

function initUI() {
  initUnitSelector();
}

// 啟動初始化
initEditor();
