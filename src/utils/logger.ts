/** 技術的なエラー内容はユーザーに見せず、ここに出す（外部送信はしない） */
export const logger = {
  error(message: string, error?: unknown) {
    if (__DEV__) console.error(`[subscbox] ${message}`, error);
  },
  warn(message: string, detail?: unknown) {
    if (__DEV__) console.warn(`[subscbox] ${message}`, detail);
  },
};
