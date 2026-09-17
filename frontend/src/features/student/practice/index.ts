// Practice Arena — 3 pages: Intro, Play, Result
// These pages use /practice/... endpoints — NO progression side effects.
// The student can practice any unlocked chapter's quiz freely.
//
// CRITICAL: These pages must NEVER call /quizzes/:id/start or /attempts/:id/submit
// Those are mastery endpoints. Mixing them would accidentally trigger progression.

export {} // module marker — actual pages are in PracticeIntroPage, PracticePlayPage, PracticeResultPage
