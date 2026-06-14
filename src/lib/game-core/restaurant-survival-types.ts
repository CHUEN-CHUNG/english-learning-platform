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
  crisis_q: string;
  crisis_a: string;
  checkout_q: string[];
  checkout_a: string[];
}
