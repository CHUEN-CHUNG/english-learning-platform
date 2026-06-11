export interface VerbChoice {
  verb: string;
  question?: string;
  questions?: string[];
  isCorrect: boolean;
  npcReply: string;
}

export interface Tense {
  id: number;
  name: string;
  is_dual_form?: boolean;
  verb_target: string;
  time_target: string;
  statement: string;
  statement_2?: string;
  object_clue: string;
  time_choices: string[];
  verb_choices: VerbChoice[];
  correct_time_questions?: string[];
}

export interface CaseData {
  Case_ID: string;
  Mode: string;
  Intro_Story: string;
  Image_URL: string;
  Pronoun: string;
  BGM_URL: string;
  Phase2_BGM_URL: string;
  tenses: Tense[];
}

export const CASES: CaseData[] = [
  {
    Case_ID: 'c_001',
    Mode: 'Detective',
    Intro_Story: 'A priceless painting was stolen from the city museum! We found a suspect, but his alibi is suspicious. Detective, interrogate him and find out the truth!',
    Image_URL: "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='150' height='150' viewBox='0 0 24 24' fill='%23666'><path d='M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z'/></svg>",
    Pronoun: 'He',
    BGM_URL: './assets/c001_phase1_suspense.mp3',
    Phase2_BGM_URL: './assets/c001_phase2_suspense.mp3',
    tenses: [
      {
        id: 1, name: 'Past',
        verb_target: 'Did he leave?',
        time_target: 'Did he leave the museum last night?',
        statement: 'He left the museum last night.',
        object_clue: 'the museum',
        time_choices: ['last night', 'always', 'right now'],
        verb_choices: [
          { verb: 'leave', question: 'Did he leave?', isCorrect: true, npcReply: 'Yes, he left.' },
          { verb: 'repair', question: 'Did he repair?', isCorrect: false, npcReply: "No, he didn't repair." },
          { verb: 'taste', question: 'Did he taste?', isCorrect: false, npcReply: "No, he didn't taste." },
        ],
      },
      {
        id: 2, name: 'Present',
        verb_target: 'Does he keep?',
        time_target: 'Does he always keep a diary?',
        statement: 'He always keeps a diary.',
        object_clue: 'a diary',
        time_choices: ['always', 'yesterday', 'next week'],
        verb_choices: [
          { verb: 'keep', question: 'Does he keep?', isCorrect: true, npcReply: 'Yes, he keeps it.' },
          { verb: 'fetch', question: 'Does he fetch?', isCorrect: false, npcReply: "No, he doesn't fetch." },
          { verb: 'guess', question: 'Does he guess?', isCorrect: false, npcReply: "No, he doesn't guess." },
        ],
      },
      {
        id: 3, name: 'Continuous',
        verb_target: 'Is he whispering?',
        time_target: 'Is he whispering a secret right now?',
        statement: 'He is whispering a secret right now.',
        object_clue: 'a secret',
        time_choices: ['right now', 'every day', 'last night'],
        verb_choices: [
          { verb: 'whispering', question: 'Is he whispering?', isCorrect: true, npcReply: 'Yes, he is whispering.' },
          { verb: 'tasting', question: 'Is he tasting?', isCorrect: false, npcReply: "No, he isn't tasting." },
          { verb: 'exploring', question: 'Is he exploring?', isCorrect: false, npcReply: "No, he isn't exploring." },
        ],
      },
      {
        id: 4, name: 'Future',
        is_dual_form: true,
        verb_target: 'Will he fetch?',
        time_target: 'Will he fetch the suitcase next night?',
        statement: 'He will fetch the suitcase next night.',
        statement_2: 'He is going to fetch the suitcase next night.',
        object_clue: 'the suitcase',
        time_choices: ['next night', 'yesterday', 'now'],
        verb_choices: [
          { verb: 'fetch', questions: ['Will he fetch?', 'Is he going to fetch?'], question: 'Will he fetch?', isCorrect: true, npcReply: 'Yes, he will / is going to fetch.' },
          { verb: 'repair', questions: ['Will he repair?', 'Is he going to repair?'], question: 'Will he repair?', isCorrect: false, npcReply: "No, he won't / isn't going to repair." },
          { verb: 'leave', questions: ['Will he leave?', 'Is he going to leave?'], question: 'Will he leave?', isCorrect: false, npcReply: "No, he won't / isn't going to leave." },
        ],
        correct_time_questions: ['Will he fetch the suitcase next night?', 'Is he going to fetch the suitcase next night?'],
      },
    ],
  },
  {
    Case_ID: 'c_002',
    Mode: 'Detective',
    Intro_Story: 'The central bank was robbed! We tracked down a group of suspicious mechanics. They claim they were just fixing an engine. We need you to question them before they escape!',
    Image_URL: "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='150' height='150' viewBox='0 0 24 24' fill='%23333'><path d='M16 11c1.66 0 2.99-1.34 2.99-3S17.66 5 16 5c-1.66 0-3 1.34-3 3s1.34 3 3 3zm-8 0c1.66 0 2.99-1.34 2.99-3S9.66 5 8 5C6.34 5 5 6.34 5 8s1.34 3 3 3zm0 2c-2.33 0-7 1.17-7 3.5V19h14v-2.5c0-2.33-4.67-3.5-7-3.5zm8 0c-.29 0-.62.02-.97.05 1.16.84 1.97 1.97 1.97 3.45V19h6v-2.5c0-2.33-4.67-3.5-7-3.5z'/></svg>",
    Pronoun: 'They',
    BGM_URL: './assets/c002_phase1_upbeat.mp3',
    Phase2_BGM_URL: './assets/c002_phase2_upbeat.mp3',
    tenses: [
      {
        id: 1, name: 'Past',
        verb_target: 'Did they repair?',
        time_target: 'Did they repair the engine yesterday morning?',
        statement: 'They repaired the engine yesterday morning.',
        object_clue: 'the engine',
        time_choices: ['yesterday morning', 'always', 'now'],
        verb_choices: [
          { verb: 'repair', question: 'Did they repair?', isCorrect: true, npcReply: 'Yes, they repaired it.' },
          { verb: 'leave', question: 'Did they leave?', isCorrect: false, npcReply: "No, they didn't leave." },
          { verb: 'taste', question: 'Did they taste?', isCorrect: false, npcReply: "No, they didn't taste." },
        ],
      },
      {
        id: 2, name: 'Present',
        verb_target: 'Do they explore?',
        time_target: 'Do they often explore the building?',
        statement: 'They often explore the building.',
        object_clue: 'the building',
        time_choices: ['often', 'yesterday', 'next week'],
        verb_choices: [
          { verb: 'explore', question: 'Do they explore?', isCorrect: true, npcReply: 'Yes, they explore it.' },
          { verb: 'keep', question: 'Do they keep?', isCorrect: false, npcReply: "No, they don't keep." },
          { verb: 'lift', question: 'Do they lift?', isCorrect: false, npcReply: "No, they don't lift." },
        ],
      },
      {
        id: 3, name: 'Continuous',
        verb_target: 'Are they lifting?',
        time_target: 'Are they lifting the bag now?',
        statement: 'They are lifting the bag now.',
        object_clue: 'the bag',
        time_choices: ['now', 'yesterday', 'tomorrow'],
        verb_choices: [
          { verb: 'lifting', question: 'Are they lifting?', isCorrect: true, npcReply: 'Yes, they are lifting.' },
          { verb: 'whispering', question: 'Are they whispering?', isCorrect: false, npcReply: "No, they aren't whispering." },
          { verb: 'preparing', question: 'Are they preparing?', isCorrect: false, npcReply: "No, they aren't preparing." },
        ],
      },
      {
        id: 4, name: 'Future',
        is_dual_form: true,
        verb_target: 'Will they leave?',
        time_target: 'Will they leave the country next week?',
        statement: 'They will leave the country next week.',
        statement_2: 'They are going to leave the country next week.',
        object_clue: 'the country',
        time_choices: ['next week', 'now', 'yesterday'],
        verb_choices: [
          { verb: 'leave', questions: ['Will they leave?', 'Are they going to leave?'], question: 'Will they leave?', isCorrect: true, npcReply: 'Yes, they will / are going to leave.' },
          { verb: 'fetch', questions: ['Will they fetch?', 'Are they going to fetch?'], question: 'Will they fetch?', isCorrect: false, npcReply: "No, they won't / aren't going to fetch." },
          { verb: 'invent', questions: ['Will they invent?', 'Are they going to invent?'], question: 'Will they invent?', isCorrect: false, npcReply: "No, they won't / aren't going to invent." },
        ],
        correct_time_questions: ['Will they leave the country next week?', 'Are they going to leave the country next week?'],
      },
    ],
  },
  {
    Case_ID: 'c_003',
    Mode: 'Detective',
    Intro_Story: "Someone ate the delicious pudding from the fridge! My sister says she was just tasting some food, but I don't believe her. Detective, ask her some questions and find the pudding thief!",
    Image_URL: "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='150' height='150' viewBox='0 0 24 24' fill='%23e91e63'><path d='M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z'/></svg>",
    Pronoun: 'She',
    BGM_URL: './assets/c001_phase1_suspense.mp3',
    Phase2_BGM_URL: './assets/c001_phase2_suspense.mp3',
    tenses: [
      {
        id: 1, name: 'Past',
        verb_target: 'Did she taste?',
        time_target: 'Did she taste the food five minutes ago?',
        statement: 'She tasted the food five minutes ago.',
        object_clue: 'the food',
        time_choices: ['five minutes ago', 'always', 'right now'],
        verb_choices: [
          { verb: 'taste', question: 'Did she taste?', isCorrect: true, npcReply: 'Yes, she tasted it.' },
          { verb: 'leave', question: 'Did she leave?', isCorrect: false, npcReply: "No, she didn't leave." },
          { verb: 'repair', question: 'Did she repair?', isCorrect: false, npcReply: "No, she didn't repair." },
        ],
      },
      {
        id: 2, name: 'Present',
        verb_target: 'Does she prepare?',
        time_target: 'Does she usually prepare the meal?',
        statement: 'She usually prepares the meal.',
        object_clue: 'the meal',
        time_choices: ['usually', 'yesterday', 'next week'],
        verb_choices: [
          { verb: 'prepare', question: 'Does she prepare?', isCorrect: true, npcReply: 'Yes, she prepares it.' },
          { verb: 'keep', question: 'Does she keep?', isCorrect: false, npcReply: "No, she doesn't keep." },
          { verb: 'fetch', question: 'Does she fetch?', isCorrect: false, npcReply: "No, she doesn't fetch." },
        ],
      },
      {
        id: 3, name: 'Continuous',
        verb_target: 'Is she looking after?',
        time_target: 'Is she looking after the baby right now?',
        statement: 'She is looking after the baby right now.',
        object_clue: 'the baby',
        time_choices: ['right now', 'every day', 'last night'],
        verb_choices: [
          { verb: 'looking after', question: 'Is she looking after?', isCorrect: true, npcReply: 'Yes, she is looking after.' },
          { verb: 'whispering', question: 'Is she whispering?', isCorrect: false, npcReply: "No, she isn't whispering." },
          { verb: 'exploring', question: 'Is she exploring?', isCorrect: false, npcReply: "No, she isn't exploring." },
        ],
      },
      {
        id: 4, name: 'Future',
        is_dual_form: true,
        verb_target: 'Will she guess?',
        time_target: 'Will she guess the answer in 1 month?',
        statement: 'She will guess the answer in 1 month.',
        statement_2: 'She is going to guess the answer in 1 month.',
        object_clue: 'the answer',
        time_choices: ['in 1 month', 'yesterday', 'now'],
        verb_choices: [
          { verb: 'guess', questions: ['Will she guess?', 'Is she going to guess?'], question: 'Will she guess?', isCorrect: true, npcReply: 'Yes, she will / is going to guess.' },
          { verb: 'repair', questions: ['Will she repair?', 'Is she going to repair?'], question: 'Will she repair?', isCorrect: false, npcReply: "No, she won't / isn't going to repair." },
          { verb: 'leave', questions: ['Will she leave?', 'Is she going to leave?'], question: 'Will she leave?', isCorrect: false, npcReply: "No, she won't / isn't going to leave." },
        ],
        correct_time_questions: ['Will she guess the answer in 1 month?', 'Is she going to guess the answer in 1 month?'],
      },
    ],
  },
  {
    Case_ID: 'c_004',
    Mode: 'Detective',
    Intro_Story: 'There have been strange footsteps in the attic every night. We think our neighbor is building a weird machine up there. Investigate his daily routine and future plans!',
    Image_URL: "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='150' height='150' viewBox='0 0 24 24' fill='%239c27b0'><path d='M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z'/></svg>",
    Pronoun: 'He',
    BGM_URL: './assets/c001_phase1_suspense.mp3',
    Phase2_BGM_URL: './assets/c001_phase2_suspense.mp3',
    tenses: [
      {
        id: 1, name: 'Past',
        verb_target: 'Did he fetch?',
        time_target: 'Did he fetch the tool two days ago?',
        statement: 'He fetched the tool two days ago.',
        object_clue: 'the tool',
        time_choices: ['two days ago', 'always', 'now'],
        verb_choices: [
          { verb: 'fetch', question: 'Did he fetch?', isCorrect: true, npcReply: 'Yes, he fetched it.' },
          { verb: 'leave', question: 'Did he leave?', isCorrect: false, npcReply: "No, he didn't leave." },
          { verb: 'taste', question: 'Did he taste?', isCorrect: false, npcReply: "No, he didn't taste." },
        ],
      },
      {
        id: 2, name: 'Present',
        verb_target: 'Does he whistle?',
        time_target: 'Does he sometimes whistle a tune?',
        statement: 'He sometimes whistles a tune.',
        object_clue: 'a tune',
        time_choices: ['sometimes', 'yesterday', 'next week'],
        verb_choices: [
          { verb: 'whistle', question: 'Does he whistle?', isCorrect: true, npcReply: 'Yes, he whistles it.' },
          { verb: 'keep', question: 'Does he keep?', isCorrect: false, npcReply: "No, he doesn't keep." },
          { verb: 'lift', question: 'Does he lift?', isCorrect: false, npcReply: "No, he doesn't lift." },
        ],
      },
      {
        id: 3, name: 'Continuous',
        verb_target: 'Is he exploring?',
        time_target: 'Is he exploring the path now?',
        statement: 'He is exploring the path now.',
        object_clue: 'the path',
        time_choices: ['now', 'yesterday', 'tomorrow'],
        verb_choices: [
          { verb: 'exploring', question: 'Is he exploring?', isCorrect: true, npcReply: 'Yes, he is exploring.' },
          { verb: 'whispering', question: 'Is he whispering?', isCorrect: false, npcReply: "No, he isn't whispering." },
          { verb: 'preparing', question: 'Is he preparing?', isCorrect: false, npcReply: "No, he isn't preparing." },
        ],
      },
      {
        id: 4, name: 'Future',
        is_dual_form: true,
        verb_target: 'Will he invent?',
        time_target: 'Will he invent a machine in 4 years?',
        statement: 'He will invent a machine in 4 years.',
        statement_2: 'He is going to invent a machine in 4 years.',
        object_clue: 'a machine',
        time_choices: ['in 4 years', 'now', 'yesterday'],
        verb_choices: [
          { verb: 'invent', questions: ['Will he invent?', 'Is he going to invent?'], question: 'Will he invent?', isCorrect: true, npcReply: 'Yes, he will / is going to invent.' },
          { verb: 'fetch', questions: ['Will he fetch?', 'Is he going to fetch?'], question: 'Will he fetch?', isCorrect: false, npcReply: "No, he won't / isn't going to fetch." },
          { verb: 'leave', questions: ['Will he leave?', 'Is he going to leave?'], question: 'Will he leave?', isCorrect: false, npcReply: "No, he won't / isn't going to leave." },
        ],
        correct_time_questions: ['Will he invent a machine in 4 years?', 'Is he going to invent a machine in 4 years?'],
      },
    ],
  },
  {
    Case_ID: 'c_005',
    Mode: 'Reporter',
    Intro_Story: 'Welcome to the science lab! Today, we are tracking a single drop of water on its incredible journey. Reporter, ask our meteorologist about where the water came from and where it is going!',
    Image_URL: "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='150' height='150' viewBox='0 0 24 24' fill='%2300aaff'><path d='M12 2c-5.33 4.55-8 8.48-8 11.8 0 4.98 3.8 8.2 8 8.2s8-3.22 8-8.2c0-3.32-2.67-7.25-8-11.8zm0 18c-3.35 0-6-2.57-6-6.2 0-2.34 1.95-5.44 6-9.14 4.05 3.7 6 6.79 6 9.14 0 3.63-2.65 6.2-6 6.2z'/></svg>",
    Pronoun: 'It',
    BGM_URL: './assets/c005_phase1_science.mp3',
    Phase2_BGM_URL: './assets/c005_phase2_science.mp3',
    tenses: [
      {
        id: 1, name: 'Past',
        verb_target: 'Did it leave?',
        time_target: 'Did it leave the river yesterday?',
        statement: 'It left the river yesterday.',
        object_clue: 'the river',
        time_choices: ['yesterday', 'always', 'next month'],
        verb_choices: [
          { verb: 'leave', question: 'Did it leave?', isCorrect: true, npcReply: 'Yes, it left.' },
          { verb: 'taste', question: 'Did it taste?', isCorrect: false, npcReply: "No, it didn't taste." },
          { verb: 'repair', question: 'Did it repair?', isCorrect: false, npcReply: "No, it didn't repair." },
        ],
      },
      {
        id: 2, name: 'Present',
        verb_target: 'Does it improve?',
        time_target: 'Does it always improve the environment?',
        statement: 'It always improves the environment.',
        object_clue: 'the environment',
        time_choices: ['always', 'last night', 'right now'],
        verb_choices: [
          { verb: 'improve', question: 'Does it improve?', isCorrect: true, npcReply: 'Yes, it improves it.' },
          { verb: 'keep', question: 'Does it keep?', isCorrect: false, npcReply: "No, it doesn't keep." },
          { verb: 'whistle', question: 'Does it whistle?', isCorrect: false, npcReply: "No, it doesn't whistle." },
        ],
      },
      {
        id: 3, name: 'Continuous',
        verb_target: 'Is it landing?',
        time_target: 'Is it landing on the ground right now?',
        statement: 'It is landing on the ground right now.',
        object_clue: 'on the ground',
        time_choices: ['right now', 'yesterday', 'tomorrow'],
        verb_choices: [
          { verb: 'landing', question: 'Is it landing?', isCorrect: true, npcReply: 'Yes, it is landing.' },
          { verb: 'whispering', question: 'Is it whispering?', isCorrect: false, npcReply: "No, it isn't whispering." },
          { verb: 'exploring', question: 'Is it exploring?', isCorrect: false, npcReply: "No, it isn't exploring." },
        ],
      },
      {
        id: 4, name: 'Future',
        is_dual_form: true,
        verb_target: 'Will it explore?',
        time_target: 'Will it explore the ocean next month?',
        statement: 'It will explore the ocean next month.',
        statement_2: 'It is going to explore the ocean next month.',
        object_clue: 'the ocean',
        time_choices: ['next month', 'now', 'five minutes ago'],
        verb_choices: [
          { verb: 'explore', questions: ['Will it explore?', 'Is it going to explore?'], question: 'Will it explore?', isCorrect: true, npcReply: 'Yes, it will / is going to explore.' },
          { verb: 'fetch', questions: ['Will it fetch?', 'Is it going to fetch?'], question: 'Will it fetch?', isCorrect: false, npcReply: "No, it won't / isn't going to fetch." },
          { verb: 'leave', questions: ['Will it leave?', 'Is it going to leave?'], question: 'Will it leave?', isCorrect: false, npcReply: "No, it won't / isn't going to leave." },
        ],
        correct_time_questions: ['Will it explore the ocean next month?', 'Is it going to explore the ocean next month?'],
      },
    ],
  },
  {
    Case_ID: 'c_006',
    Mode: 'Reporter',
    Intro_Story: "Every year, millions of monarch butterflies travel across the continent. It's a beautiful mystery! Reporter, interview our ecologist to learn about their past journey and their future destination!",
    Image_URL: "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='150' height='150' viewBox='0 0 24 24' fill='%23ff9800'><path d='M12 2c-5.33 4.55-8 8.48-8 11.8 0 4.98 3.8 8.2 8 8.2s8-3.22 8-8.2c0-3.32-2.67-7.25-8-11.8zm0 18c-3.35 0-6-2.57-6-6.2 0-2.34 1.95-5.44 6-9.14 4.05 3.7 6 6.79 6 9.14 0 3.63-2.65 6.2-6 6.2z'/></svg>",
    Pronoun: 'They',
    BGM_URL: './assets/c005_phase1_science.mp3',
    Phase2_BGM_URL: './assets/c005_phase2_science.mp3',
    tenses: [
      {
        id: 1, name: 'Past',
        verb_target: 'Did they leave?',
        time_target: 'Did they leave the forest last spring?',
        statement: 'They left the forest last spring.',
        object_clue: 'the forest',
        time_choices: ['last spring', 'always', 'next month'],
        verb_choices: [
          { verb: 'leave', question: 'Did they leave?', isCorrect: true, npcReply: 'Yes, they left.' },
          { verb: 'taste', question: 'Did they taste?', isCorrect: false, npcReply: "No, they didn't taste." },
          { verb: 'repair', question: 'Did they repair?', isCorrect: false, npcReply: "No, they didn't repair." },
        ],
      },
      {
        id: 2, name: 'Present',
        verb_target: 'Do they look after?',
        time_target: 'Do they usually look after the eggs?',
        statement: 'They usually look after the eggs.',
        object_clue: 'the eggs',
        time_choices: ['usually', 'last night', 'right now'],
        verb_choices: [
          { verb: 'look after', question: 'Do they look after?', isCorrect: true, npcReply: 'Yes, they look after them.' },
          { verb: 'keep', question: 'Do they keep?', isCorrect: false, npcReply: "No, they don't keep." },
          { verb: 'whistle', question: 'Do they whistle?', isCorrect: false, npcReply: "No, they don't whistle." },
        ],
      },
      {
        id: 3, name: 'Continuous',
        verb_target: 'Are they tasting?',
        time_target: 'Are they tasting the flower right now?',
        statement: 'They are tasting the flower right now.',
        object_clue: 'the flower',
        time_choices: ['right now', 'yesterday', 'tomorrow'],
        verb_choices: [
          { verb: 'tasting', question: 'Are they tasting?', isCorrect: true, npcReply: 'Yes, they are tasting.' },
          { verb: 'whispering', question: 'Are they whispering?', isCorrect: false, npcReply: "No, they aren't whispering." },
          { verb: 'exploring', question: 'Are they exploring?', isCorrect: false, npcReply: "No, they aren't exploring." },
        ],
      },
      {
        id: 4, name: 'Future',
        is_dual_form: true,
        verb_target: 'Will they land?',
        time_target: 'Will they land on the tree next morning?',
        statement: 'They will land on the tree next morning.',
        statement_2: 'They are going to land on the tree next morning.',
        object_clue: 'on the tree',
        time_choices: ['next morning', 'now', 'five minutes ago'],
        verb_choices: [
          { verb: 'land', questions: ['Will they land?', 'Are they going to land?'], question: 'Will they land?', isCorrect: true, npcReply: 'Yes, they will / are going to land.' },
          { verb: 'fetch', questions: ['Will they fetch?', 'Are they going to fetch?'], question: 'Will they fetch?', isCorrect: false, npcReply: "No, they won't / aren't going to fetch." },
          { verb: 'leave', questions: ['Will they leave?', 'Are they going to leave?'], question: 'Will they leave?', isCorrect: false, npcReply: "No, they won't / aren't going to leave." },
        ],
        correct_time_questions: ['Will they land on the tree next morning?', 'Are they going to land on the tree next morning?'],
      },
    ],
  },
];
