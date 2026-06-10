import { GrammarDataTracker } from "@shared/game-core/GrammarDataTracker";
import { bindTeacherDashboard } from "@shared/game-core/GrammarDashboard";
import { initScoreboard } from "@shared/game-core/GrammarScoreboard";
import { ProgressTracker } from "@shared/utils/ProgressTracker";
import { playEnterGameSfx } from "../../shared/enter-game-sfx.js";
import { speakEnglish } from "@shared/utils/english-tts.js";

const tracker = new GrammarDataTracker("Dialogue Roleplay");

// 模擬從 CSV 解析後的資料 (PoC 階段先寫死兩筆)
const mockCases = [
  {
    Case_ID: "c_001",
    Mode: "Detective",
    Intro_Story: "A priceless painting was stolen from the city museum! We found a suspect, but his alibi is suspicious. Detective, interrogate him and find out the truth!",
    Image_URL: "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='150' height='150' viewBox='0 0 24 24' fill='%23666'><path d='M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z'/></svg>",
    Pronoun: "He",
    BGM_URL: "./assets/c001_phase1_suspense.mp3",
    Phase2_BGM_URL: "./assets/c001_phase2_suspense.mp3",
    tenses: [
      {
        id: 1, name: "Past",
        verb_target: "Did he leave?",
        time_target: "Did he leave the museum last night?",
        statement: "He left the museum last night.",
        object_clue: "the museum",
        time_choices: ["last night", "always", "right now"],
        verb_choices: [
          { verb: "leave", question: "Did he leave?", isCorrect: true, npcReply: "Yes, he left." },
          { verb: "repair", question: "Did he repair?", isCorrect: false, npcReply: "No, he didn't repair." },
          { verb: "taste", question: "Did he taste?", isCorrect: false, npcReply: "No, he didn't taste." }
        ]
      },
      {
        id: 2, name: "Present",
        verb_target: "Does he keep?",
        time_target: "Does he always keep a diary?",
        statement: "He always keeps a diary.",
        object_clue: "a diary",
        time_choices: ["always", "yesterday", "next week"],
        verb_choices: [
          { verb: "keep", question: "Does he keep?", isCorrect: true, npcReply: "Yes, he keeps it." },
          { verb: "fetch", question: "Does he fetch?", isCorrect: false, npcReply: "No, he doesn't fetch." },
          { verb: "guess", question: "Does he guess?", isCorrect: false, npcReply: "No, he doesn't guess." }
        ]
      },
      {
        id: 3, name: "Continuous",
        verb_target: "Is he whispering?",
        time_target: "Is he whispering a secret right now?",
        statement: "He is whispering a secret right now.",
        object_clue: "a secret",
        time_choices: ["right now", "every day", "last night"],
        verb_choices: [
          { verb: "whispering", question: "Is he whispering?", isCorrect: true, npcReply: "Yes, he is whispering." },
          { verb: "tasting", question: "Is he tasting?", isCorrect: false, npcReply: "No, he isn't tasting." },
          { verb: "exploring", question: "Is he exploring?", isCorrect: false, npcReply: "No, he isn't exploring." }
        ]
      },
      {
        id: 4, name: "Future",
        is_dual_form: true,
        verb_target: "Will he fetch?",
        time_target: "Will he fetch the suitcase next night?",
        statement: "He will fetch the suitcase next night.",
        statement_2: "He is going to fetch the suitcase next night.",
        object_clue: "the suitcase",
        time_choices: ["next night", "yesterday", "now"],
        verb_choices: [
          { verb: "fetch", questions: ["Will he fetch?", "Is he going to fetch?"], question: "Will he fetch?", isCorrect: true, npcReply: "Yes, he will / is going to fetch." },
          { verb: "repair", questions: ["Will he repair?", "Is he going to repair?"], question: "Will he repair?", isCorrect: false, npcReply: "No, he won't / isn't going to repair." },
          { verb: "leave", questions: ["Will he leave?", "Is he going to leave?"], question: "Will he leave?", isCorrect: false, npcReply: "No, he won't / isn't going to leave." }
        ],
        correct_time_questions: ["Will he fetch the suitcase next night?", "Is he going to fetch the suitcase next night?"]
      }
    ]
  },
  {
    Case_ID: "c_002",
    Mode: "Detective",
    Intro_Story: "The central bank was robbed! We tracked down a group of suspicious mechanics. They claim they were just fixing an engine. We need you to question them before they escape!",
    Image_URL: "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='150' height='150' viewBox='0 0 24 24' fill='%23333'><path d='M16 11c1.66 0 2.99-1.34 2.99-3S17.66 5 16 5c-1.66 0-3 1.34-3 3s1.34 3 3 3zm-8 0c1.66 0 2.99-1.34 2.99-3S9.66 5 8 5C6.34 5 5 6.34 5 8s1.34 3 3 3zm0 2c-2.33 0-7 1.17-7 3.5V19h14v-2.5c0-2.33-4.67-3.5-7-3.5zm8 0c-.29 0-.62.02-.97.05 1.16.84 1.97 1.97 1.97 3.45V19h6v-2.5c0-2.33-4.67-3.5-7-3.5z'/></svg>",
    Pronoun: "They",
    BGM_URL: "./assets/c002_phase1_upbeat.mp3",
    Phase2_BGM_URL: "./assets/c002_phase2_upbeat.mp3",
    tenses: [
      {
        id: 1, name: "Past",
        verb_target: "Did they repair?",
        time_target: "Did they repair the engine yesterday morning?",
        statement: "They repaired the engine yesterday morning.",
        object_clue: "the engine",
        time_choices: ["yesterday morning", "always", "now"],
        verb_choices: [
          { verb: "repair", question: "Did they repair?", isCorrect: true, npcReply: "Yes, they repaired it." },
          { verb: "leave", question: "Did they leave?", isCorrect: false, npcReply: "No, they didn't leave." },
          { verb: "taste", question: "Did they taste?", isCorrect: false, npcReply: "No, they didn't taste." }
        ]
      },
      {
        id: 2, name: "Present",
        verb_target: "Do they explore?",
        time_target: "Do they often explore the building?",
        statement: "They often explore the building.",
        object_clue: "the building",
        time_choices: ["often", "yesterday", "next week"],
        verb_choices: [
          { verb: "explore", question: "Do they explore?", isCorrect: true, npcReply: "Yes, they explore it." },
          { verb: "keep", question: "Do they keep?", isCorrect: false, npcReply: "No, they don't keep." },
          { verb: "lift", question: "Do they lift?", isCorrect: false, npcReply: "No, they don't lift." }
        ]
      },
      {
        id: 3, name: "Continuous",
        verb_target: "Are they lifting?",
        time_target: "Are they lifting the bag now?",
        statement: "They are lifting the bag now.",
        object_clue: "the bag",
        time_choices: ["now", "yesterday", "tomorrow"],
        verb_choices: [
          { verb: "lifting", question: "Are they lifting?", isCorrect: true, npcReply: "Yes, they are lifting." },
          { verb: "whispering", question: "Are they whispering?", isCorrect: false, npcReply: "No, they aren't whispering." },
          { verb: "preparing", question: "Are they preparing?", isCorrect: false, npcReply: "No, they aren't preparing." }
        ]
      },
      {
        id: 4, name: "Future",
        is_dual_form: true,
        verb_target: "Will they leave?",
        time_target: "Will they leave the country next week?",
        statement: "They will leave the country next week.",
        statement_2: "They are going to leave the country next week.",
        object_clue: "the country",
        time_choices: ["next week", "now", "yesterday"],
        verb_choices: [
          { verb: "leave", questions: ["Will they leave?", "Are they going to leave?"], question: "Will they leave?", isCorrect: true, npcReply: "Yes, they will / are going to leave." },
          { verb: "fetch", questions: ["Will they fetch?", "Are they going to fetch?"], question: "Will they fetch?", isCorrect: false, npcReply: "No, they won't / aren't going to fetch." },
          { verb: "invent", questions: ["Will they invent?", "Are they going to invent?"], question: "Will they invent?", isCorrect: false, npcReply: "No, they won't / aren't going to invent." }
        ],
        correct_time_questions: ["Will they leave the country next week?", "Are they going to leave the country next week?"]
      }
    ]
  },
  {
    Case_ID: "c_003",
    Mode: "Detective",
    Intro_Story: "Someone ate the delicious pudding from the fridge! My sister says she was just tasting some food, but I don't believe her. Detective, ask her some questions and find the pudding thief!",
    Image_URL: "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='150' height='150' viewBox='0 0 24 24' fill='%23e91e63'><path d='M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z'/></svg>",
    Pronoun: "She",
    BGM_URL: "./assets/c001_phase1_suspense.mp3",
    Phase2_BGM_URL: "./assets/c001_phase2_suspense.mp3",
    tenses: [
      {
        id: 1, name: "Past",
        verb_target: "Did she taste?",
        time_target: "Did she taste the food five minutes ago?",
        statement: "She tasted the food five minutes ago.",
        object_clue: "the food",
        time_choices: ["five minutes ago", "always", "right now"],
        verb_choices: [
          { verb: "taste", question: "Did she taste?", isCorrect: true, npcReply: "Yes, she tasted it." },
          { verb: "leave", question: "Did she leave?", isCorrect: false, npcReply: "No, she didn't leave." },
          { verb: "repair", question: "Did she repair?", isCorrect: false, npcReply: "No, she didn't repair." }
        ]
      },
      {
        id: 2, name: "Present",
        verb_target: "Does she prepare?",
        time_target: "Does she usually prepare the meal?",
        statement: "She usually prepares the meal.",
        object_clue: "the meal",
        time_choices: ["usually", "yesterday", "next week"],
        verb_choices: [
          { verb: "prepare", question: "Does she prepare?", isCorrect: true, npcReply: "Yes, she prepares it." },
          { verb: "keep", question: "Does she keep?", isCorrect: false, npcReply: "No, she doesn't keep." },
          { verb: "fetch", question: "Does she fetch?", isCorrect: false, npcReply: "No, she doesn't fetch." }
        ]
      },
      {
        id: 3, name: "Continuous",
        verb_target: "Is she looking after?",
        time_target: "Is she looking after the baby right now?",
        statement: "She is looking after the baby right now.",
        object_clue: "the baby",
        time_choices: ["right now", "every day", "last night"],
        verb_choices: [
          { verb: "looking after", question: "Is she looking after?", isCorrect: true, npcReply: "Yes, she is looking after." },
          { verb: "whispering", question: "Is she whispering?", isCorrect: false, npcReply: "No, she isn't whispering." },
          { verb: "exploring", question: "Is she exploring?", isCorrect: false, npcReply: "No, she isn't exploring." }
        ]
      },
      {
        id: 4, name: "Future",
        is_dual_form: true,
        verb_target: "Will she guess?",
        time_target: "Will she guess the answer in 1 month?",
        statement: "She will guess the answer in 1 month.",
        statement_2: "She is going to guess the answer in 1 month.",
        object_clue: "the answer",
        time_choices: ["in 1 month", "yesterday", "now"],
        verb_choices: [
          { verb: "guess", questions: ["Will she guess?", "Is she going to guess?"], question: "Will she guess?", isCorrect: true, npcReply: "Yes, she will / is going to guess." },
          { verb: "repair", questions: ["Will she repair?", "Is she going to repair?"], question: "Will she repair?", isCorrect: false, npcReply: "No, she won't / isn't going to repair." },
          { verb: "leave", questions: ["Will she leave?", "Is she going to leave?"], question: "Will she leave?", isCorrect: false, npcReply: "No, she won't / isn't going to leave." }
        ],
        correct_time_questions: ["Will she guess the answer in 1 month?", "Is she going to guess the answer in 1 month?"]
      }
    ]
  },
  {
    Case_ID: "c_004",
    Mode: "Detective",
    Intro_Story: "There have been strange footsteps in the attic every night. We think our neighbor is building a weird machine up there. Investigate his daily routine and future plans!",
    Image_URL: "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='150' height='150' viewBox='0 0 24 24' fill='%239c27b0'><path d='M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z'/></svg>",
    Pronoun: "He",
    BGM_URL: "./assets/c001_phase1_suspense.mp3",
    Phase2_BGM_URL: "./assets/c001_phase2_suspense.mp3",
    tenses: [
      {
        id: 1, name: "Past",
        verb_target: "Did he fetch?",
        time_target: "Did he fetch the tool two days ago?",
        statement: "He fetched the tool two days ago.",
        object_clue: "the tool",
        time_choices: ["two days ago", "always", "now"],
        verb_choices: [
          { verb: "fetch", question: "Did he fetch?", isCorrect: true, npcReply: "Yes, he fetched it." },
          { verb: "leave", question: "Did he leave?", isCorrect: false, npcReply: "No, he didn't leave." },
          { verb: "taste", question: "Did he taste?", isCorrect: false, npcReply: "No, he didn't taste." }
        ]
      },
      {
        id: 2, name: "Present",
        verb_target: "Does he whistle?",
        time_target: "Does he sometimes whistle a tune?",
        statement: "He sometimes whistles a tune.",
        object_clue: "a tune",
        time_choices: ["sometimes", "yesterday", "next week"],
        verb_choices: [
          { verb: "whistle", question: "Does he whistle?", isCorrect: true, npcReply: "Yes, he whistles it." },
          { verb: "keep", question: "Does he keep?", isCorrect: false, npcReply: "No, he doesn't keep." },
          { verb: "lift", question: "Does he lift?", isCorrect: false, npcReply: "No, he doesn't lift." }
        ]
      },
      {
        id: 3, name: "Continuous",
        verb_target: "Is he exploring?",
        time_target: "Is he exploring the path now?",
        statement: "He is exploring the path now.",
        object_clue: "the path",
        time_choices: ["now", "yesterday", "tomorrow"],
        verb_choices: [
          { verb: "exploring", question: "Is he exploring?", isCorrect: true, npcReply: "Yes, he is exploring." },
          { verb: "whispering", question: "Is he whispering?", isCorrect: false, npcReply: "No, he isn't whispering." },
          { verb: "preparing", question: "Is he preparing?", isCorrect: false, npcReply: "No, he isn't preparing." }
        ]
      },
      {
        id: 4, name: "Future",
        is_dual_form: true,
        verb_target: "Will he invent?",
        time_target: "Will he invent a machine in 4 years?",
        statement: "He will invent a machine in 4 years.",
        statement_2: "He is going to invent a machine in 4 years.",
        object_clue: "a machine",
        time_choices: ["in 4 years", "now", "yesterday"],
        verb_choices: [
          { verb: "invent", questions: ["Will he invent?", "Is he going to invent?"], question: "Will he invent?", isCorrect: true, npcReply: "Yes, he will / is going to invent." },
          { verb: "fetch", questions: ["Will he fetch?", "Is he going to fetch?"], question: "Will he fetch?", isCorrect: false, npcReply: "No, he won't / isn't going to fetch." },
          { verb: "leave", questions: ["Will he leave?", "Is he going to leave?"], question: "Will he leave?", isCorrect: false, npcReply: "No, he won't / isn't going to leave." }
        ],
        correct_time_questions: ["Will he invent a machine in 4 years?", "Is he going to invent a machine in 4 years?"]
      }
    ]
  },
  {
    Case_ID: "c_005",
    Mode: "Reporter",
    Intro_Story: "Welcome to the science lab! Today, we are tracking a single drop of water on its incredible journey. Reporter, ask our meteorologist about where the water came from and where it is going!",
    Image_URL: "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='150' height='150' viewBox='0 0 24 24' fill='%2300aaff'><path d='M12 2c-5.33 4.55-8 8.48-8 11.8 0 4.98 3.8 8.2 8 8.2s8-3.22 8-8.2c0-3.32-2.67-7.25-8-11.8zm0 18c-3.35 0-6-2.57-6-6.2 0-2.34 1.95-5.44 6-9.14 4.05 3.7 6 6.79 6 9.14 0 3.63-2.65 6.2-6 6.2z'/></svg>",
    Pronoun: "It",
    BGM_URL: "./assets/c005_phase1_science.mp3",
    Phase2_BGM_URL: "./assets/c005_phase2_science.mp3",
    tenses: [
      {
        id: 1, name: "Past",
        verb_target: "Did it leave?",
        time_target: "Did it leave the river yesterday?",
        statement: "It left the river yesterday.",
        object_clue: "the river",
        time_choices: ["yesterday", "always", "next month"],
        verb_choices: [
          { verb: "leave", question: "Did it leave?", isCorrect: true, npcReply: "Yes, it left." },
          { verb: "taste", question: "Did it taste?", isCorrect: false, npcReply: "No, it didn't taste." },
          { verb: "repair", question: "Did it repair?", isCorrect: false, npcReply: "No, it didn't repair." }
        ]
      },
      {
        id: 2, name: "Present",
        verb_target: "Does it improve?",
        time_target: "Does it always improve the environment?",
        statement: "It always improves the environment.",
        object_clue: "the environment",
        time_choices: ["always", "last night", "right now"],
        verb_choices: [
          { verb: "improve", question: "Does it improve?", isCorrect: true, npcReply: "Yes, it improves it." },
          { verb: "keep", question: "Does it keep?", isCorrect: false, npcReply: "No, it doesn't keep." },
          { verb: "whistle", question: "Does it whistle?", isCorrect: false, npcReply: "No, it doesn't whistle." }
        ]
      },
      {
        id: 3, name: "Continuous",
        verb_target: "Is it landing?",
        time_target: "Is it landing on the ground right now?",
        statement: "It is landing on the ground right now.",
        object_clue: "on the ground",
        time_choices: ["right now", "yesterday", "tomorrow"],
        verb_choices: [
          { verb: "landing", question: "Is it landing?", isCorrect: true, npcReply: "Yes, it is landing." },
          { verb: "whispering", question: "Is it whispering?", isCorrect: false, npcReply: "No, it isn't whispering." },
          { verb: "exploring", question: "Is it exploring?", isCorrect: false, npcReply: "No, it isn't exploring." }
        ]
      },
      {
        id: 4, name: "Future",
        is_dual_form: true,
        verb_target: "Will it explore?",
        time_target: "Will it explore the ocean next month?",
        statement: "It will explore the ocean next month.",
        statement_2: "It is going to explore the ocean next month.",
        object_clue: "the ocean",
        time_choices: ["next month", "now", "five minutes ago"],
        verb_choices: [
          { verb: "explore", questions: ["Will it explore?", "Is it going to explore?"], question: "Will it explore?", isCorrect: true, npcReply: "Yes, it will / is going to explore." },
          { verb: "fetch", questions: ["Will it fetch?", "Is it going to fetch?"], question: "Will it fetch?", isCorrect: false, npcReply: "No, it won't / isn't going to fetch." },
          { verb: "leave", questions: ["Will it leave?", "Is it going to leave?"], question: "Will it leave?", isCorrect: false, npcReply: "No, it won't / isn't going to leave." }
        ],
        correct_time_questions: ["Will it explore the ocean next month?", "Is it going to explore the ocean next month?"]
      }
    ]
  },
  {
    Case_ID: "c_006",
    Mode: "Reporter",
    Intro_Story: "Every year, millions of monarch butterflies travel across the continent. It's a beautiful mystery! Reporter, interview our ecologist to learn about their past journey and their future destination!",
    Image_URL: "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='150' height='150' viewBox='0 0 24 24' fill='%23ff9800'><path d='M12 2c-5.33 4.55-8 8.48-8 11.8 0 4.98 3.8 8.2 8 8.2s8-3.22 8-8.2c0-3.32-2.67-7.25-8-11.8zm0 18c-3.35 0-6-2.57-6-6.2 0-2.34 1.95-5.44 6-9.14 4.05 3.7 6 6.79 6 9.14 0 3.63-2.65 6.2-6 6.2z'/></svg>",
    Pronoun: "They",
    BGM_URL: "./assets/c005_phase1_science.mp3",
    Phase2_BGM_URL: "./assets/c005_phase2_science.mp3",
    tenses: [
      {
        id: 1, name: "Past",
        verb_target: "Did they leave?",
        time_target: "Did they leave the forest last spring?",
        statement: "They left the forest last spring.",
        object_clue: "the forest",
        time_choices: ["last spring", "always", "next month"],
        verb_choices: [
          { verb: "leave", question: "Did they leave?", isCorrect: true, npcReply: "Yes, they left." },
          { verb: "taste", question: "Did they taste?", isCorrect: false, npcReply: "No, they didn't taste." },
          { verb: "repair", question: "Did they repair?", isCorrect: false, npcReply: "No, they didn't repair." }
        ]
      },
      {
        id: 2, name: "Present",
        verb_target: "Do they look after?",
        time_target: "Do they usually look after the eggs?",
        statement: "They usually look after the eggs.",
        object_clue: "the eggs",
        time_choices: ["usually", "last night", "right now"],
        verb_choices: [
          { verb: "look after", question: "Do they look after?", isCorrect: true, npcReply: "Yes, they look after them." },
          { verb: "keep", question: "Do they keep?", isCorrect: false, npcReply: "No, they don't keep." },
          { verb: "whistle", question: "Do they whistle?", isCorrect: false, npcReply: "No, they don't whistle." }
        ]
      },
      {
        id: 3, name: "Continuous",
        verb_target: "Are they tasting?",
        time_target: "Are they tasting the flower right now?",
        statement: "They are tasting the flower right now.",
        object_clue: "the flower",
        time_choices: ["right now", "yesterday", "tomorrow"],
        verb_choices: [
          { verb: "tasting", question: "Are they tasting?", isCorrect: true, npcReply: "Yes, they are tasting." },
          { verb: "whispering", question: "Are they whispering?", isCorrect: false, npcReply: "No, they aren't whispering." },
          { verb: "exploring", question: "Are they exploring?", isCorrect: false, npcReply: "No, they aren't exploring." }
        ]
      },
      {
        id: 4, name: "Future",
        is_dual_form: true,
        verb_target: "Will they land?",
        time_target: "Will they land on the tree next morning?",
        statement: "They will land on the tree next morning.",
        statement_2: "They are going to land on the tree next morning.",
        object_clue: "on the tree",
        time_choices: ["next morning", "now", "five minutes ago"],
        verb_choices: [
          { verb: "land", questions: ["Will they land?", "Are they going to land?"], question: "Will they land?", isCorrect: true, npcReply: "Yes, they will / are going to land." },
          { verb: "fetch", questions: ["Will they fetch?", "Are they going to fetch?"], question: "Will they fetch?", isCorrect: false, npcReply: "No, they won't / aren't going to fetch." },
          { verb: "leave", questions: ["Will they leave?", "Are they going to leave?"], question: "Will they leave?", isCorrect: false, npcReply: "No, they won't / aren't going to leave." }
        ],
        correct_time_questions: ["Will they land on the tree next morning?", "Are they going to land on the tree next morning?"]
      }
    ]
  }
];

