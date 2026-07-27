
# Reja — Linny v3

Katta ish. 3 asosiy blok: (A) Bug/oqim tuzatishlar, (B) Vocabulary yodlash tizimi, (C) Boshqa Ko'nikmalar bo'limlarini qayta qurish.

---

## A. Bug fixes va oqim (birinchi navbatda)

1. **Sahifa yangilanganda bosh sahifaga qaytish**
   - Sabab: `src/routes/index.tsx` app "screen" ni faqat React state da saqlaydi (`useState`). Refresh → state yo'qoladi.
   - Yechim: har bir ekran uchun alohida route yaratamiz:
     - `/auth` (bor)
     - `/onboarding`
     - `/level`
     - `/placement`
     - `/dashboard`
     - `/learn/$mode` (ai-quiz, rules, flashcards, skills, spelling, translate, shadowing, code, daily, vocab)
     - `/mistakes`
   - Har biri `_authenticated` layout ostida bo'ladi (auth-first).
   - Navigatsiya `useNavigate` orqali.

2. **Auth-first**: Saytga birinchi kirishda `/auth` chiqadi. `_authenticated/route.tsx` allaqachon bor — index `_authenticated/index.tsx` ga ko'chiriladi, top-level `index.tsx` faqat `/auth` ga redirect qiladi (yoki sign-in landing).

3. **Daily Challenge yuklanmoqda muammosi**
   - Debug qilib, `genDailyChallenge` server fn xatosini UI ga chiqaramiz (hozir silently loading qolyapti).
   - Retry tugmasi va aniq xato matni.

4. **SignOut**: Hozir bor, route-based tuzilmada global joylashtiramiz.

---

## B. Vocabulary yodlash tizimi (asosiy yangi feature)

### Data model (migration)
```sql
-- Kunlik yodlash so'zlari
CREATE TABLE public.vocab_words (
  id uuid PK,
  user_id uuid,
  word text,
  translation text,
  pronunciation text,
  topic text,
  assigned_date date,   -- qaysi kun uchun rejalashtirilgan
  status text,          -- 'pending' | 'shown' | 'learned' | 'mastered'
  learned_at timestamptz,
  is_favorite boolean default false,
  favorited_at timestamptz,
  created_at timestamptz
);

-- Foydalanuvchi sozlamalari
ALTER TABLE profiles ADD COLUMN daily_word_count int default 10;
ALTER TABLE profiles ADD COLUMN vocab_last_generated date;
```
+ tegishli GRANT va RLS policylar.

### Oqim
1. **Birinchi kirish**: `/vocab/setup` — foydalanuvchi kuniga nechta so'z (5–30) tanlaydi.
2. **Vocab home** (`/learn/vocab`):
   - "Yodlashni boshlash" tugmasi (agar bugun hali ko'rmagan bo'lsa) → "Yodlashni davom ettirish" (ko'rgan lekin test topshirmagan) → "Yodladim" (yopishdan keyin).
   - "Sevimlilar" tugmasi.
   - "Kunlik meyorni o'zgartirish" tugmasi.
   - Progress: bugungi X/Y so'z, streak.
3. **Yodlash oynasi**: AI kartochkalar birma-bir/list ko'rinishda (so'z, tarjima, talaffuz kichik matnda, "🔊 Eshitish" tugmasi — Web Speech `speechSynthesis` faqat inglizcha o'qiydi).
   - Pastda tugmalar: **Ulashish** (Web Share API, matn), **Yuklab olish** (.txt), **Sevimli** (star toggle per word), **Yopish**.
4. **Sevimlilar sahifasi**: ro'yxat + mavzu + sana + "olib tashlash".
5. **Yodladim testi**:
   - Test boshlashdan oldin: slider "eski so'zlardan qo'shimcha % (10–70)".
   - Bugungi so'zlar 100% + eski `learned` so'zlardan X% ni tasodifiy qo'shadi.
   - MCQ + yozish aralash, tartib random, takrorlanmaydi.
   - Natija ≥70% → `status='learned'`, bugungi kun bajarildi, streak yangilanadi.
   - <70% → qayta yechish so'raladi.
6. **Kunlik yangilash**: `assigned_date < today` va `status != 'learned'` — ertangi kunga o'tkaziladi (yig'iladi). Har kun soat 00:00 (mahalliy) — server fn ochilganda tekshiradi va yangi kun uchun AI orqali yangi so'zlar yaratadi.

### AI
- `genVocabBatch` server fn: user darajasi + kelib chiqmagan mavzular + `learnedWords` ro'yxatidan tashqari yangi so'zlar.
- `genVocabTest` server fn: bugungi + eski so'zlardan aralash test tuzadi.

---

## C. Boshqa Ko'nikmalar bo'limlarini shu tarhda mustahkamlash

1. **Grammar (Qoidalar)** — mavjud `RulesMode` ni kengaytirish: real tushunarli misollar, hayotiy gaplar, "Sinab ko'r" mini-testi.
2. **Reading (Savollar orqali)** — foydalanuvchi mavzu kiritadi, AI parcha + savollar tuzadi.
3. **Topics (Mavzular)** — user istalgan mavzu; AI hech qachon "yo'q" demasin (prompt strong).
4. **Flashcards** — mavjud, xatolik bo'lsa saqlash.
5. **Writing (Yozish)** — AI faqat foydalanuvchining `learned_words` ro'yxatidan o'zbekcha beradi; user inglizcha yozadi. Case-insensitive.
6. **Translate** — gap-darajasida (mavjud lekin so'z aralash rejim qo'shamiz).
7. **Speaking (Talaffuz)** — kirishda tanlash: **So'zlar / Gaplar** × **eng→uz / uz→en / aralash**. 10–100 element. Har birini SpeechSynthesis (faqat en) o'qiydi. Mikrofon → `SpeechRecognition` → matn taqqoslash (%). <70% → qayta o'qish. Bayroqcha = tugatish. Yakuniy ball 0–100.
8. **Code & Text explainer** — mavjud; qo'shimcha: so'zlarni "Sevimlilarga qo'shish" tugmasi, kod tilini avto-aniqlash yorlig'i.

---

## Kirish nuqtasi tartibi

`/` → agar auth yo'q → `/auth`; auth bor → `/dashboard` (yoki agar profil to'lmagan bo'lsa `/onboarding` → `/level` → `/placement` → `/dashboard`). Har bir ekran real route, refresh xavfsiz.

---

## Amalga oshirish tartibi (bo'lib-bo'lib)

Bir zumda hammasi juda katta. Men quyidagi tartibda ishlayman:

**1-bosqich (bu turn):** A blok to'liq — route arxitekturasi (refresh fix), auth-first, Daily Challenge debug, vocab schema migration + Vocab MVP (setup, home, yodlash oynasi, sevimlilar, test, oddiy AI batch).

**2-bosqich (keyingi turn):** B blokni sayqallash + C blok bo'limlarini birma-bir qayta qurish (Writing, Speaking mikrofon oqimi, Reading, Topics kuchli prompt).

Katta hajm sabab bo'lib-bo'lib qilaman. Rozimisiz shu tartib bilan boshlashimga?
