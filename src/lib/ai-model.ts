// ---------------------------------------------------------------------------
// B1 — Single, centralised AI model configuration.
// Every AI request in the app must use these constants. To switch models later,
// change this file only.
// ---------------------------------------------------------------------------

/** Default fast model used for every text/quiz/vocabulary request. */
export const AI_MODEL = "gemini-flash-latest";

/** Cheaper/faster model for very short helper requests. */
export const AI_MODEL_LITE = "gemini-flash-lite-latest";