class DialogueRoleplayGame {
  constructor() {
    this.cases = mockCases;
    this.currentCase = null;
    this.currentTenseIndex = 0; // 0 to 3 (對應 tenses 陣列)
    this.currentStep = 'verb';  // 'verb' or 'time'
    this.isTransitioning = false;
    this.score = 0;
    this.screenHistory = [];
    
    // 初始化 DOM 元素
    this.menuScreen = document.getElementById('menu-screen');
    this.introScreen = document.getElementById('intro-screen');
    this.phase1Screen = document.getElementById('phase1-screen');
    this.transitionScreen = document.getElementById('transition-screen');
    this.transitionText = document.getElementById('transition-text');
    this.btnProceedPhase2 = document.getElementById('btn-proceed-phase2');
    this.phase2Screen = document.getElementById('phase2-screen');
    this.successModal = document.getElementById('success-modal');
    this.modalStampContainer = document.getElementById('modal-stamp-container');
    this.caseList = document.getElementById('case-list');
    
    this.introText = document.getElementById('intro-text');
    this.btnStartInvestigation = document.getElementById('btn-start-investigation');
    
    this.taskPrompt = document.getElementById('task-prompt');
    this.subStepHint = document.getElementById('sub-step-hint');
    this.verbHintsArea = document.getElementById('verb-hints');
    this.userInput = document.getElementById('user-input');
    this.npcDialogue = document.querySelector('#npc-dialogue p');
    
    // 按鈕綁定
    document.getElementById('btn-go-back').addEventListener('click', () => this.goBack());
    document.getElementById('btn-menu').addEventListener('click', () => this.goMenu());
    document.getElementById('btn-exit').addEventListener('click', () => { window.location.href = "../../grammar-hub/index.html"; });
    document.getElementById('btn-check').addEventListener('click', () => this.checkAnswer());
    document.getElementById('btn-tts').addEventListener('click', () => this.playTTS());
    this.btnStartInvestigation.addEventListener('click', () => this.enterPhase1());
    this.btnProceedPhase2.addEventListener('click', () => {
      this.enterPhase2();
    });
    
    document.getElementById('btn-submit-report').addEventListener('click', () => this.checkReport());
    document.getElementById('btn-finish').addEventListener('click', () => this.exitGame());
    
    // Modal buttons
    document.getElementById('btn-play-again').addEventListener('click', () => {
      this.successModal.style.display = 'none';
      this.startIntro(this.currentCase);
    });
    document.getElementById('btn-modal-menu').addEventListener('click', () => {
      this.successModal.style.display = 'none';
      this.goMenu();
    });
    
    // 支援 Enter 鍵送出
    this.userInput.addEventListener('keypress', (e) => {
      if (e.key === 'Enter') {
        this.checkAnswer();
      }
    });

    // 準備 BGM 變數，將在進入案件時初始化
    this.bgm = null;
  }

