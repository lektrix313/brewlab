import { create } from 'zustand';
import { Recipe, Batch, StyleTemplate, Fermentable, Hop, Culture, BeerStyle } from '../lib/beerjson/types';

export type BrewSessionPhase = 'setup' | 'mash' | 'boil' | 'cool' | 'pitch' | 'complete';

export interface BrewSession {
  batch_id: string;
  phase: BrewSessionPhase;
  mash_step_index: number;
  boil_time_remaining_sec: number;
  cool_time_remaining_sec: number;
  hop_additions_done: string[];
  is_paused: boolean;
  started_at: string;
}

interface AppState {
  // Seed data
  fermentables: Fermentable[];
  hops: Hop[];
  cultures: Culture[];
  styles: BeerStyle[];
  templates: StyleTemplate[];

  // User data
  recipes: Recipe[];
  batches: Batch[];
  sessions: BrewSession[];

  // Actions
  setSeedData: (data: {
    fermentables: Fermentable[];
    hops: Hop[];
    cultures: Culture[];
    styles: BeerStyle[];
    templates: StyleTemplate[];
  }) => void;
  addRecipe: (recipe: Recipe) => void;
  updateRecipe: (recipe: Recipe) => void;
  removeRecipe: (id: string) => void;
  addBatch: (batch: Batch) => void;
  updateBatch: (batch: Batch) => void;
  removeBatch: (id: string) => void;

  // Custom ingredients
  addCustomFermentable: (f: Fermentable) => void;
  addCustomHop: (h: Hop) => void;
  addCustomCulture: (c: Culture) => void;

  // Brew session
  startSession: (batch_id: string) => void;
  updateSession: (session: BrewSession) => void;
  endSession: (batch_id: string) => void;
}

export const useAppStore = create<AppState>((set) => ({
  fermentables: [],
  hops: [],
  cultures: [],
  styles: [],
  templates: [],
  recipes: [],
  batches: [],
  sessions: [],

  setSeedData: (data) => set((state) => ({ ...state, ...data })),
  addRecipe: (recipe) => set((state) => ({ recipes: [...state.recipes, recipe] })),
  updateRecipe: (recipe) =>
    set((state) => ({
      recipes: state.recipes.map((r) => (r.id === recipe.id ? recipe : r)),
    })),
  removeRecipe: (id) =>
    set((state) => ({
      recipes: state.recipes.filter((r) => r.id !== id),
    })),
  addBatch: (batch) => set((state) => ({ batches: [...state.batches, batch] })),
  updateBatch: (batch) =>
    set((state) => ({
      batches: state.batches.map((b) => (b.id === batch.id ? batch : b)),
    })),
  removeBatch: (id) =>
    set((state) => ({
      batches: state.batches.filter((b) => b.id !== id),
    })),

  startSession: (batch_id) =>
    set((state) => {
      const existing = state.sessions.find((s) => s.batch_id === batch_id);
      if (existing) return state;
      const batch = state.batches.find((b) => b.id === batch_id);
      const boilMin = batch?.recipe_snapshot.process.boil.duration_min ?? 60;
      return {
        sessions: [
          ...state.sessions,
          {
            batch_id,
            phase: 'setup',
            mash_step_index: 0,
            boil_time_remaining_sec: boilMin * 60,
            cool_time_remaining_sec: 20 * 60,
            hop_additions_done: [],
            is_paused: false,
            started_at: new Date().toISOString(),
          },
        ],
      };
    }),

  updateSession: (session) =>
    set((state) => ({
      sessions: state.sessions.map((s) =>
        s.batch_id === session.batch_id ? session : s
      ),
    })),

  endSession: (batch_id) =>
    set((state) => ({
      sessions: state.sessions.filter((s) => s.batch_id !== batch_id),
    })),

  addCustomFermentable: (f) =>
    set((state) => ({
      fermentables: [...state.fermentables, f],
    })),
  addCustomHop: (h) =>
    set((state) => ({
      hops: [...state.hops, h],
    })),
  addCustomCulture: (c) =>
    set((state) => ({
      cultures: [...state.cultures, c],
    })),
}));
