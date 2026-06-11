export interface TextBlock {
  id: string;
  top: string;
  left: string;
  width: string;
  className?: string;
  content: string;
  rotation?: number;
  scale?: number;
}

export interface PosterConfig {
  id: string;
  name: string;
  bgImage: string;
  blocks: TextBlock[];
}

export interface GrammarUnit {
  id: string;
  name: string;
  posters: PosterConfig[];
}

export const grammarDatabase: GrammarUnit[] = [
  {
    id: 'present-simple',
    name: '現在簡單式 (Present Simple)',
    posters: [
      {
        id: 'affirmative',
        name: '1. 肯定句魔法',
        bgImage: '/images/grammar-posters/Present_Simple_Affirmative_Base.png',
        blocks: [
          { id: 'title', top: '4%', left: '15%', width: '70%', className: 'title-block transparent-bg', content: '<span style="color: #6b88e8;">✨ 現在簡單式：肯定句魔法 ✨</span>' },
          { id: 'block1', top: '20%', left: '30%', width: '25%', className: 'transparent-bg', content: '<h2>🧚‍♂️ 原形魔法</h2><p><strong>I / You / We / They</strong></p><p>動詞保持「原形」！</p><ul><li>I <span class="highlight" style="color:#e07a5f">get</span> up at 7:00.</li><li>They <span class="highlight" style="color:#e07a5f">eat</span> breakfast.</li></ul>' },
          { id: 'warning1', top: '20%', left: '65%', width: '30%', className: 'transparent-bg', content: '<p class="warning" style="font-size:24px;">⚠️ 魔法警告</p><p style="color:#d90429; font-size:22px; font-weight:bold;">絕對不要加 Be 動詞！<br>(❌ I am play)</p>' },
          { id: 'block2', top: '65%', left: '30%', width: '30%', className: 'transparent-bg', content: '<h2>🧙‍♂️ +S 變身魔法</h2><p><strong>He / She / It (第三人稱單數)</strong></p><p>動詞字尾直接加 -s！</p><ul><li>My brother <span class="highlight" style="color:#e07a5f">works</span>.</li><li>He <span class="highlight" style="color:#e07a5f">reads</span> books.</li></ul>' }
        ]
      },
      {
        id: 'spelling',
        name: '2. 第三人稱單數：進階變身咒語',
        bgImage: '/images/grammar-posters/Present_Simple_Spelling_Base.png',
        blocks: [
          { id: 'title', top: '4%', left: '15%', width: '70%', className: 'title-block transparent-bg', content: '<span style="color: #81b29a;">✨ 第三人稱單數：進階變身咒語 ✨</span>' },
          { id: 'block1', top: '35%', left: '10%', width: '22%', className: 'transparent-bg', content: '<h3 style="color:#e07a5f; text-align:center;">📜 摩擦音加 -es</h3><p style="text-align:center; font-size:18px;">字尾 ch, sh, ss, x, o</p><p style="text-align:center; font-weight:bold; font-size: 22px;">watch ➡️ watches<br>do ➡️ does</p>' },
          { id: 'block2', top: '35%', left: '42%', width: '22%', className: 'transparent-bg', content: '<h3 style="color:#e07a5f; text-align:center;">📜 去 y 加 -ies</h3><p style="text-align:center; font-size:18px;">字尾為「子音 + y」</p><p style="text-align:center; font-weight:bold; font-size: 22px;">cry ➡️ cries<br>study ➡️ studies</p>' },
          { id: 'block3', top: '35%', left: '72%', width: '22%', className: 'transparent-bg', content: '<h3 style="color:#e07a5f; text-align:center;">📜 不規則變化</h3><p style="text-align:center; font-size:18px;">專屬變形</p><p style="text-align:center; font-weight:bold; font-size:28px;">have ➡️ has</p>' }
        ]
      },
      {
        id: 'adverbs',
        name: '3. 頻率副詞的隱形位置',
        bgImage: '/images/grammar-posters/Adverbs_of_Frequency_Base.png',
        blocks: [
          { id: 'title', top: '4%', left: '15%', width: '70%', className: 'title-block transparent-bg', content: '<span style="color: #d4a373;">✨ 頻率副詞的隱形位置 ✨</span>' },
          { id: 'block1', top: '35%', left: '15%', width: '25%', className: 'transparent-bg', content: '<h2>💧 頻率魔法階梯</h2><ul style="color:#e07a5f; font-weight:bold; line-height:1.8; font-size:24px;"><li>100% always</li><li>80% usually</li><li>70% often</li><li>30% sometimes</li><li>0% never</li></ul>' },
          { id: 'block2', top: '35%', left: '60%', width: '28%', className: 'transparent-bg', content: '<h2>🧚‍♂️ 魔法口訣：放哪裡？</h2><p>放在一般動詞「前面」！</p><p style="color:#6b88e8; font-weight:bold;">I always eat breakfast.</p><hr style="border:1px dashed #ccc"><p class="warning" style="font-size:20px;">⚠️ 遇到 Be 動詞則放在「後面」</p><p class="warning">She is never late.</p>' }
        ]
      },
      {
        id: 'negative',
        name: '4. 否定與疑問的還原魔法',
        bgImage: '/images/grammar-posters/Present_Simple_Negative_Base.png',
        blocks: [
          { id: 'title', top: '4%', left: '15%', width: '70%', className: 'title-block transparent-bg', content: '<span style="color: #9c89b8;">✨ 否定與疑問的還原魔法 ✨</span>' },
          { id: 'block1', top: '35%', left: '10%', width: '35%', className: 'transparent-bg', content: '<h2>🛡️ 否定盾牌</h2><p style="color:#6b88e8; font-weight:bold;">I/You/We/They ➡️ don\'t</p><p>We don\'t play tennis.</p><p style="color:#e07a5f; font-weight:bold;">He/She/It ➡️ doesn\'t</p><p>He doesn\'t watch TV.</p><p class="warning" style="font-size:20px;">⚠️ 動詞必須還原！(❌ doesn\'t likes)</p>' },
          { id: 'block2', top: '35%', left: '55%', width: '35%', className: 'transparent-bg', content: '<h2>🪄 疑問句搬家魔法</h2><p>將 Do / Does 移到句首！</p><p style="color:#6b88e8; font-weight:bold;">Do you like coffee?</p><p style="color:#e07a5f; font-weight:bold;">Does she live here?</p><p>➡️ Yes, she does.</p>' }
        ]
      }
    ]
  },
  {
    id: 'future-simple',
    name: '未來簡單式 (Future Simple)',
    posters: [
      {
        id: 'will',
        name: '1. 未來式 will (預測與承諾)',
        bgImage: '/images/grammar-posters/Future_Simple_Will_Base.png',
        blocks: [
          { id: 'title', top: '4%', left: '15%', width: '70%', className: 'title-block transparent-bg', content: '<span style="color: #6b88e8;">✨ 未來式 will 魔法 ✨</span>' },
          { id: 'block1', top: '30%', left: '10%', width: '35%', className: 'transparent-bg', content: '<h2>🔮 預測與承諾</h2><p>使用 <strong>will + 原形動詞</strong></p><p style="color:#6b88e8; font-weight:bold;">I will help you.</p><p style="color:#e07a5f; font-weight:bold;">She\'ll be here soon.</p>' },
          { id: 'block2', top: '30%', left: '55%', width: '35%', className: 'transparent-bg', content: '<h2>🛡️ 否定與疑問</h2><p>否定：<strong>won\'t</strong> + 原形動詞</p><p style="color:#6b88e8; font-weight:bold;">It won\'t rain tomorrow.</p><p>疑問：將 <strong>Will</strong> 移至句首</p><p style="color:#e07a5f; font-weight:bold;">Will they win? ➡️ Yes, they will.</p>' },
          { id: 'warning', top: '80%', left: '15%', width: '70%', className: 'transparent-bg', content: '<p class="warning" style="font-size:20px;">⚠️ 魔法警告：</p><ul class="warning" style="font-size:18px;"><li>絕對不要加 to 或 V-ing！ (❌ I will to go / I will going)</li><li>肯定簡答不可縮寫！ (❌ Yes, I\'ll.)</li></ul>' }
        ]
      },
      {
        id: 'begoingto',
        name: '2. 未來式 be going to (既定計畫)',
        bgImage: '/images/grammar-posters/Future_Simple_BeGoingTo_Base.png',
        blocks: [
          { id: 'title', top: '4%', left: '15%', width: '70%', className: 'title-block transparent-bg', content: '<span style="color: #81b29a;">✨ 未來式 be going to 魔法 ✨</span>' },
          { id: 'block1', top: '30%', left: '10%', width: '35%', className: 'transparent-bg', content: '<h2>📅 既定計畫</h2><p><strong>am/is/are + going to + 原形動詞</strong></p><p style="color:#81b29a; font-weight:bold;">He is going to visit his grandparents.</p><p style="color:#e07a5f; font-weight:bold;">I am going to study.</p>' },
          { id: 'block2', top: '30%', left: '55%', width: '35%', className: 'transparent-bg', content: '<h2>🛡️ 否定與疑問</h2><p>否定：在 Be 動詞後加 <strong>not</strong></p><p style="color:#81b29a; font-weight:bold;">We aren\'t going to buy a car.</p><p>疑問：將 <strong>Be 動詞</strong> 移至句首</p><p style="color:#e07a5f; font-weight:bold;">Are you going to stay here?</p>' },
          { id: 'warning', top: '80%', left: '15%', width: '70%', className: 'transparent-bg', content: '<p class="warning" style="font-size:20px;">⚠️ 魔法警告：</p><ul class="warning" style="font-size:18px;"><li>不要漏掉 Be 動詞或 to！<br>(❌ I going to play)</li><li>絕對不能用 Do/Does/Don\'t/Doesn\'t！</li></ul>' }
        ]
      },
      {
        id: 'will_vs_begoingto',
        name: '3. will vs. be going to (語意區別)',
        bgImage: '/images/grammar-posters/Future_Simple_Vs_Base.png',
        blocks: [
          { id: 'title', top: '4%', left: '15%', width: '70%', className: 'title-block transparent-bg', content: '<span style="color: #d4a373;">✨ will vs. be going to ✨</span>' },
          { id: 'block1', top: '30%', left: '10%', width: '35%', className: 'transparent-bg', content: '<h2>💡 will (瞬間決定)</h2><p>說話當下<strong>瞬間的決定</strong>、承諾，或無證據的預測。</p><p style="color:#6b88e8; font-weight:bold;">"The phone is ringing!"<br>"I will answer it."</p>' },
          { id: 'block2', top: '30%', left: '55%', width: '35%', className: 'transparent-bg', content: '<h2>🗺️ be going to (既定計畫)</h2><p>說話前<strong>已做好的計畫</strong>，或有明顯證據的預測。</p><p style="color:#81b29a; font-weight:bold;">"I bought the tickets.<br>I am going to fly to Paris."</p>' }
        ]
      },
      {
        id: 'time_expressions',
        name: '4. 未來時間副詞',
        bgImage: '/images/grammar-posters/Future_Simple_Time_Base.png',
        blocks: [
          { id: 'title', top: '4%', left: '15%', width: '70%', className: 'title-block transparent-bg', content: '<span style="color: #9c89b8;">✨ 未來時間副詞 ✨</span>' },
          { id: 'block1', top: '35%', left: '10%', width: '70%', className: 'transparent-bg', content: '<h2>⏳ 未來專屬時間標記</h2><ul><li><strong>tomorrow</strong> (morning / afternoon)</li><li><strong>next</strong> (week / month / year)</li><li><strong>in + 一段時間</strong> (例如：in 5 minutes)</li></ul><p style="color:#9c89b8; font-weight:bold;">See you next week!</p><p style="color:#e07a5f; font-weight:bold;">The train will leave in 10 minutes.</p>' },
          { id: 'warning', top: '80%', left: '15%', width: '70%', className: 'transparent-bg', content: '<p class="warning" style="font-size:20px;">⚠️ 魔法警告：</p><p class="warning" style="font-size:18px;">畫蛇添足加上錯誤的介系詞是錯的！<br>(❌ in next week / ❌ on tomorrow)</p>' }
        ]
      }
    ]
  }
];