  init() {
    // Teacher dashboard binding
    bindTeacherDashboard([document.querySelector(".header-left h2")].filter(Boolean));

    initScoreboard({
      onRestart: () => this.startIntro(this.currentCase),
      onHome: () => {
        window.location.href = "../../grammar-hub/index.html";
      },
      gameContainerId: "game-board"
    });

    const currentUser = ProgressTracker.getCurrentUser();
    if (!currentUser) {
      alert("Please log in from the Grammar Hub first!");
      window.location.href = "../../grammar-hub/index.html";
      return;
    }
    this.userName = currentUser;
    tracker.setUserName(this.userName);

    // 支援直接透過網址參數進入特定的測試階段
    const urlParams = new URLSearchParams(window.location.search);
    const debugPhase = urlParams.get('debug');
    const debugCase = urlParams.get('case');

    if (debugPhase === 'phase2' && debugCase) {
      this.currentCase = this.cases.find(c => c.Case_ID === debugCase);
      if (this.currentCase) {
        this.screenHistory = [];
        this.navigateTo(this.phase2Screen);
        this.enterPhase2();
        return;
      }
    }

    // 預設顯示案件選單
    this.renderMenu();
  }

  promptNameForCase(caseData) {
    this.pendingCase = caseData;
    tracker.setUnitName("Dialogue Roleplay - Case " + this.pendingCase.Case_ID);
    this.startIntro(this.pendingCase);
  }

