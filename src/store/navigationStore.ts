import { create } from 'zustand'

export type View = 'home' | 'editor' | 'settings' | 'zotero-projects'

interface NavigationState {
  currentView: View
  history: View[]
  navigate: (view: View) => void
  goBack: () => void
  canGoBack: () => boolean
}

export const useNavigationStore = create<NavigationState>((set, get) => ({
  currentView: 'home',
  history: [],
  navigate: (view: View) => {
    set((state) => ({
      history: [...state.history, state.currentView],
      currentView: view,
    }));
  },
  goBack: () => {
    set((state) => {
      if (state.history.length > 0) {
        const previousView = state.history[state.history.length - 1];
        return {
          currentView: previousView,
          history: state.history.slice(0, -1),
        };
      }
      return state; // No change if history is empty
    });
  },
  canGoBack: () => get().history.length > 0,
}));
