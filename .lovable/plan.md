Katta yangilanish — quyidagilarni bitta partiyada qo'shamiz. Har biri modul sifatida, mavjud "Linny" tuzilmasiga qo'shiladi.

## 1. Lovable Cloud + Google login (eng katta o'zgarish)
- Lovable Cloud yoqiladi (Supabase asosida, foydalanuvchi ko'zi bilan "Cloud" deb ataladi).
- **Google orqali kirish**: bitta tugma bilan. Kirgan foydalanuvchi qurilma almashtirsa ham, kelgan joyidan davom etadi.
- `profiles` jadvali (ism, jins, yosh, tanlangan daraja, ball, streak, sozlamalar).
- `mistakes` jadvali (predlog/qoida bo'yicha xatolar, sana, qaysi savol).
- `learned_words` jadvali (o'rganilgan flashcards).
- `daily_progress` jadvali (streak va oxirgi tashrif).
- RLS: har kim faqat o'z ma'lumotini ko'radi. `has_role` pattern kelgusi admin uchun.
- Migratsiya: mavjud `localStorage` profil birinchi kirishda cloudga ko'chiriladi (bir marta).
- Chiqmaguncha eslab qoladi (Supabase session).

## 2. Yangi mashq rejimlari (Learning Session menyusida yangi kartalar)
- **Spelling / Typing**: AI so'z aytadi (yoki tarjima ko'rsatadi), foydalanuvchi klaviaturada yozadi. Harfma-harf tekshirish (yashil/qizil).
- **Translate**: ikki yo'nalish — UZ→EN va EN→UZ. AI baholaydi (semantik moslik, aniq javob emas).
- **Shadowing (Speaking)**: AI gap yozadi + TTS (browser SpeechSynthesis) o'qiydi → foydalanuvchi mikrofon (Web Speech Recognition) orqali takrorlaydi → so'zma-so'z solishtirish (yashil/qizil).
- **Daily Mini-Challenge**: AI kunlik topshiriq (masalan "3 gap tuz, `because` va `with` ishlat"). Foydalanuvchi yozadi, AI baholaydi va tuzatadi.
- **Code/Text Explainer**: IT rejimi — matn/error/kod paste qiladi, AI tarjima + `is/are/the/by/of` kabi so'zlarning vazifasini gap ichida bittalab tushuntiradi.

## 3. Qiyinchilik darajasi (har rejim uchun)
- **Oson**: har savolda "💡 Tip" tugmasi (AI kichik ishora beradi).
- **O'rta**: standart.
- **Qiyin**: xato uchun 1-2 imkoniyat, keyin savol o'tib ketadi.
- Dashboard va rejim ichida tanlanadi, profilga saqlanadi.

## 4. Yaxshilangan tushuntirishlar ("Nega?" va "Ko'proq")
- Har savol/karta ostida ikki tugma:
  - **Nega?** — 2-3 gap, aniq va tushunarli o'zbekcha.
  - **Ko'proq ma'lumot** — AI to'liq, yosh bolaga tushuntirgandek: qoida + 3-4 real hayot misoli + qachon ishlatiladi/ishlatilmaydi.
- Xato bo'lganda avtomatik **Visual Micro-Explainer** chiqadi: `of — mansublik` kabi 1 jumlali shpargalka + emoji.

## 5. Xatolar sandig'i — aqlliroq
- Predlog/qoida bo'yicha teglash (`of`, `in`, `at`, `is`, `a/an/the`, `Past Simple`, ...).
- **Har 3 kunda** yoki dars boshida dashboard bannerida: "Sizda `of` bo'yicha 4 ta xato bor — takrorlaymizmi?" tugmasi.
- Cloud jadvalidan o'qiladi, qurilmalar orasida sinxron.

## 6. Contextual (Smart) Flashcards
- Har karta: so'z + tarjima + **gap ichida namuna** + **nima uchun bu grammatika**.
- Masalan: `user` → "List of users" → "of tegishlilikni bildiryapti".

## 7. Streak — cloud asosida
- Kun bo'yicha `daily_progress` yozuvi. Kun o'tkazib yuborsa 0 dan boshlanadi.
- Dashboardda alanga 🔥 + eng uzun streak.

## Texnik detallar

### Cloud sozlash
- `supabase--enable` bilan Lovable Cloud yoqiladi.
- `supabase--configure_social_auth` bilan Google provideri yoqiladi.
- Google login `lovable.auth.signInWithOAuth("google", ...)` orqali (broker).
- `src/routes/_authenticated/*` gate `_authenticated/route.tsx` (integratsiya boshqaradi).
- `src/routes/auth.tsx` — public sign-in sahifa (Google tugma).
- `src/routes/index.tsx` — public landing; agar sessiya bo'lsa `/app` ga redirect.

### Yangi routelar
- `/auth` — public login (Google).
- `/_authenticated/app` — hozirgi dashboard/onboarding oqimi ko'chib keladi.

### Server functions (`src/lib/*.functions.ts`)
- `getMyProfile`, `saveMyProfile` (`requireSupabaseAuth`).
- `logMistake`, `listMistakes`, `mistakesByTag`.
- `bumpDailyStreak`.
- `gradeTranslation` (AI: foydalanuvchi tarjimasini baholaydi).
- `gradeMiniChallenge` (AI: kunlik topshiriq matnini baholaydi).
- `explainDeep` (AI: to'liq "ko'proq ma'lumot" tushuntirish).
- `microExplain` (AI: xatoda 1 jumlali shpargalka).
- `explainCodeText` (Code/Text Explainer).
- Mavjud `genQuestions`/`genFlashcards`/`genRuleExplanation` da `difficulty` va "smart flashcard" maydonlari qo'shiladi.

### UI komponentlar
- `src/components/methods/Spelling.tsx`
- `src/components/methods/Translate.tsx`
- `src/components/methods/Shadowing.tsx` (SpeechSynthesis + SpeechRecognition)
- `src/components/methods/DailyChallenge.tsx`
- `src/components/methods/CodeExplainer.tsx`
- `src/components/DifficultyPicker.tsx`
- `src/components/MicroExplainer.tsx` (xato bo'lganda popup)
- `src/components/DeepExplainSheet.tsx` ("Ko'proq" tugmasi)
- `LearningSession.tsx` menyusiga 5 yangi karta qo'shiladi.
- `Dashboard.tsx` da streak bannerida `mistakesByTag` taklifi.

### Migratsiya
- `src/lib/profile.ts` cloud-first bo'ladi: signed-in bo'lsa server fn'lardan o'qiydi; localStorage faqat public landingda ishlatiladi.
- Birinchi kirishda `localStorage`dagi ma'lumot cloudga bir marta ko'chiriladi.

## Bajarish tartibi
1. `supabase--enable` + jadvallar/RLS/grants migratsiyasi.
2. Google auth (`configure_social_auth`) + `/auth` sahifa + `_authenticated` gate.
3. Profil/streak/mistake server functionlari va `profile.ts` refactor.
4. Difficulty picker + AI prompts yangilanishi.
5. "Nega?" + "Ko'proq" + Micro-Explainer komponentlari va AIQuiz/Flashcards da ishlatish.
6. Yangi rejimlar: Spelling, Translate, Shadowing, DailyChallenge, CodeExplainer.
7. Smart Flashcards maydonlari.
8. Dashboard: streak banner + xatolar bo'yicha takrorlash taklifi.

Bu katta ish. Tasdiqlasangiz, ketma-ket bajarishni boshlayman — Cloud va Google login birinchi bo'ladi, keyin qolgan modullar.