  navigateTo(screenEl, isBack = false) {
    this.menuScreen.style.display = 'none';
    this.introScreen.style.display = 'none';
    this.phase1Screen.style.display = 'none';
    this.transitionScreen.style.display = 'none';
    this.phase2Screen.style.display = 'none';
    
    screenEl.style.display = 'block';
    if (screenEl === this.introScreen || screenEl === this.transitionScreen) {
        screenEl.style.display = 'flex';
    }

    if (!isBack) {
       this.screenHistory.push(screenEl);
    }
    
    const btnGoBack = document.getElementById('btn-go-back');
    const btnMenu = document.getElementById('btn-menu');
    
    if (this.screenHistory.length > 1 && screenEl !== this.menuScreen) {
       btnGoBack.style.display = 'inline-block';
       btnMenu.style.display = 'inline-block';
    } else {
       btnGoBack.style.display = 'none';
       btnMenu.style.display = 'none';
    }
  }

  goBack() {
    if (this.screenHistory.length > 1) {
       this.screenHistory.pop(); 
       const prevScreen = this.screenHistory[this.screenHistory.length - 1];
       this.navigateTo(prevScreen, true);
    }
  }

  goMenu() {
    this.screenHistory = [];
    if (this.bgm) {
       this.bgm.pause();
       this.bgm.currentTime = 0;
    }
    this.renderMenu();
  }

