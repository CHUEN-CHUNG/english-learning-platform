import { defineConfig } from 'vite';
import { resolve } from 'path';

export default defineConfig({
  // 相對路徑：從 dist/APPs/.../index.html 開啟時仍能載入 assets（避免 /assets 404）
  base: './',
  resolve: {
    alias: {
      '@shared': resolve(__dirname, 'shared'),
      '@apps': resolve(__dirname, 'APPs')
    }
  },
  build: {
    rollupOptions: {
      input: {
        main: resolve(__dirname, 'index.html'),
        grammar_hub: resolve(__dirname, 'APPs/grammar-hub/index.html'),
        comic_reader: resolve(__dirname, 'APPs/comic-reader/index.html'),
        grammar_fill_in: resolve(__dirname, 'APPs/grammar-games/to-do/fill-in/index.html'),
        grammar_unscramble: resolve(__dirname, 'APPs/grammar-games/finish/unscramble/index.html'),
        grammar_multiple_choice: resolve(__dirname, 'APPs/grammar-games/finish/multiple-choice/index.html'),
        grammar_traveler_quest: resolve(__dirname, 'APPs/grammar-games/traveler-quest/index.html'),
        grammar_traveler_level1: resolve(__dirname, 'APPs/grammar-games/traveler-quest/level1-journey/index.html'),
        grammar_traveler_level2: resolve(__dirname, 'APPs/grammar-games/traveler-quest/level2-itinerary/index.html'),
        grammar_traveler_level2_how_often: resolve(__dirname, 'APPs/grammar-games/traveler-quest/level2-how-often/index.html'),
        grammar_traveler_level2_how_long: resolve(__dirname, 'APPs/grammar-games/traveler-quest/level2-how-long/index.html'),
        grammar_traveler_level3: resolve(__dirname, 'APPs/grammar-games/traveler-quest/level3-souvenir/index.html'),
        grammar_correction: resolve(__dirname, 'APPs/grammar-games/to-do/correction/index.html'),
        synonyms: resolve(__dirname, 'APPs/Matching-Game/index.html'),
        vocabulary: resolve(__dirname, 'APPs/Vocabulary-Quiz/index.html'),
        reading_hub: resolve(__dirname, 'APPs/reading-hub/index.html'),
        reading: resolve(__dirname, 'APPs/reading-practice/index.html'),
        teacher_hub: resolve(__dirname, 'APPs/teacher-hub/index.html'),
        generator: resolve(__dirname, 'public/generator.html'),
        poster_editor: resolve(__dirname, 'APPs/grammar-poster-editor/index.html'),
        grammar_time_cop:      resolve(__dirname, 'APPs/grammar-games/time-cop/index.html'),
        grammar_time_cop_game: resolve(__dirname, 'APPs/grammar-games/time-cop/game/index.html')
      }
    }
  }
});
