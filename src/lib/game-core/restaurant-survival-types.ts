export type GameState = 
  | 'idle'               // 等待開始
  | 'spinning'           // 轉盤中
  | 'scenario_assigned'  // 分配到角色/限制條件，顯示菜單
  | 'seating'            // 帶位中 (詢問訂位與人數)
  | 'ordering'           // 點餐中 (多步驟學生輸入)
  | 'crisis_triggered'   // 店員送錯餐/給錯帳單 (老師/系統觸發)
  | 'resolving'          // 客訴處理中 (學生輸入)
  | 'calling_waiter'     // 呼叫服務生結帳 (學生輸入 Excuse me)
  | 'checkout'           // 結帳中 (多步驟學生輸入)
  | 'success'            // 通關
  | 'failed';            // 失敗 (可選)

export interface RestaurantScenario {
  id: string;
  restaurant: string;
  condition_en: string;
  crisis_en: string;
  menu_asset_url: string;
  order_q: string[];
  order_a: string[];
  order_h: string[];
  crisis_q: string;
  crisis_a: string;
  crisis_h: string;
  checkout_q: string[];
  checkout_a: string[];
  checkout_h: string[];
}

// // 
// 全站層面：
// 1. 全站總遊玩人次
// 2. 全站總完賽人次
// 3. 全站中途跳出人數
// 4. 全站平均完賽時間
// 5. 全站最常錯單字 (Top 5)
// 6. 全站最常錯的文法 (Top 5)


// 單字每個遊戲的：
// 1. 得分 (單個/平均)
// 2. 耗時 (單個/平均)
// 3. 完成次數  (單個/平均)
// 4. 測驗時間  (單個/平均)
// 5. 跳出次數  (單個/平均)
// 6. 常錯單字  (單個/平均)
// 7. 每題是否正確（正確與錯誤答案都要顯示）(外開/彈窗)

// 文法每個遊戲的：
// 1. 得分 (單個/平均)
// 2. 耗時 (單個/平均)
// 3. 完成次數  (單個/平均)
// 4. 測驗時間  (單個/平均)
// 5. 跳出次數  (單個/平均)
// 6. 常錯文法  (單個/平均)
// 7. 每題是否正確（正確與錯誤答案都要顯示）(外開/彈窗)

// 家教學生數據
// 1. 閱讀理解能力評分
// 2. 字彙辨識能力評分
// 3. 字彙應用（片與重組）能力評分
// 4. 造句能力評分
// 5. 字彙推理能力評分
// 6. 文法應用能力評分
// 7. 學生最常錯的五個單字（跨單元）
// 8. 學生最常錯的五個文法（跨單元）
// 9. 學生錯題練習（跨單元）
// 9. 學生錯題練習（該單元）
// 10. 學生名字