  // 1. 遊戲入口：渲染選單
  renderMenu() {
    this.screenHistory = [];
    this.navigateTo(this.menuScreen);
    this.caseList.innerHTML = '';

    this.cases.forEach(caseData => {
      const btn = document.createElement('button');
      btn.className = 'px-8 py-3 bg-green-600 text-white font-bold rounded-xl hover:bg-green-700 transition shadow-md';
      btn.style.margin = '10px';
      btn.innerText = `[${caseData.Mode}] Case ${caseData.Case_ID}`;
      btn.addEventListener('click', () => this.promptNameForCase(caseData));
      this.caseList.appendChild(btn);
    });
  }

  // 2. 進入動畫介紹 (Intro Story)
  startIntro(caseData) {
    tracker.startGame();
    this.currentCase = caseData;
    this.currentTenseIndex = 0;
    this.currentStep = 'verb';
    this.isTransitioning = false;
    this.answered_verb_forms = [];
    this.answered_time_forms = [];
    
    // 如果有舊的音樂正在播，先暫停
    if (this.bgm) {
      this.bgm.pause();
    }

    // 照前一次會發出聲音的方式：直接 new Audio 傳入網址
    const bgmUrl = caseData.BGM_URL || './assets/bgm_detective.mp3';
    this.bgm = new Audio(bgmUrl);
    this.bgm.loop = true;
    this.bgm.volume = 0.2; // 降低音量避免蓋過 TTS
    this.bgm.play().catch(e => console.log('BGM Play prevented:', e));
    
    this.navigateTo(this.introScreen);
    this.introText.innerText = '';
    this.btnStartInvestigation.style.display = 'none';
    document.getElementById('suspect-profile').style.display = 'none';
    
    // 打字機特效 (Typewriter effect)
    const text = caseData.Intro_Story;
    let i = 0;
    const speed = 30; // 每個字母 30ms
    
    // 初始化第一句對話
    this.npcDialogue.innerText = "I am ready for your questions. (Waiting...)";
    
    const typeWriter = () => {
      if (i < text.length) {
        this.introText.innerHTML += text.charAt(i);
        i++;
        setTimeout(typeWriter, speed);
      } else {
        // 動畫結束後，顯示剪影、人稱提示，以及開始按鈕
        document.getElementById('intro-silhouette').src = caseData.Image_URL;
        document.querySelector('#intro-pronoun span').innerText = caseData.Pronoun;
        document.getElementById('suspect-profile').style.display = 'block';
        this.btnStartInvestigation.style.display = 'inline-block';
      }
    };
    
    typeWriter();
  }

