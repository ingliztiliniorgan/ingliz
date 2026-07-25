import type { QItem } from "./types";

// 120+ savol. Har biri 1-5 qiyinlik darajasida.
// Format: o'zbekcha izoh + inglizcha gap, foydalanuvchi to'g'ri variantni tanlaydi.

export const QUESTIONS: QItem[] = [
  // ===== DIFFICULTY 1 (juda oson) =====
  { id: "q1", difficulty: 1, topic: "articles", q: "Bo'sh joyni to'ldiring: I have ___ apple.", choices: ["a", "an", "the", "-"], answerIndex: 1, explanation: "‘apple’ unli tovush bilan boshlanadi, shuning uchun ‘an’ ishlatiladi." },
  { id: "q2", difficulty: 1, topic: "articles", q: "Bo'sh joyni to'ldiring: She is ___ teacher.", choices: ["an", "a", "the", "-"], answerIndex: 1, explanation: "‘teacher’ undosh tovush bilan boshlanadi → ‘a’." },
  { id: "q3", difficulty: 1, topic: "be", q: "Bo'sh joyni to'ldiring: I ___ a student.", choices: ["am", "is", "are", "be"], answerIndex: 0, explanation: "‘I’ bilan doim ‘am’ kelinadi." },
  { id: "q4", difficulty: 1, topic: "be", q: "Bo'sh joyni to'ldiring: He ___ my brother.", choices: ["am", "is", "are", "be"], answerIndex: 1, explanation: "‘He/She/It’ bilan ‘is’." },
  { id: "q5", difficulty: 1, topic: "be", q: "Bo'sh joyni to'ldiring: We ___ friends.", choices: ["am", "is", "are", "be"], answerIndex: 2, explanation: "‘We/You/They’ bilan ‘are’." },
  { id: "q6", difficulty: 1, topic: "pronoun", q: "‘Men’ so'zining inglizcha ekvivalenti:", choices: ["You", "I", "He", "We"], answerIndex: 1, explanation: "‘Men’ = I." },
  { id: "q7", difficulty: 1, topic: "vocab", q: "‘Kitob’ inglizchada:", choices: ["Table", "Book", "Chair", "Pen"], answerIndex: 1, explanation: "Book = Kitob." },
  { id: "q8", difficulty: 1, topic: "vocab", q: "‘Suv’ inglizchada:", choices: ["Milk", "Water", "Juice", "Tea"], answerIndex: 1, explanation: "Water = Suv." },
  { id: "q9", difficulty: 1, topic: "articles", q: "Bo'sh joyni to'ldiring: This is ___ orange.", choices: ["a", "an", "the", "-"], answerIndex: 1, explanation: "‘orange’ unli tovush bilan → an." },
  { id: "q10", difficulty: 1, topic: "vocab", q: "‘Ha’ inglizchada:", choices: ["No", "Yes", "Ok", "Maybe"], answerIndex: 1, explanation: "Yes = Ha." },
  { id: "q11", difficulty: 1, topic: "numbers", q: "‘Three’ so'zi qaysi son:", choices: ["2", "3", "4", "5"], answerIndex: 1, explanation: "Three = 3." },
  { id: "q12", difficulty: 1, topic: "vocab", q: "‘Kompyuter’ inglizchada:", choices: ["Computer", "Camera", "Comment", "Company"], answerIndex: 0, explanation: "Computer = Kompyuter." },
  { id: "q13", difficulty: 1, topic: "be", q: "___ you okay?", choices: ["Am", "Is", "Are", "Do"], answerIndex: 2, explanation: "‘you’ bilan ‘are’." },
  { id: "q14", difficulty: 1, topic: "vocab", q: "‘Uy’ inglizchada:", choices: ["House", "Horse", "Hose", "Hour"], answerIndex: 0, explanation: "House = Uy." },
  { id: "q15", difficulty: 1, topic: "articles", q: "Bo'sh joyni to'ldiring: I see ___ dog.", choices: ["an", "a", "the", "of"], answerIndex: 1, explanation: "‘dog’ undosh → a." },

  // ===== DIFFICULTY 2 (oson) =====
  { id: "q16", difficulty: 2, topic: "prep", q: "The book is ___ the table.", choices: ["in", "on", "at", "of"], answerIndex: 1, explanation: "Yuza ustida = on." },
  { id: "q17", difficulty: 2, topic: "prep", q: "She lives ___ Tashkent.", choices: ["on", "at", "in", "to"], answerIndex: 2, explanation: "Katta joy (shahar) → in." },
  { id: "q18", difficulty: 2, topic: "prep", q: "I wake up ___ 7 o'clock.", choices: ["in", "on", "at", "by"], answerIndex: 2, explanation: "Aniq vaqt → at." },
  { id: "q19", difficulty: 2, topic: "possessive", q: "This is a photo ___ my family.", choices: ["from", "of", "to", "with"], answerIndex: 1, explanation: "‘of’ mansublik: oilamning surati." },
  { id: "q20", difficulty: 2, topic: "present", q: "He ___ English every day.", choices: ["study", "studies", "studying", "studied"], answerIndex: 1, explanation: "3-shaxs birlik → studies." },
  { id: "q21", difficulty: 2, topic: "present", q: "They ___ football on Sundays.", choices: ["plays", "play", "playing", "played"], answerIndex: 1, explanation: "‘They’ bilan asosiy shakl → play." },
  { id: "q22", difficulty: 2, topic: "articles", q: "___ sun rises in the east.", choices: ["A", "An", "The", "-"], answerIndex: 2, explanation: "Yagona narsa → the sun." },
  { id: "q23", difficulty: 2, topic: "prep", q: "The meeting is ___ Monday.", choices: ["in", "on", "at", "by"], answerIndex: 1, explanation: "Kunlar bilan → on." },
  { id: "q24", difficulty: 2, topic: "prep", q: "We are ___ home.", choices: ["in", "on", "at", "to"], answerIndex: 2, explanation: "‘at home’ — o'zgarmas ifoda." },
  { id: "q25", difficulty: 2, topic: "possessive", q: "That is the key ___ the car.", choices: ["of", "for", "to", "with"], answerIndex: 2, explanation: "‘the key to the car’ — kalitning kimga tegishliligi ‘to’." },
  { id: "q26", difficulty: 2, topic: "have", q: "I ___ two brothers.", choices: ["has", "have", "am", "having"], answerIndex: 1, explanation: "‘I’ bilan → have." },
  { id: "q27", difficulty: 2, topic: "have", q: "She ___ a new phone.", choices: ["have", "has", "is", "does"], answerIndex: 1, explanation: "3-shaxs birlik → has." },
  { id: "q28", difficulty: 2, topic: "question", q: "___ do you live?", choices: ["What", "Where", "Who", "When"], answerIndex: 1, explanation: "Joy so'rash → Where." },
  { id: "q29", difficulty: 2, topic: "prep", q: "I go ___ school by bus.", choices: ["at", "in", "to", "on"], answerIndex: 2, explanation: "Yo'nalish → to." },
  { id: "q30", difficulty: 2, topic: "articles", q: "I need ___ umbrella.", choices: ["a", "an", "the", "-"], answerIndex: 1, explanation: "‘umbrella’ unli tovush → an." },

  // ===== DIFFICULTY 3 (o'rta) =====
  { id: "q31", difficulty: 3, topic: "past", q: "Yesterday I ___ to the cinema.", choices: ["go", "goes", "went", "gone"], answerIndex: 2, explanation: "‘go’ ning o'tgan zamon shakli — went." },
  { id: "q32", difficulty: 3, topic: "past", q: "She ___ a book last night.", choices: ["read", "reads", "reading", "readed"], answerIndex: 0, explanation: "‘read’ ning past shakli ham read (talaffuzi ‘red’)." },
  { id: "q33", difficulty: 3, topic: "cont", q: "Look! The baby ___ .", choices: ["cries", "cry", "is crying", "cried"], answerIndex: 2, explanation: "Hozirgi davomiy zamon → is + Ving." },
  { id: "q34", difficulty: 3, topic: "prep", q: "I am good ___ math.", choices: ["in", "at", "on", "with"], answerIndex: 1, explanation: "‘good at’ — nimadadir yaxshi." },
  { id: "q35", difficulty: 3, topic: "prep", q: "She is interested ___ music.", choices: ["at", "on", "in", "of"], answerIndex: 2, explanation: "‘interested in’ — o'zgarmas ibora." },
  { id: "q36", difficulty: 3, topic: "prep", q: "He is afraid ___ dogs.", choices: ["from", "of", "with", "at"], answerIndex: 1, explanation: "‘afraid of’ — o'zgarmas ibora." },
  { id: "q37", difficulty: 3, topic: "modal", q: "You ___ smoke here. It's forbidden.", choices: ["can", "must not", "should", "may"], answerIndex: 1, explanation: "Taqiqlash → must not." },
  { id: "q38", difficulty: 3, topic: "modal", q: "I ___ speak three languages.", choices: ["can", "must", "should", "am"], answerIndex: 0, explanation: "Qobiliyat → can." },
  { id: "q39", difficulty: 3, topic: "future", q: "Tomorrow I ___ visit my grandma.", choices: ["will", "am", "did", "was"], answerIndex: 0, explanation: "Kelasi zamon → will + V." },
  { id: "q40", difficulty: 3, topic: "compare", q: "This car is ___ than that one.", choices: ["fast", "faster", "fastest", "more fast"], answerIndex: 1, explanation: "Qisqa sifatda → -er." },
  { id: "q41", difficulty: 3, topic: "compare", q: "She is the ___ girl in class.", choices: ["tall", "taller", "tallest", "more tall"], answerIndex: 2, explanation: "Ustunlik → the + -est." },
  { id: "q42", difficulty: 3, topic: "prep", q: "I met her ___ the bus stop.", choices: ["in", "on", "at", "to"], answerIndex: 2, explanation: "Aniq nuqta → at." },
  { id: "q43", difficulty: 3, topic: "quantifier", q: "There isn't ___ milk in the fridge.", choices: ["some", "any", "a", "many"], answerIndex: 1, explanation: "Inkorda → any." },
  { id: "q44", difficulty: 3, topic: "quantifier", q: "How ___ money do you have?", choices: ["many", "much", "a lot", "few"], answerIndex: 1, explanation: "Sanalmaydigan (money) → much." },
  { id: "q45", difficulty: 3, topic: "quantifier", q: "How ___ books did you read?", choices: ["much", "many", "any", "some"], answerIndex: 1, explanation: "Sanalidigan → many." },
  { id: "q46", difficulty: 3, topic: "past", q: "I ___ not see him yesterday.", choices: ["do", "does", "did", "was"], answerIndex: 2, explanation: "O'tgan zamon inkor → did not." },
  { id: "q47", difficulty: 3, topic: "prep", q: "The file is ___ the folder.", choices: ["at", "on", "in", "to"], answerIndex: 2, explanation: "Ichida → in." },
  { id: "q48", difficulty: 3, topic: "it-english", q: "Please ___ your changes to Git.", choices: ["pull", "push", "click", "make"], answerIndex: 1, explanation: "Kodni yuklash → push." },
  { id: "q49", difficulty: 3, topic: "it-english", q: "Can you review my ___ request?", choices: ["push", "pull", "pop", "get"], answerIndex: 1, explanation: "Pull Request — GitHub'da o'zgarishlarni birlashtirish so'rovi." },
  { id: "q50", difficulty: 3, topic: "prep", q: "This bug happens ___ the login page.", choices: ["in", "on", "at", "of"], answerIndex: 1, explanation: "Sahifada → on (on the page)." },

  // ===== DIFFICULTY 4 (qiyin) =====
  { id: "q51", difficulty: 4, topic: "perfect", q: "I ___ never been to London.", choices: ["has", "have", "am", "did"], answerIndex: 1, explanation: "Present Perfect: have + V3." },
  { id: "q52", difficulty: 4, topic: "perfect", q: "She ___ just finished her homework.", choices: ["have", "has", "is", "was"], answerIndex: 1, explanation: "3-shaxs birlik → has + V3." },
  { id: "q53", difficulty: 4, topic: "passive", q: "The letter ___ written by Tom.", choices: ["is", "was", "were", "did"], answerIndex: 1, explanation: "Passive past → was + V3." },
  { id: "q54", difficulty: 4, topic: "passive", q: "English ___ spoken all over the world.", choices: ["is", "are", "was", "be"], answerIndex: 0, explanation: "Passive present → is + V3." },
  { id: "q55", difficulty: 4, topic: "cond", q: "If it rains, we ___ stay home.", choices: ["will", "would", "are", "did"], answerIndex: 0, explanation: "1-conditional: If + present, will + V." },
  { id: "q56", difficulty: 4, topic: "cond", q: "If I ___ rich, I would travel a lot.", choices: ["am", "was", "were", "be"], answerIndex: 2, explanation: "2-conditional: If + past (were), would + V." },
  { id: "q57", difficulty: 4, topic: "reported", q: "He said he ___ tired.", choices: ["is", "was", "will", "has"], answerIndex: 1, explanation: "Reported speech: is → was." },
  { id: "q58", difficulty: 4, topic: "phrasal", q: "Please turn ___ the lights.", choices: ["on", "at", "in", "up"], answerIndex: 0, explanation: "‘turn on’ — yoqmoq." },
  { id: "q59", difficulty: 4, topic: "phrasal", q: "I look ___ to seeing you.", choices: ["for", "at", "forward", "up"], answerIndex: 2, explanation: "‘look forward to + Ving’." },
  { id: "q60", difficulty: 4, topic: "prep", q: "The team consists ___ five members.", choices: ["from", "of", "with", "in"], answerIndex: 1, explanation: "‘consist of’ — dan iborat bo'lmoq." },
  { id: "q61", difficulty: 4, topic: "prep", q: "He apologized ___ being late.", choices: ["of", "about", "for", "with"], answerIndex: 2, explanation: "‘apologize for’." },
  { id: "q62", difficulty: 4, topic: "rel", q: "The man ___ lives next door is a doctor.", choices: ["which", "who", "whose", "whom"], answerIndex: 1, explanation: "Odam uchun → who." },
  { id: "q63", difficulty: 4, topic: "rel", q: "This is the book ___ I told you about.", choices: ["who", "which", "whose", "where"], answerIndex: 1, explanation: "Narsa uchun → which/that." },
  { id: "q64", difficulty: 4, topic: "ger-inf", q: "I enjoy ___ music.", choices: ["listen", "to listen", "listening", "listened"], answerIndex: 2, explanation: "‘enjoy’ dan keyin -ing." },
  { id: "q65", difficulty: 4, topic: "ger-inf", q: "She wants ___ a doctor.", choices: ["become", "to become", "becoming", "became"], answerIndex: 1, explanation: "‘want’ dan keyin to + V." },
  { id: "q66", difficulty: 4, topic: "it-english", q: "We need to ___ this issue before release.", choices: ["fix", "make", "do", "close"], answerIndex: 0, explanation: "Xatolikni tuzatish → fix." },
  { id: "q67", difficulty: 4, topic: "it-english", q: "The server is ___ due to high traffic.", choices: ["down", "up", "off", "out"], answerIndex: 0, explanation: "Server ishlamayapti → down." },
  { id: "q68", difficulty: 4, topic: "perfect", q: "How long ___ you known him?", choices: ["did", "have", "are", "do"], answerIndex: 1, explanation: "Present Perfect savoli: have + you + V3." },
  { id: "q69", difficulty: 4, topic: "prep", q: "I congratulated her ___ passing the exam.", choices: ["for", "on", "with", "about"], answerIndex: 1, explanation: "‘congratulate on’." },
  { id: "q70", difficulty: 4, topic: "phrasal", q: "Don't give ___! Keep trying.", choices: ["up", "in", "away", "out"], answerIndex: 0, explanation: "‘give up’ — taslim bo'lmoq." },

  // ===== DIFFICULTY 5 (juda qiyin) =====
  { id: "q71", difficulty: 5, topic: "cond3", q: "If I ___ known, I would have called you.", choices: ["have", "had", "would", "did"], answerIndex: 1, explanation: "3-conditional: If + had + V3, would have + V3." },
  { id: "q72", difficulty: 5, topic: "cond3", q: "She would have come if she ___ time.", choices: ["had", "has", "had had", "have"], answerIndex: 2, explanation: "‘had had’ — Past Perfect (have fe'lining V3 shakli)." },
  { id: "q73", difficulty: 5, topic: "subjunctive", q: "I wish I ___ speak Chinese.", choices: ["can", "could", "will", "would"], answerIndex: 1, explanation: "‘wish’ + could → hozirgi imkoniyat orzusi." },
  { id: "q74", difficulty: 5, topic: "modal-perfect", q: "You ___ told me earlier!", choices: ["should", "should have", "must", "would"], answerIndex: 1, explanation: "‘should have + V3’ — o'tmishga afsus." },
  { id: "q75", difficulty: 5, topic: "modal-perfect", q: "He ___ have missed the train, he left early.", choices: ["can't", "mustn't", "shouldn't", "wouldn't"], answerIndex: 0, explanation: "‘can't have + V3’ — bo'lgan bo'lishi mumkin emas." },
  { id: "q76", difficulty: 5, topic: "inversion", q: "Never ___ I seen such a beautiful place.", choices: ["I have", "have I", "did I", "was I"], answerIndex: 1, explanation: "Inkor qo'shimchadan keyin inversiya: have I + V3." },
  { id: "q77", difficulty: 5, topic: "articles", q: "___ life is full of surprises.", choices: ["A", "An", "The", "-"], answerIndex: 3, explanation: "Umumiy tushunchada — artikl yo'q." },
  { id: "q78", difficulty: 5, topic: "prep-adv", q: "She succeeded ___ her efforts.", choices: ["by", "with", "in", "of"], answerIndex: 2, explanation: "‘succeed in + Ving/N’." },
  { id: "q79", difficulty: 5, topic: "prep-adv", q: "He was accused ___ stealing.", choices: ["for", "of", "in", "with"], answerIndex: 1, explanation: "‘accuse of’." },
  { id: "q80", difficulty: 5, topic: "prep-adv", q: "I insist ___ paying the bill.", choices: ["at", "for", "on", "in"], answerIndex: 2, explanation: "‘insist on’." },
  { id: "q81", difficulty: 5, topic: "passive-perfect", q: "The report ___ been finished by tomorrow.", choices: ["will have", "has", "had", "would"], answerIndex: 0, explanation: "Future Perfect Passive: will have been + V3." },
  { id: "q82", difficulty: 5, topic: "reported", q: "She asked me where ___ .", choices: ["I live", "do I live", "I lived", "did I live"], answerIndex: 2, explanation: "Reported question: to'g'ri tartib + past." },
  { id: "q83", difficulty: 5, topic: "it-english", q: "Please make sure the API ___ authentication.", choices: ["supports", "support", "supporting", "supported"], answerIndex: 0, explanation: "3-shaxs birlik (API) → supports." },
  { id: "q84", difficulty: 5, topic: "it-english", q: "This function is responsible ___ handling errors.", choices: ["of", "for", "with", "to"], answerIndex: 1, explanation: "‘responsible for’." },
  { id: "q85", difficulty: 5, topic: "phrasal", q: "The meeting was called ___ due to bad weather.", choices: ["off", "on", "up", "over"], answerIndex: 0, explanation: "‘call off’ — bekor qilmoq." },
  { id: "q86", difficulty: 5, topic: "gerund", q: "He is used to ___ early.", choices: ["wake up", "waking up", "woke up", "wakes up"], answerIndex: 1, explanation: "‘be used to + Ving’." },
  { id: "q87", difficulty: 5, topic: "advanced", q: "Hardly ___ I arrived when it started to rain.", choices: ["did", "had", "have", "was"], answerIndex: 1, explanation: "‘Hardly had I V3 when …’ tuzilma." },
  { id: "q88", difficulty: 5, topic: "advanced", q: "It's high time we ___ home.", choices: ["go", "went", "gone", "going"], answerIndex: 1, explanation: "‘It's high time + past simple’." },
  { id: "q89", difficulty: 5, topic: "advanced", q: "Not only ___ tired, but also hungry.", choices: ["I was", "was I", "I am", "am I"], answerIndex: 1, explanation: "‘Not only’ dan keyin inversiya." },
  { id: "q90", difficulty: 5, topic: "advanced", q: "The proposal ___ by the committee last week.", choices: ["approved", "was approved", "has approved", "approving"], answerIndex: 1, explanation: "Passive past → was approved." },

  // Yana bir necha savol (2-3 darajalar) to yetkazamiz 100 gacha bemalol
  { id: "q91", difficulty: 2, topic: "vocab", q: "‘Fayl’ inglizchada:", choices: ["Feel", "File", "Fill", "Fell"], answerIndex: 1, explanation: "File = Fayl." },
  { id: "q92", difficulty: 2, topic: "vocab", q: "‘Ekran’ inglizchada:", choices: ["Screen", "Scream", "Green", "Sign"], answerIndex: 0, explanation: "Screen = Ekran." },
  { id: "q93", difficulty: 3, topic: "prep", q: "I work ___ a big company.", choices: ["at", "in", "for", "on"], answerIndex: 2, explanation: "‘work for’ — kompaniyada ishlamoq." },
  { id: "q94", difficulty: 3, topic: "prep", q: "This is a list ___ users.", choices: ["for", "of", "with", "to"], answerIndex: 1, explanation: "‘list of’ — ro'yxat." },
  { id: "q95", difficulty: 3, topic: "verbs", q: "Choose the correct verb: She ___ to the office by car.", choices: ["gone", "go", "goes", "going"], answerIndex: 2, explanation: "3-shaxs birlik → goes." },
  { id: "q96", difficulty: 4, topic: "prep", q: "There is a difference ___ these two designs.", choices: ["of", "between", "at", "on"], answerIndex: 1, explanation: "‘difference between’." },
  { id: "q97", difficulty: 4, topic: "prep", q: "I depend ___ my parents.", choices: ["from", "on", "at", "of"], answerIndex: 1, explanation: "‘depend on’." },
  { id: "q98", difficulty: 4, topic: "it-english", q: "Our app is compatible ___ mobile devices.", choices: ["for", "of", "with", "to"], answerIndex: 2, explanation: "‘compatible with’." },
  { id: "q99", difficulty: 5, topic: "advanced", q: "By this time next year, I ___ my degree.", choices: ["finish", "will finish", "will have finished", "finished"], answerIndex: 2, explanation: "Future Perfect: will have + V3." },
  { id: "q100", difficulty: 5, topic: "advanced", q: "Rarely ___ such dedication in a junior developer.", choices: ["I see", "do I see", "I do see", "seen I"], answerIndex: 1, explanation: "‘Rarely’ dan keyin inversiya: do I see." },

  // qo'shimcha bufer
  { id: "q101", difficulty: 1, topic: "vocab", q: "‘Bugun’ inglizchada:", choices: ["Tomorrow", "Yesterday", "Today", "Tonight"], answerIndex: 2, explanation: "Today = Bugun." },
  { id: "q102", difficulty: 2, topic: "prep", q: "I was born ___ 1998.", choices: ["on", "at", "in", "by"], answerIndex: 2, explanation: "Yil bilan → in." },
  { id: "q103", difficulty: 3, topic: "prep", q: "We arrived ___ the airport at 9.", choices: ["in", "on", "at", "to"], answerIndex: 2, explanation: "‘arrive at + kichik joy’." },
  { id: "q104", difficulty: 4, topic: "prep", q: "She's married ___ a doctor.", choices: ["with", "to", "for", "of"], answerIndex: 1, explanation: "‘married to’." },
  { id: "q105", difficulty: 5, topic: "advanced", q: "Had I known earlier, I ___ acted differently.", choices: ["will", "would", "would have", "had"], answerIndex: 2, explanation: "3-conditional inversion: Had I V3, would have V3." },
  { id: "q106", difficulty: 2, topic: "vocab", q: "‘Ish’ (kasb) inglizchada:", choices: ["Job", "Jab", "Jump", "Join"], answerIndex: 0, explanation: "Job = Ish." },
  { id: "q107", difficulty: 3, topic: "modal", q: "You ___ finish your homework before playing.", choices: ["can", "should", "may", "would"], answerIndex: 1, explanation: "Maslahat → should." },
  { id: "q108", difficulty: 4, topic: "gerund", q: "I don't mind ___ late.", choices: ["work", "to work", "working", "worked"], answerIndex: 2, explanation: "‘mind + Ving’." },
  { id: "q109", difficulty: 5, topic: "advanced", q: "So beautiful ___ the view that we stopped.", choices: ["was", "were", "is", "did"], answerIndex: 0, explanation: "‘So + adj + was/were + subject’ — inversiya." },
  { id: "q110", difficulty: 1, topic: "articles", q: "I bought ___ book yesterday.", choices: ["an", "a", "the", "-"], answerIndex: 1, explanation: "‘book’ undosh → a." },
  { id: "q111", difficulty: 2, topic: "prep", q: "The picture ___ the wall is nice.", choices: ["in", "on", "at", "of"], answerIndex: 1, explanation: "Devorda → on." },
  { id: "q112", difficulty: 3, topic: "past", q: "Where ___ you last night?", choices: ["was", "were", "did", "are"], answerIndex: 1, explanation: "‘you’ bilan past → were." },
  { id: "q113", difficulty: 4, topic: "rel", q: "The city ___ I grew up is small.", choices: ["which", "who", "where", "whose"], answerIndex: 2, explanation: "Joy uchun → where." },
  { id: "q114", difficulty: 5, topic: "advanced", q: "No sooner ___ he arrived than the phone rang.", choices: ["did", "had", "was", "has"], answerIndex: 1, explanation: "‘No sooner had + subject + V3’." },
  { id: "q115", difficulty: 2, topic: "vocab", q: "‘Do'st’ inglizchada:", choices: ["Friend", "Family", "Father", "Fine"], answerIndex: 0, explanation: "Friend = Do'st." },
  { id: "q116", difficulty: 3, topic: "future", q: "I think it ___ rain tomorrow.", choices: ["is", "will", "was", "does"], answerIndex: 1, explanation: "Bashorat → will." },
  { id: "q117", difficulty: 4, topic: "phrasal", q: "Can you look ___ my dog while I'm away?", choices: ["at", "for", "after", "up"], answerIndex: 2, explanation: "‘look after’ — g'amxo'rlik qilmoq." },
  { id: "q118", difficulty: 4, topic: "phrasal", q: "I ran ___ an old friend today.", choices: ["into", "over", "off", "in"], answerIndex: 0, explanation: "‘run into’ — tasodifan uchramoq." },
  { id: "q119", difficulty: 5, topic: "advanced", q: "Under no circumstances ___ you share your password.", choices: ["you should", "should you", "you must", "must you not"], answerIndex: 1, explanation: "Inkor iboradan keyin inversiya: should you." },
  { id: "q120", difficulty: 1, topic: "vocab", q: "‘Rahmat’ inglizchada:", choices: ["Sorry", "Please", "Thanks", "Hello"], answerIndex: 2, explanation: "Thanks = Rahmat." },
];

export function pickQuestion(
  desiredDifficulty: 1 | 2 | 3 | 4 | 5,
  used: Set<string>,
  opts?: { topicFilter?: (topic: string | undefined) => boolean },
): QItem | null {
  const filt = opts?.topicFilter ?? (() => true);
  const order = [
    desiredDifficulty,
    Math.max(1, desiredDifficulty - 1),
    Math.min(5, desiredDifficulty + 1),
    Math.max(1, desiredDifficulty - 2),
    Math.min(5, desiredDifficulty + 2),
  ];
  for (const d of order) {
    const pool = QUESTIONS.filter((q) => q.difficulty === d && !used.has(q.id) && filt(q.topic));
    if (pool.length > 0) return pool[Math.floor(Math.random() * pool.length)];
  }
  const rest = QUESTIONS.filter((q) => !used.has(q.id) && filt(q.topic));
  if (rest.length === 0) {
    // fallback: any question at desired difficulty ignoring filter
    const any = QUESTIONS.filter((q) => !used.has(q.id));
    if (any.length === 0) return null;
    return any[Math.floor(Math.random() * any.length)];
  }
  return rest[Math.floor(Math.random() * rest.length)];
}
