/**
 * 將這段腳本引入 HTML `<head>` 中，必須放在 tailwind CDN script 的下方。
 * 例如：
 * <script src="https://cdn.tailwindcss.com"></script>
 * <script src="../../shared/config/tailwind-theme.js"></script>
 * 
 * 這樣可以統一全站的主題色彩，未來要換顏色只要改這裡。
 */

tailwind.config = {
  theme: {
    extend: {
      colors: {
        // 將品牌顏色語意化 (Semantic Colors)
        primary: {
          DEFAULT: '#2563eb', // blue-600
          hover: '#1d4ed8',   // blue-700
          light: '#eff6ff',   // blue-50
          border: '#dbeafe',  // blue-100
        },
        success: {
          DEFAULT: '#16a34a', // green-600
          hover: '#15803d',   // green-700
          light: '#f0fdf4',   // green-50
          border: '#dcfce7',  // green-100
        },
        warning: {
          DEFAULT: '#eab308', // yellow-500
          hover: '#ca8a04',   // yellow-600
        },
        secondary: {
          DEFAULT: '#f3f4f6', // gray-100
          hover: '#e5e7eb',   // gray-200
          text: '#374151',    // gray-700
        }
      }
    }
  }
}

// 動態寫入原生 CSS 變數，讓純 SCSS/CSS (如 var(--color-primary)) 也能與 Tailwind 顏色同步
const __themeStyle = document.createElement('style');
__themeStyle.innerHTML = `
  :root {
    --color-primary: #2563eb;
    --color-primary-hover: #1d4ed8;
    --color-primary-light: #eff6ff;
    --color-primary-border: #dbeafe;
    
    --color-success: #16a34a;
    --color-success-hover: #15803d;
    --color-success-light: #f0fdf4;
    --color-success-border: #dcfce7;
    
    --color-warning: #eab308;
    --color-warning-hover: #ca8a04;
    
    --color-secondary: #f3f4f6;
    --color-secondary-hover: #e5e7eb;
    --color-secondary-text: #374151;
  }
`;
document.head.appendChild(__themeStyle);