  // 3. 進入 Phase 1 調查
  enterPhase1() {
    playEnterGameSfx();
    this.navigateTo(this.phase1Screen);
    
    // 載入 NPC 圖片
    document.getElementById('npc-image').src = this.currentCase.Image_URL;
    
    this.renderPhase1Step();
  }

  renderPhase1Step() {
    const currentTense = this.currentCase.tenses[this.currentTenseIndex];
    
    if (this.currentStep === 'verb') {
      this.currentQuestionMistakes = 0;
      tracker.startQuestion(currentTense.name, currentTense.statement, currentTense.is_dual_form);
    }
    
    // 更新上方鎖頭 UI
    for (let i = 1; i <= 4; i++) {
      const node = document.getElementById(`tense-${i}`);
      node.className = 'tense-node' + (i === this.currentTenseIndex + 1 ? ' active' : '');
      const tenseName = this.currentCase.tenses[i-1].name;
      const isLocked = i > this.currentTenseIndex ? '🔒' : '✅';
      node.innerText = `${i}. ${tenseName} ${isLocked}`;
    }

    this.taskPrompt.innerText = `Task: Investigate clues for the ${currentTense.name} tense`;
    this.userInput.value = ''; // 清空輸入框
    this.userInput.focus();
    
    // 渲染提示區 (動詞 或 時間)
    this.verbHintsArea.innerHTML = '';
    let choices = [];
    if (this.currentStep === 'verb') {
      choices = currentTense.verb_choices.map(c => c.verb);
    } else {
      choices = [...currentTense.time_choices];
    }
    
    // 打亂順序 (Fisher-Yates)
    for (let i = choices.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [choices[i], choices[j]] = [choices[j], choices[i]];
    }

    choices.forEach(text => {
      const hint = document.createElement('div');
      hint.className = 'hint-card';
      hint.innerText = text;
      this.verbHintsArea.appendChild(hint);
    });

    const clueContainer = document.getElementById('clue-container');
    const clueText = document.getElementById('clue-text');

    if (this.currentStep === 'verb') {
      clueContainer.style.display = 'none';
      clueContainer.classList.remove('stamp-animation');
      this.subStepHint.innerText = `[Step 1] Ask about the 'Action'. Use the verbs above to type a complete question.`;
      // 只有在還沒有對話或是對話為預設時才覆寫
      if (!this.npcDialogue.innerText.startsWith("No,") && !this.npcDialogue.innerText.startsWith("Yes,")) {
        const text = "I am ready for your questions.";
        this.npcDialogue.innerText = text + " (Waiting...)";
        this.playTTS(text); // 自動用語音唸出來
      }
    } else if (this.currentStep === 'time') {
      this.subStepHint.innerText = `[Step 2] Ask about the 'Time/Frequency'. Use the hints and clues above to type a complete question.`;
      
      // 顯示受詞獎勵動畫
      clueContainer.style.display = 'inline-block';
      clueText.innerText = currentTense.object_clue;
      
      // 重置動畫狀態以確保再次觸發
      clueContainer.classList.remove('stamp-animation');
      void clueContainer.offsetWidth; // Trigger DOM reflow
      clueContainer.classList.add('stamp-animation');
    }
  }

  // 字串正規化比對 (去除多餘空白，保留大小寫與標點符號，以進行嚴格比對)
  normalizeString(str) {
    return str.replace(/\s+/g, " ").trim();
  }

