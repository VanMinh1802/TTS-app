const AUTH_STATE_EVENT = "auth-state-changed";

const emitAuthStateChanged = (): void => {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new Event(AUTH_STATE_EVENT));
};

export const notifyAuthStateChanged = (): void => {
  emitAuthStateChanged();
};
