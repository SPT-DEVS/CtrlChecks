import { create } from 'zustand';

interface ExpressionDropState {
  pendingExpression: { fieldKey: string; expression: string } | null;
  setPendingExpression: (fieldKey: string, expression: string) => void;
  clearPendingExpression: () => void;
}

export const useExpressionDropStore = create<ExpressionDropState>((set) => ({
  pendingExpression: null,
  setPendingExpression: (fieldKey: string, expression: string) => {
    set({ pendingExpression: { fieldKey, expression } });
  },
  clearPendingExpression: () => {
    set({ pendingExpression: null });
  },
}));