  // 4. 檢查答案
  checkAnswer() {
    if (this.isTransitioning) return; // 防止在動畫延遲期間重複送出

    const currentTense = this.currentCase.tenses[this.currentTenseIndex];
    const userText = this.normalizeString(this.userInput.value);
    
    if (this.currentStep === 'verb') {
      // 檢查是否符合 3 個動詞其中之一的問法
      let matchedChoice = null;
      let matchedQuestion = null;
      
      if (currentTense.is_dual_form) {
        currentTense.verb_choices.forEach(c => {
          c.questions.forEach(q => {
            if (this.normalizeString(q) === userText) {
              matchedChoice = c;
              matchedQuestion = this.normalizeString(q);
            }
          });
        });
      } else {
        matchedChoice = currentTense.verb_choices.find(c => this.normalizeString(c.question) === userText);
      }
      
      if (matchedChoice) {
        if (matchedChoice.isCorrect) {
          if (currentTense.is_dual_form) {
             if (!this.answered_verb_forms.includes(matchedQuestion)) {
                this.answered_verb_forms.push(matchedQuestion);
             }
             if (this.answered_verb_forms.length < 2) {
                const reply = "Good! Now ask me the same question using another future form ('will' or 'be going to').";
                this.npcDialogue.innerText = reply;
                this.playTTS(reply);
                this.userInput.value = '';
                return; // Wait for the second form
             }
             // Both forms collected, reset for next step
             this.answered_verb_forms = [];
          }

          // 猜對動詞：播放 NPC 肯定對話並給出受詞，進入 Step 2
          this.npcDialogue.innerText = matchedChoice.npcReply; 
          this.playTTS(matchedChoice.npcReply);
          
          this.score += 10;
          document.getElementById('score').innerText = this.score;
          this.currentStep = 'time';
          this.userInput.value = ''; // 清空輸入框
          this.renderPhase1Step();
        } else {
          // 猜錯動詞：NPC 回答否，不切換階段
          this.currentQuestionMistakes++;
          tracker.updateCurrentQuestionStat({ wrongSubmits: this.currentQuestionMistakes });
          this.npcDialogue.innerText = matchedChoice.npcReply;
          this.playTTS(matchedChoice.npcReply);
          this.userInput.value = ''; // 清空輸入框讓玩家重打
          
          // 刪除畫面上的錯誤動詞卡片
          const cards = this.verbHintsArea.querySelectorAll('.hint-card');
          cards.forEach(card => {
            if (card.innerText === matchedChoice.verb) {
              card.remove();
            }
          });
        }
      } else {
        // 未比對到任何合法格式
        this.currentQuestionMistakes++;
        tracker.updateCurrentQuestionStat({ wrongSubmits: this.currentQuestionMistakes });
        this.npcDialogue.innerText = "I don't understand your question. Try again.";
        this.playTTS("I don't understand your question. Try again.");
      }
    } else {
      // Phase 2 (Time)
      let isCorrectTime = false;
      let matchedTimeQuestion = userText;

      if (currentTense.is_dual_form) {
        if (currentTense.correct_time_questions.map(q => this.normalizeString(q)).includes(userText)) {
          isCorrectTime = true;
        }
      } else {
        if (userText === this.normalizeString(currentTense.time_target)) {
          isCorrectTime = true;
        }
      }

      if (isCorrectTime) {
        if (currentTense.is_dual_form) {
           if (!this.answered_time_forms.includes(matchedTimeQuestion)) {
              this.answered_time_forms.push(matchedTimeQuestion);
           }
           if (this.answered_time_forms.length < 2) {
              const reply = "Yes! Now ask the same question using the other future form.";
              this.npcDialogue.innerText = reply;
              this.playTTS(reply);
              this.userInput.value = '';
              return; // Wait for the second form
           }
           this.answered_time_forms = [];
        }

        this.isTransitioning = true;
        this.userInput.value = ''; // 清空輸入框避免重複送出

        const npcResponse = "Yes, exactly at that time.";
        this.npcDialogue.innerText = npcResponse;
        this.playTTS(npcResponse);
        
        this.score += 10;
        document.getElementById('score').innerText = this.score;
        tracker.endQuestion(true);
        
        setTimeout(() => {
          this.isTransitioning = false;
          this.currentTenseIndex++;
          if (this.currentTenseIndex >= this.currentCase.tenses.length) {
            this.showTransition();
          } else {
            this.currentStep = 'verb';
            this.npcDialogue.innerText = "I am ready for your questions. (Waiting...)";
            this.renderPhase1Step();
          }
        }, 1500); // 稍微延遲讓玩家看到成功的對話
      } else {
        const objectClue = this.normalizeString(currentTense.object_clue);
        const correctTimeHint = this.normalizeString(currentTense.time_choices[0]);
        
        // 如果玩家輸入的句子中沒有包含剛剛獲得的受詞線索
        this.currentQuestionMistakes++;
        tracker.updateCurrentQuestionStat({ wrongSubmits: this.currentQuestionMistakes });
        
        if (!userText.includes(objectClue)) {
          const npcResponse = `Wait, you forgot to mention the clue: ${currentTense.object_clue}!`;
          this.npcDialogue.innerText = npcResponse;
          this.playTTS("Wait, you forgot to mention the clue.");
        } else if (userText.includes(correctTimeHint)) {
          // 包含了正確的時間與受詞，但是整句結構不對（可能是句型錯、動詞沒還原）
          const npcResponse = "The time is right, but your sentence structure is wrong. Check your grammar!";
          this.npcDialogue.innerText = npcResponse;
          this.playTTS("The time is right, but your sentence structure is wrong.");
        } else {
          this.npcDialogue.innerText = "No, that's not the right time.";
          this.playTTS("No, that's not the right time.");
          this.userInput.value = '';
          
          // 刪除畫面上的錯誤時間卡片
          const cards = this.verbHintsArea.querySelectorAll('.hint-card');
          cards.forEach(card => {
            const cardText = this.normalizeString(card.innerText);
            // 只要玩家輸入有包含這張卡片的文字，且它"不是"正確答案，才刪除它
            if (userText.includes(cardText) && cardText !== correctTimeHint) {
              card.remove();
            }
          });
        }
      }
    }
  }

  // 5. TTS 語音引擎
  playTTS(text = this.npcDialogue.innerText) {
    if (!('speechSynthesis' in window)) {
      alert("Your browser does not support text-to-speech.");
      return;
    }
    speakEnglish(text, { rate: 0.95 });
  }

  showTransition() {
    this.navigateTo(this.transitionScreen);
    this.transitionText.innerText = '';
    this.btnProceedPhase2.style.display = 'none';

    // 1. 轉場時停止原本的懸疑音樂，換成 Phase 2 音樂
    if (this.bgm) {
      this.bgm.pause();
    }
    const phase2BgmUrl = this.currentCase.Phase2_BGM_URL || "./assets/all_phase2_victory.mp3";
    this.bgm = new Audio(phase2BgmUrl);
    this.bgm.loop = true;
    this.bgm.volume = 0.2;
    this.bgm.play().catch(e => console.log('Transition BGM Play prevented:', e));
    
    // For Reporter mode, adjust text?
    const text = this.currentCase.Mode === 'Detective' 
        ? "All clues have been collected! Please summarize the clues into a complete report and give it to the police to arrest the suspect."
        : "All clues have been collected! Please summarize the clues into a complete scientific report to publish your news.";
        
    let i = 0;
    const speed = 30;
    
    const typeWriter = () => {
      if (i < text.length) {
        this.transitionText.innerHTML += text.charAt(i);
        i++;
        setTimeout(typeWriter, speed);
      } else {
        this.btnProceedPhase2.style.display = 'inline-block';
      }
    };
    typeWriter();
  }

  // ==========================================
  // Phase 2: 統整與回報階段
  // ==========================================
  
