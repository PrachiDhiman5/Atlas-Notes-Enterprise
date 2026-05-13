import { configureStore, createSlice } from "@reduxjs/toolkit";

const initialSession = (() => {
  try {
    const raw = localStorage.getItem("session");
    if (!raw) return { user: null, accessToken: null };
    return JSON.parse(raw);
  } catch {
    return { user: null, accessToken: null };
  }
})();

const authSlice = createSlice({
  name: "auth",
  initialState: initialSession,
  reducers: {
    setSession: (state, action) => {
      state.user = action.payload.user;
      state.accessToken = action.payload.accessToken;
    },
    clearSession: (state) => {
      state.user = null;
      state.accessToken = null;
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
