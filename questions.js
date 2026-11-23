/* ======================================================
   MODAL VERBS ADVENTURE — questions.js  (PART 3)
   Question bank (12 questions per level = 60 total) and the
   QuestionManager that serves them randomly.

   Question format:
   { id, level, category, question, options:{A,B,C,D},
     correctAnswer:"A"|"B"|"C"|"D", explanation }

   Rules for writing questions here:
   - exactly one correct option, no "all of the above" style options
   - explanations never mention option letters, so options can be
     shuffled safely at play time
   - everything is written in simple English
   ====================================================== */

(function () {
  "use strict";

  const Q = (id, level, category, question, a, b, c, d, correct, explanation) => ({
    id, level, category, question,
    options: { A: a, B: b, C: c, D: d },
    correctAnswer: correct,
    explanation
  });

  const BANK = [
    /* ================= LEVEL 1 — CAN & COULD ================= */
    Q("Q001", 1, "CAN", "She ___ swim very well.", "can", "cans", "canning", "to can", "A",
      "Can is used to express ability. We use the base form of the verb after can."),
    Q("Q002", 1, "CAN", "Which sentence talks about ABILITY?", "I can swim fast.", "Can I go out?", "Could you help me?", "It could be late.", "A",
      "\"I can swim fast\" says what a person is able to do. That is ability."),
    Q("Q003", 1, "CAN", "___ I sit here? Yes, you can.", "Can", "Cans", "Am", "Does", "A",
      "We use can to ask for permission. The modal verb comes before the subject in a question."),
    Q("Q004", 1, "CAN", "You ___ use my pen. I do not need it now.", "can", "cans", "to can", "canning", "A",
      "Can also gives permission. It does not change with the subject, so we say \"you can\"."),
    Q("Q005", 1, "COULD", "When I was five, I ___ ride a bike.", "could", "can", "coulds", "to could", "A",
      "Could is used for past ability. \"When I was five\" is in the past, so we use could."),
    Q("Q006", 1, "COULD", "My grandfather ___ run fast when he was young.", "could", "can", "coulds", "is could", "A",
      "Could talks about something a person was able to do in the past."),
    Q("Q007", 1, "COULD", "___ you open the window, please?", "Could", "Coulds", "Do could", "Would to", "A",
      "Could you...? is a polite request. The modal verb goes before the subject."),
    Q("Q008", 1, "COULD", "Which sentence is a POLITE REQUEST?", "Could you help me, please?", "I could swim when I was six.", "She can sing well.", "It could rain tomorrow.", "A",
      "\"Could you...?\" asks someone to do something in a polite way."),
    Q("Q009", 1, "COULD", "The sky is dark. It ___ rain this afternoon.", "could", "coulds", "to could", "coulding", "A",
      "Could can show possibility. It means something is possible, but we are not sure."),
    Q("Q010", 1, "CAN", "I ___ swim. I am afraid of water.", "can't", "cant to", "don't can", "not can", "A",
      "The negative of can is cannot or can't. We put it before the base verb."),
    Q("Q011", 1, "COULD", "Last night I ___ sleep because it was too noisy.", "couldn't", "can't", "doesn't could", "not could", "A",
      "\"Last night\" is in the past, so we use couldn't for past inability."),
    Q("Q012", 1, "DEFINITION", "Can and could are modal verbs. What comes after a modal verb?", "the base verb", "verb + s", "to + verb", "verb + ing", "A",
      "After most modal verbs we use the base verb. We do not add -s, -ing, or \"to\"."),

    /* ================= LEVEL 2 — MAY & MIGHT ================= */
    Q("Q013", 2, "MAY", "___ I come in, please?", "May", "Mays", "Do may", "To may", "A",
      "May is used to ask for permission politely. The modal verb comes before the subject."),
    Q("Q014", 2, "MAY", "Students ___ use dictionaries during the test. It is allowed.", "may", "mays", "may to", "are may", "A",
      "May gives permission. Modal verbs do not change with the subject."),
    Q("Q015", 2, "MAY", "Take an umbrella. It ___ rain today.", "may", "mays", "may to", "maying", "A",
      "May can show possibility. It means that rain is possible."),
    Q("Q016", 2, "MIGHT", "She ___ come to the party, but she is not sure.", "might", "mights", "might to", "is might", "A",
      "Might shows a possibility. The speaker is not sure about it."),
    Q("Q017", 2, "MIGHT", "Which modal verb usually shows a WEAKER possibility than \"may\"?", "might", "must", "will", "mustn't", "A",
      "Might is a little weaker than may. It means the chance is smaller."),
    Q("Q018", 2, "MIGHT", "Which sentence is correct?", "He might goes to the park.", "He might go to the park.", "He might to go to the park.", "He mights go to the park.", "B",
      "We use the base verb after might. We do not add -s and we do not use \"to\"."),
    Q("Q019", 2, "MAY", "You ___ leave early today. The teacher said it is okay.", "may", "mustn't", "can't", "shouldn't", "A",
      "May gives permission. The teacher allows it, so \"may\" is the correct choice."),
    Q("Q020", 2, "MIGHT", "I am not sure about my plans. I ___ visit my aunt this weekend.", "might", "must", "will", "can't", "A",
      "\"I am not sure\" shows a weak possibility. Might is the best modal verb here."),
    Q("Q021", 2, "MAY", "The shop ___ not be open today because it is a holiday.", "may", "mays", "does may", "may to", "A",
      "To make a negative with may, we put not after may. The verb that follows stays in the base form."),
    Q("Q022", 2, "MAY", "Which sentence asks for permission politely?", "May I borrow your pen?", "I may borrow a pen.", "He might borrow a pen.", "They may borrowing a pen.", "A",
      "\"May I...?\" is a polite way to ask for permission."),
    Q("Q023", 2, "MIGHT", "\"She might be late.\" What does this sentence mean?", "It is possible that she will be late, but we are not sure.", "She is not allowed to be late.", "She has to be late.", "She was late yesterday.", "A",
      "Might shows that something is possible, but it is not certain."),
    Q("Q024", 2, "MAY", "Which question is correct?", "May I go home?", "May go I home?", "Do I may go home?", "May I going home?", "A",
      "In a question, the order is Modal + Subject + Base Verb."),

    /* ================= LEVEL 3 — MUST & SHOULD ================= */
    Q("Q025", 3, "MUST", "You ___ wear a helmet when you ride a motorcycle. It is the law.", "must", "might", "may", "mustn't", "A",
      "Must shows a strong obligation. A law is something we have to follow."),
    Q("Q026", 3, "PROHIBITION", "You ___ park here. It is forbidden.", "mustn't", "must", "should", "may", "A",
      "Mustn't means something is not allowed. \"Forbidden\" means we are not allowed to do it."),
    Q("Q027", 3, "SHOULD", "You look tired. You ___ go to bed early tonight.", "should", "mustn't", "won't", "can't", "A",
      "Should is used to give advice. It is a good idea to go to bed early when you are tired."),
    Q("Q028", 3, "SHOULD", "This restaurant is delicious. You ___ try the fried rice.", "should", "mustn't", "can't", "won't", "A",
      "Should is also used to make a recommendation. It means \"I think it is a good idea\"."),
    Q("Q029", 3, "MUST", "It is a school rule. Students ___ wear a uniform.", "must", "mustn't", "needn't", "can't", "A",
      "Must shows a rule or a strong obligation. The students have to wear a uniform."),
    Q("Q030", 3, "MUST", "Which sentence is correct?", "She must finish her homework.", "She must to finish her homework.", "She musts finish her homework.", "She must finishes her homework.", "A",
      "Modal verbs do not change with the subject. We use the base verb after must, without \"to\"."),
    Q("Q031", 3, "PROHIBITION", "\"You mustn't touch the stove.\" What does this sentence mean?", "Touching the stove is not allowed.", "You have to touch the stove.", "You can touch the stove.", "You touched the stove yesterday.", "A",
      "Mustn't is used for prohibition. It means that something is not allowed or is dangerous."),
    Q("Q032", 3, "SHOULD", "Which sentence gives ADVICE?", "You should drink more water.", "You must not drink water.", "I can drink water.", "I will drink water.", "A",
      "Should is used for advice. It tells someone what is a good idea to do."),
    Q("Q033", 3, "SHOULD", "You ___ eat too much candy. It is bad for your teeth.", "shouldn't", "should", "must", "can", "A",
      "Shouldn't is used to say that something is not a good idea."),
    Q("Q034", 3, "SHOULD", "___ I wear a jacket today? It looks cold.", "Should", "Shoulds", "Do should", "Should to", "A",
      "We use should to ask for advice. The modal verb comes before the subject."),
    Q("Q035", 3, "MUST", "The teacher says: \"Everyone must be quiet during the test.\" What does the teacher want?", "Everyone has to be quiet.", "Everyone can choose to be quiet.", "Everyone might be quiet.", "Everyone was quiet.", "A",
      "Must shows a strong obligation. It is not a choice. The students have to be quiet."),
    Q("Q036", 3, "SHOULD", "Which sentence is a RECOMMENDATION, not a rule?", "You should read this book.", "You must read this book.", "You mustn't read this book.", "You will read this book.", "A",
      "Should is used for a recommendation. Must is used for rules and strong obligations."),

    /* ================= LEVEL 4 — WILL & WOULD ================= */
    Q("Q037", 4, "WILL", "I ___ visit my grandmother tomorrow.", "will", "wills", "will to", "am will", "A",
      "Will is used to talk about future actions. We use the base verb after will."),
    Q("Q038", 4, "WILL", "It is raining now. Don't worry, I ___ bring you an umbrella.", "will", "wills", "will to", "do will", "A",
      "Will is used for a decision or a promise about the future."),
    Q("Q039", 4, "WILL", "She is very tired, so she ___ come to the party tonight.", "won't", "will to", "wills not", "not will", "A",
      "The negative of will is will not, or won't. It talks about a future action that will not happen."),
    Q("Q040", 4, "WOULD", "___ you pass me the salt, please?", "Would", "Woulds", "Do would", "Would to", "A",
      "Would you...? is a polite request. The modal verb comes before the subject."),
    Q("Q041", 4, "WOULD", "I ___ like a cup of tea, please.", "would", "woulds", "would to", "am would", "A",
      "\"I would like...\" is a polite way to say what you want. It shows a preference."),
    Q("Q042", 4, "WILL", "Which sentence talks about a FUTURE action?", "I will call you tonight.", "I would like some water.", "If I were a bird, I would fly.", "Would you help me?", "A",
      "Will is used for future actions. \"Tonight\" is a time in the future."),
    Q("Q043", 4, "WOULD", "Which sentence is a POLITE REQUEST?", "Would you open the door, please?", "I will open the door.", "He would be a pilot if he studied.", "I opened the door.", "A",
      "\"Would you...?\" asks someone to do something in a polite way."),
    Q("Q044", 4, "WOULD", "Which sentence shows an IMAGINARY situation?", "If I had a magic carpet, I would visit every country.", "I will fly tomorrow.", "Would you fly with me?", "I would like a ticket.", "A",
      "Would is used for imaginary situations. A magic carpet is not real, so the situation is imaginary."),
    Q("Q045", 4, "WOULD", "I ___ rather stay at home than go to the party.", "would", "will", "must", "can", "A",
      "\"Would rather\" shows a preference. It means \"I prefer this one\"."),
    Q("Q046", 4, "WOULD", "If I were a bird, I ___ fly over the sea.", "would", "woulds", "would to", "am would", "A",
      "Would is used for imaginary situations. We use the base verb after would."),
    Q("Q047", 4, "WOULD", "Which question is correct?", "Would you like some juice?", "Would you likes some juice?", "Do you would like some juice?", "Would to you like some juice?", "A",
      "In a question, the order is Modal + Subject + Base Verb."),
    Q("Q048", 4, "WILL", "Which sentence is correct?", "They will arrive at six.", "They will arrives at six.", "They will to arrive at six.", "They wills arrive at six.", "A",
      "After will we use the base verb. We do not add -s and we do not use \"to\"."),

    /* ================= LEVEL 5 — MODAL VERBS MASTER ================= */
    Q("Q049", 5, "DEFINITION", "What are modal verbs?", "Helping verbs that show ability, permission, possibility, advice, or obligation.", "Verbs that always end with -ing.", "Verbs that only talk about the past.", "Words that name people and places.", "A",
      "Modal verbs are helping verbs. They add meaning such as ability, permission, possibility, advice, or obligation."),
    Q("Q050", 5, "STRUCTURE", "What is the basic structure of a sentence with a modal verb?", "Subject + Modal + Base Verb", "Subject + Base Verb + Modal", "Modal + Subject + Verb-ing", "Subject + To + Modal + Verb", "A",
      "The basic structure is Subject + Modal + Base Verb, for example: \"She can swim.\""),
    Q("Q051", 5, "NEGATIVE", "Which one is the correct NEGATIVE structure?", "Subject + Modal + Not + Base Verb", "Subject + Not + Modal + Base Verb", "Subject + Modal + Base Verb + Not", "Not + Subject + Modal + Base Verb", "A",
      "We put not after the modal verb, for example: \"He should not go.\""),
    Q("Q052", 5, "QUESTION", "Which one is the correct QUESTION structure?", "Modal + Subject + Base Verb?", "Subject + Modal + Base Verb?", "Do + Subject + Modal + Base Verb?", "Subject + Base Verb + Modal?", "A",
      "In a question, the modal verb comes first, for example: \"Can you help me?\""),
    Q("Q053", 5, "RULES", "Which sentence is correct?", "He can speak three languages.", "He cans speak three languages.", "He can speaks three languages.", "He can to speak three languages.", "A",
      "Modal verbs do not change with the subject, and the verb after them is in the base form."),
    Q("Q054", 5, "RULES", "Which rule about modal verbs is TRUE?", "Modal verbs do not change according to the subject.", "We always add -s to modal verbs after he, she, and it.", "We use \"to\" after all modal verbs.", "We use the -ing form after modal verbs.", "A",
      "Modal verbs stay the same for every subject. We use the base verb after them, and \"to\" is not used after most of them."),
    Q("Q055", 5, "PROHIBITION", "The sign says: \"No Entry\". You ___ enter this room.", "mustn't", "must", "should", "will", "A",
      "Mustn't is used for prohibition. \"No Entry\" means that people are not allowed to go in."),
    Q("Q056", 5, "NEGATIVE", "Which sentence is correct?", "She shouldn't eat so much sugar.", "She doesn't should eat so much sugar.", "She shouldn't to eat so much sugar.", "She not should eat so much sugar.", "A",
      "To make a modal verb negative, we add not after it. We do not use do or does."),
    Q("Q057", 5, "COULD", "Which sentence is the MOST polite request?", "Could you help me, please?", "Help me.", "You will help me.", "You must help me.", "A",
      "\"Could you...?\" with please is a polite request. The other sentences sound like orders."),
    Q("Q058", 5, "WOULD", "Which sentence is correct?", "If I won the lottery, I would travel the world.", "If I won the lottery, I would to travel the world.", "If I won the lottery, I woulds travel the world.", "If I won the lottery, I would travelling the world.", "A",
      "Would is used for imaginary situations. We use the base verb after would."),
    Q("Q059", 5, "QUESTION", "Which question is correct?", "Should we leave now?", "Should we to leave now?", "Do we should leave now?", "Should leave we now?", "A",
      "A question follows the order Modal + Subject + Base Verb."),
    Q("Q060", 5, "MIGHT", "\"You might win the prize.\" What does it mean?", "It is possible, but it is not certain.", "You are not allowed to win.", "You have to win.", "You were able to win.", "A",
      "Might shows a weak possibility. It means that it can happen, but we are not sure.")
  ];

  window.QUESTION_BANK = BANK;
  window.QUESTIONS_PER_LEVEL_KEY = (n) => "level" + n;

  const LETTERS = ["A", "B", "C", "D"];
  const SESSION_KEY = "mva_question_history";

  function shuffle(arr) {
    const a = arr.slice();
    for (let i = a.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
  }

  /** Returns a copy of the question with options in random order and a
   *  recalculated correctAnswer letter. The original bank is never changed. */
  function shuffleOptions(q) {
    const entries = LETTERS.map((L) => ({ L, text: q.options[L] }));
    const order = q.noShuffle ? entries : shuffle(entries);
    const options = {};
    let correctAnswer = q.correctAnswer;
    order.forEach((e, i) => {
      options[LETTERS[i]] = e.text;
      if (e.L === q.correctAnswer) correctAnswer = LETTERS[i];
    });
    return Object.assign({}, q, { options, correctAnswer });
  }

  window.QuestionManager = (function () {
    // per-level state for the current play session
    const state = {};   // { [level]: { queue:[ids], used:Set } }
    let history = [];   // [{ id, level, category, chosen, correct, time }]

    try {
      const raw = sessionStorage.getItem(SESSION_KEY);
      if (raw) history = JSON.parse(raw) || [];
    } catch (e) { history = []; }

    function saveHistory() {
      try { sessionStorage.setItem(SESSION_KEY, JSON.stringify(history)); } catch (e) { /* optional */ }
    }

    function forLevel(level) { return BANK.filter((q) => q.level === level); }

    function refill(level, avoidId) {
      let ids = shuffle(forLevel(level).map((q) => q.id));
      // never start a new round with the question that was just asked
      if (avoidId && ids.length > 1 && ids[0] === avoidId) ids.push(ids.shift());
      state[level] = { queue: ids, used: new Set(), last: avoidId || null };
    }

    return {
      /** Call when a level starts or is retried: a fresh shuffled bank for that level. */
      reset(level) {
        refill(level, null);
        history = history.filter((h) => h.level !== level);
        saveHistory();
      },

      /** Next random question of this level. No repeats until every question has been used. */
      next(level) {
        if (!state[level]) refill(level, null);
        let s = state[level];
        if (s.queue.length === 0) refill(level, s.last);
        s = state[level];
        const id = s.queue.shift();
        s.used.add(id);
        s.last = id;
        const q = BANK.find((x) => x.id === id);
        return shuffleOptions(q);
      },

      /** Store the result of a question for this play session. */
      record(q, chosen, correct) {
        history.push({ id: q.id, level: q.level, category: q.category, chosen, correct: !!correct, time: Date.now() });
        saveHistory();
      },

      getHistory(level) { return history.filter((h) => level === undefined || h.level === level); },
      count(level) { return forLevel(level).length; },
      remaining(level) { return state[level] ? state[level].queue.length : forLevel(level).length; },

      /** Developer check: returns a list of problems (empty list = bank is valid). */
      validate() {
        const problems = [], ids = new Set(), texts = new Set();
        BANK.forEach((q) => {
          if (ids.has(q.id)) problems.push("duplicate id " + q.id);
          ids.add(q.id);
          const key = q.level + "|" + q.question + "|" + q.options.A + q.options.B + q.options.C + q.options.D;
          if (texts.has(key)) problems.push("duplicate question " + q.id);
          texts.add(key);
          const vals = LETTERS.map((L) => q.options[L]);
          if (vals.some((v) => !v)) problems.push(q.id + " has an empty option");
          if (new Set(vals.map((v) => String(v).toLowerCase())).size !== 4) problems.push(q.id + " has duplicate options");
          if (!LETTERS.includes(q.correctAnswer)) problems.push(q.id + " has an invalid correctAnswer");
          if (!q.explanation) problems.push(q.id + " has no explanation");
        });
        for (let l = 1; l <= 5; l++) if (forLevel(l).length < 10) problems.push("level " + l + " has fewer than 10 questions");
        return problems;
      }
    };
  })();
})();
