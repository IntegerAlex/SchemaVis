/**
 * This file is part of the SchemaVis project.
 * Copyright (C) 2025 Akshat Kotpalliwar (IntegerAlex)
 * Licensed under the GNU Affero General Public License v3.0 or later.
 */
import { create } from 'zustand';

type UserState = {
  userId?: string;
  email?: string;
  name?: string;
  setUser: (data: { userId?: string; email?: string; name?: string }) => void;
  clearUser: () => void;
};

export const useUserStore = create<UserState>((set) => ({
  userId: undefined,
  email: undefined,
  name: undefined,
  setUser: ({ userId, email, name }) => set({ userId, email, name }),
  clearUser: () => set({ userId: undefined, email: undefined, name: undefined }),
}));