  enterPhase2() {
    // If not navigated by debug params, navigate to phase2Screen
    if (this.screenHistory.length === 0 || this.screenHistory[this.screenHistory.length - 1] !== this.phase2Screen) {
       this.navigateTo(this.phase2Screen);
    }
    
    // 如果是直接 debug 進入 Phase 2，需要初始化音樂
    if (!this.bgm || this.bgm.paused) {
      if (this.bgm) this.bgm.pause();
      const phase2BgmUrl = this.currentCase.Phase2_BGM_URL || "./assets/all_phase2_victory.mp3";
      this.bgm = new Audio(phase2BgmUrl);
      this.bgm.loop = true;
      this.bgm.volume = 0.2;
      this.bgm.play().catch(e => console.log('Phase 2 BGM Play prevented:', e));
    }

    const reportContent = document.getElementById('report-content');
    reportContent.innerHTML = '';
    
    this.reportInputs = []; // 儲存所有的 input DOM 元素與對應解答

    this.currentCase.tenses.forEach((tense, index) => {
      const row = document.createElement('div');
      row.className = 'report-row';
      
      const label = document.createElement('div');
      label.className = 'tense-label';
      label.innerText = `[ Clue ${index + 1}: ${tense.name} ]`;
      
      // 找出正確的動詞線索
      const correctVerb = tense.verb_choices.find(c => c.isCorrect).verb;
      
      const correctTime = tense.time_choices[0]; // 根據目前的題庫設計，第一個時間選項即為正確解答
      const objectClue = tense.object_clue;
      
      const hint = document.createElement('div');
      hint.className = 'report-hint';
      hint.innerHTML = `<span>Subject: <b>${this.currentCase.Pronoun}</b></span> &nbsp;|&nbsp; <span>Verb: <b>${correctVerb}</b></span> &nbsp;|&nbsp; <span>Object: <b>${objectClue}</b></span> &nbsp;|&nbsp; <span>Time: <b>${correctTime}</b></span>`;
      
      row.appendChild(label);
      row.appendChild(hint);

      if (tense.is_dual_form) {
        const input1 = document.createElement('input');
        input1.type = 'text';
        input1.className = 'report-input';
        input1.style.marginBottom = '10px';
        input1.placeholder = "Type the complete statement here (Form 1)...";
        input1.autocomplete = "off";
        
        const input2 = document.createElement('input');
        input2.type = 'text';
        input2.className = 'report-input';
        input2.placeholder = "Type the complete statement here (Form 2)...";
        input2.autocomplete = "off";

        row.appendChild(input1);
        row.appendChild(input2);
        
        this.reportInputs.push({ 
          inputs: [input1, input2], 
          targets: [tense.statement, tense.statement_2],
          is_dual_form: true 
        });
      } else {
        const input = document.createElement('input');
        input.type = 'text';
        input.className = 'report-input';
        input.placeholder = "Type the complete statement here...";
        input.autocomplete = "off";

        row.appendChild(input);
        
        this.reportInputs.push({ 
          inputs: [input], 
          targets: [tense.statement],
          is_dual_form: false 
        });
      }

      reportContent.appendChild(row);
    });

    document.getElementById('btn-submit-report').style.display = 'inline-block';
    document.getElementById('btn-finish').style.display = 'none';
  }

  checkReport() {
    let allCorrect = true;
    
    this.reportInputs.forEach(item => {
      if (item.is_dual_form) {
        const u1 = this.normalizeString(item.inputs[0].value);
        const u2 = this.normalizeString(item.inputs[1].value);
        const t1 = this.normalizeString(item.targets[0]);
        const t2 = this.normalizeString(item.targets[1]);
        
        const isMatch = (u1 === t1 && u2 === t2) || (u1 === t2 && u2 === t1);
        
        if (isMatch) {
          item.inputs[0].style.borderColor = 'green';
          item.inputs[0].style.backgroundColor = '#e8f5e9';
          item.inputs[1].style.borderColor = 'green';
          item.inputs[1].style.backgroundColor = '#e8f5e9';
        } else {
          allCorrect = false;
          item.inputs[0].style.borderColor = 'red';
          item.inputs[0].style.backgroundColor = '#ffebee';
          item.inputs[1].style.borderColor = 'red';
          item.inputs[1].style.backgroundColor = '#ffebee';
        }
      } else {
        const u1 = this.normalizeString(item.inputs[0].value);
        const t1 = this.normalizeString(item.targets[0]);
        if (u1 === t1) {
          item.inputs[0].style.borderColor = 'green';
          item.inputs[0].style.backgroundColor = '#e8f5e9';
        } else {
          allCorrect = false;
          item.inputs[0].style.borderColor = 'red';
          item.inputs[0].style.backgroundColor = '#ffebee';
        }
      }
    });

    if (allCorrect) {
      tracker.endGame("completed", this.score, 3, this.currentCase.tenses.length);
      // 成功結案，關閉音樂
      if (this.bgm) {
        this.bgm.pause();
      }
      
      // Hide phase 2 submit button and show success modal
      document.getElementById('btn-submit-report').style.display = 'none';
      this.successModal.style.display = 'flex';
      
      // Clear previous stamp if any
      this.modalStampContainer.innerHTML = '';
      
      // Play stamp sound effect
      const stampSound = new Audio('./assets/rubber_stamp.mp3');
      stampSound.play().catch(e => console.log('Stamp sound prevented:', e));

      // 蓋上 Case Closed 印章動畫 (放在大彈窗內)
      const stamp = document.createElement('div');
      stamp.className = 'clue-box stamp-animation';
      stamp.style.backgroundColor = 'rgba(255,255,255,0.9)';
      stamp.style.margin = '0 auto 20px auto';
      stamp.innerHTML = `<span style="font-size: 4rem; color: #dc3545; font-weight: bold; border: 8px solid #dc3545; padding: 15px 30px; display: inline-block;">CASE CLOSED</span>`;
      this.modalStampContainer.appendChild(stamp);
      
    } else {
      alert("There are grammar or spelling errors in your report. Please check the sentences highlighted in red and try again!");
    }
  }

  exitGame() {
    this.bgm.pause();
    this.bgm.currentTime = 0;
    this.renderMenu();
  }
}

// 啟動遊戲
const game = new DialogueRoleplayGame();
game.init();