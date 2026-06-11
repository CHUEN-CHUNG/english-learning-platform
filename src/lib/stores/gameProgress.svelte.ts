const QUEST_KEYS = [
  'traveler_quest_level1_complete',
  'traveler_quest_level2_complete',
  'traveler_quest_how_often_complete',
  'traveler_quest_how_long_complete',
  'traveler_quest_level3_complete',
  'time_cop_level1_complete',
  'time_cop_level2_complete',
  'time_cop_level3_complete',
] as const;

type QuestKey = typeof QUEST_KEYS[number];

let _flags = $state<Record<QuestKey, boolean>>({} as Record<QuestKey, boolean>);

export const gameProgress = {
  get flags() { return _flags; },

  init() {
    for (const key of QUEST_KEYS) {
      _flags[key] = localStorage.getItem(key) === 'true';
    }
  },

  complete(key: QuestKey) {
    localStorage.setItem(key, 'true');
    _flags[key] = true;
  }
};
