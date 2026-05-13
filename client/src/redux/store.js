import { configureStore, createSlice } from "@reduxjs/toolkit";

const initialSession = (() => {
  try {
    const raw = localStorage.getItem("session");
    if (!raw) return { user: null, accessToken: null, refreshToken: null };
    const parsed = JSON.parse(raw);
    return {
      user: parsed?.user ?? null,
      accessToken: parsed?.accessToken ?? null,
      refreshToken: parsed?.refreshToken ?? null
    };
  } catch {
    return { user: null, accessToken: null, refreshToken: null };
  }
})();

const authSlice = createSlice({
  name: "auth",
  initialState: initialSession,
  reducers: {
    setSession: (state, action) => {
      state.user = action.payload.user;
      state.accessToken = action.payload.accessToken;
      if (action.payload.refreshToken !== undefined) {
        state.refreshToken = action.payload.refreshToken;
      }
    },
    clearSession: (state) => {
      state.user = null;
      state.accessToken = null;
      state.refreshToken = null;
    }
  }
});

export const { setSession, clearSession } = authSlice.actions;

export const store = configureStore({
  reducer: {
    auth: authSlice.reducer
  }
});

store.subscribe(() => {
  const { auth } = store.getState();
  localStorage.setItem("session", JSON.stringify(auth));
});
