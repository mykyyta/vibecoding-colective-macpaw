import type {
  QuestActor,
  QuestEvent,
  QuestEventType,
  QuestLanguage,
  QuestLanguageDecision,
  QuestLanguageInput,
  QuestState,
  QuestTrigger,
  VoiceAction,
} from "../shared/voice.js";

export type QuestTransitionId = QuestEventType;

export interface AllowedQuestTransition {
  id: QuestTransitionId;
  actor: QuestActor;
  allowedActors?: QuestActor[];
  description: string;
  fallbackReply: string;
}

export interface QuestTurn {
  action: VoiceAction;
  actor: QuestActor;
  event: QuestEvent;
  replyLanguage: QuestLanguage;
  reply: string;
  trigger: QuestTrigger;
  previousQuestState: QuestState;
  nextQuestState: QuestState;
}

export interface QuestTransitionTurnInput {
  transcript: string;
  questState?: Partial<QuestState>;
  transitionId: QuestTransitionId;
  actor: QuestActor;
  reply: string;
  replyLanguage?: QuestLanguage;
}

export interface QuestLanguageDecisionRequest {
  transcript: string;
  language?: QuestLanguageInput;
  previousLanguage?: QuestLanguage;
}

export const initialQuestState: QuestState = {
  olegNameKnown: false,
  guardHintGiven: false,
  pixelAddressed: false,
  pixelRejectedOrdinaryCommand: false,
  codeRevealed: false,
  doorOpen: false,
  escaped: false,
};

const DEFAULT_REPLY_LANGUAGE: QuestLanguage = "uk";
const HIGH_CONFIDENCE_LANGUAGE_THRESHOLD = 0.75;
const HEURISTIC_LANGUAGE_THRESHOLD = 0.62;
const FINAL_DOOR_OPEN_REPLY = "404 accepted. Door not found, but exit found.";

type QuestReplyId =
  | "guard-name"
  | "guard-name-needed"
  | "guard-hint"
  | "pixel-too-early"
  | "pixel-ordinary-rejected"
  | "pixel-purr-too-early"
  | "code-revealed"
  | "anonymous-code"
  | "code-not-revealed"
  | "door-opened"
  | "generic-door-known"
  | "generic-door-unknown"
  | "purr-without-pixel"
  | "purr-without-pixel-before-hint"
  | "smalltalk-deterministic"
  | "smalltalk-after-escape"
  | "smalltalk-pixel"
  | "smalltalk-guard-known"
  | "smalltalk-guard-unknown"
  | "unknown";

const QUEST_REPLIES: Record<QuestReplyId, Record<QuestLanguage, string>> = {
  "guard-name": {
    uk: "Я Олег. Після вайбкодінг івенту тут навіть бейдж проходить валідацію краще, ніж сміливий prompt.",
    en: "I'm Oleg. After the vibecoding event, even my badge validates better than a brave prompt.",
  },
  "guard-name-needed": {
    uk: "Охоронець дивиться крізь команду. Спершу непогано б дізнатися, як його звати.",
    en: "The guard looks through the command. First it would help to learn his name.",
  },
  "guard-hint": {
    uk: "Олег на місці. Вихід замкнений після вайбкодінг івенту: потрібен код, а не ще один AI-обхід; Pixel крутився біля панелі.",
    en: "Oleg is here. The exit is locked after the vibecoding event: it needs a code, not another AI workaround; Pixel was circling the panel.",
  },
  "pixel-too-early": {
    uk: "Мр? Пухнастий мешканець дивиться так, ніби ти перескочив потрібний prompt. Спершу з'ясуй у охоронця, чому двері вдають стіну.",
    en: "Mrr? The furry resident looks like you skipped a required prompt. First ask the guard why the door is pretending to be a wall.",
  },
  "pixel-ordinary-rejected": {
    uk: "Мяу. На людські prompt-и я реагую, як кіт на autocomplete: бачу, зневажаю.",
    en: "Meow. I treat human prompts like autocomplete: I see them, I judge them.",
  },
  "pixel-purr-too-early": {
    uk: "Мрр, звук правильний, але секрет ще не має адреси. Спершу розберися з дверима через охоронця.",
    en: "Mrrr, correct sound, wrong moment. First sort out the door with the guard.",
  },
  "code-revealed": {
    uk: "Мрр-р. Код 404 на моєму бейджику; нарешті не prompt engineering, а нормальне муркотіння.",
    en: "Mrrr. Code 404 is on my badge; finally, not prompt engineering, proper purring.",
  },
  "anonymous-code": {
    uk: "Охоронець не приймає коди від анонімного голосу, навіть якщо він звучить як дуже впевнений AI. Спершу треба познайомитись.",
    en: "The guard does not accept codes from an anonymous voice, even one that sounds like very confident AI. Introductions first.",
  },
  "code-not-revealed": {
    uk: "Олег не приймає галюцинації за код. Спершу отримай його від того, хто крутився біля панелі.",
    en: "Oleg does not accept hallucinations as codes. Get it first from whoever was circling the panel.",
  },
  "door-opened": {
    uk: FINAL_DOOR_OPEN_REPLY,
    en: FINAL_DOOR_OPEN_REPLY,
  },
  "generic-door-known": {
    uk: "Двері не реагують на загальні побажання. Після AI talks навіть вихід просить точний адресат.",
    en: "The door ignores general wishes. After the AI talks, even the exit wants a precise addressee.",
  },
  "generic-door-unknown": {
    uk: "Команда розчиняється в просторі. Схоже, двері не довіряють prompt-ам без контексту.",
    en: "The command dissolves into the room. Looks like the door does not trust prompts without context.",
  },
  "purr-without-pixel": {
    uk: "Мр? Гарний звук, але без адресата це просто аудіо для майбутнього датасету. Скажи Pixel.",
    en: "Mrr? Good sound, but without an addressee it's just audio for a future dataset. Say Pixel.",
  },
  "purr-without-pixel-before-hint": {
    uk: "Мр? Гарний звук, але без адресата це просто аудіо для майбутнього датасету. Спершу дізнайся, до кого тут варто звертатись.",
    en: "Mrr? Good sound, but without an addressee it's just audio for a future dataset. First learn who is worth addressing here.",
  },
  "smalltalk-deterministic": {
    uk: "MacPaw Space любить smalltalk, але вихід не став розумнішим від слова AI.",
    en: "MacPaw Space likes smalltalk, but the exit did not get smarter from the word AI.",
  },
  "smalltalk-after-escape": {
    uk: "Двері світяться скромно, ніби AI щойно вперше визнав: так, це був вихід.",
    en: "The door glows modestly, like an AI finally admitting: yes, that was the exit.",
  },
  "smalltalk-pixel": {
    uk: "Мяу. Я бачив дорожчу AI-презентацію, але ця хоча б має правильний запах.",
    en: "Meow. I've seen pricier AI presentations, but at least this one smells correct.",
  },
  "smalltalk-guard-known": {
    uk: "Олег киває. Розмова йде краще, ніж більшість відповідей без контексту.",
    en: "Oleg nods. This conversation is going better than most answers without context.",
  },
  "smalltalk-guard-unknown": {
    uk: "Охоронець ледь киває. Ввічливість помітив, доступ поки ні.",
    en: "The guard barely nods. Courtesy noticed; access still pending.",
  },
  unknown: {
    uk: "Кімната це почула й не зробила висновків. Рідкісний випадок відповідального AI.",
    en: "The room heard that and drew no conclusions. A rare case of responsible AI.",
  },
};

export function normalizeQuestState(
  state: Partial<QuestState> | null | undefined = {},
): QuestState {
  const source = state && typeof state === "object" ? state : {};
  const olegNameKnown = source.olegNameKnown === true;
  const guardHintGiven = source.guardHintGiven === true && olegNameKnown;
  const pixelAddressed = source.pixelAddressed === true && guardHintGiven;
  const pixelRejectedOrdinaryCommand =
    source.pixelRejectedOrdinaryCommand === true && pixelAddressed;
  const codeRevealed = source.codeRevealed === true && pixelAddressed;
  const doorOpen =
    source.doorOpen === true && olegNameKnown && codeRevealed;

  return {
    olegNameKnown,
    guardHintGiven,
    pixelAddressed,
    pixelRejectedOrdinaryCommand,
    codeRevealed,
    doorOpen,
    escaped: source.escaped === true && doorOpen,
  };
}

export function decideQuestLanguage({
  transcript,
  language,
  previousLanguage,
}: QuestLanguageDecisionRequest): QuestLanguageDecision {
  const providerLanguage =
    language?.language ?? parseSupportedLanguageCode(language?.providerLanguageCode);
  const confidence = clampLanguageConfidence(language?.confidence);
  const source =
    language?.source ?? (language?.providerLanguageCode ? "elevenlabs" : undefined);
  const ambiguous = isLanguageAmbiguousTranscript(transcript);

  if (
    providerLanguage &&
    confidence !== undefined &&
    confidence >= HIGH_CONFIDENCE_LANGUAGE_THRESHOLD
  ) {
    return {
      language: providerLanguage,
      source: source ?? "elevenlabs",
      confidence,
      providerLanguageCode: language?.providerLanguageCode,
      ambiguous,
    };
  }

  if (ambiguous && previousLanguage) {
    return {
      language: previousLanguage,
      source: "sticky",
      confidence,
      providerLanguageCode: language?.providerLanguageCode,
      ambiguous: true,
    };
  }

  if (ambiguous) {
    return {
      language: DEFAULT_REPLY_LANGUAGE,
      source: "default",
      confidence,
      providerLanguageCode: language?.providerLanguageCode,
      ambiguous: true,
    };
  }

  const heuristic = inferQuestLanguageFromTranscript(transcript);

  if (heuristic && heuristic.confidence >= HEURISTIC_LANGUAGE_THRESHOLD) {
    return {
      language: heuristic.language,
      source: "heuristic",
      confidence: heuristic.confidence,
      providerLanguageCode: language?.providerLanguageCode,
      ambiguous,
    };
  }

  if (providerLanguage && !ambiguous && confidence === undefined) {
    return {
      language: providerLanguage,
      source: source ?? "browser-speech",
      providerLanguageCode: language?.providerLanguageCode,
      ambiguous,
    };
  }

  return {
    language: DEFAULT_REPLY_LANGUAGE,
    source: "default",
    confidence,
    providerLanguageCode: language?.providerLanguageCode,
    ambiguous,
  };
}

export function createQuestTurn(
  transcript: string,
  questState: Partial<QuestState> = {},
  replyLanguage: QuestLanguage = DEFAULT_REPLY_LANGUAGE,
): QuestTurn {
  const previousQuestState = normalizeQuestState(questState);
  const trigger = classifyQuestTranscript(transcript);
  const nextQuestState = { ...previousQuestState };
  let actor: QuestActor = trigger.actor;
  let event: QuestEvent = { type: "no-progress", progressed: false };
  let reply = "";

  switch (trigger.type) {
    case "ask-guard-name":
      actor = "guard";
      nextQuestState.olegNameKnown = true;
      event = { type: "oleg-name-learned", progressed: true };
      reply = getQuestReply("guard-name", replyLanguage);
      break;

    case "oleg-directed-door-command":
      actor = "guard";
      if (!previousQuestState.olegNameKnown) {
        reply = getQuestReply("guard-name-needed", replyLanguage);
        break;
      }

      nextQuestState.guardHintGiven = true;
      event = { type: "guard-hint-given", progressed: true };
      reply = getQuestReply("guard-hint", replyLanguage);
      break;

    case "pixel-directed-command":
      actor = "pixel";
      if (!previousQuestState.guardHintGiven) {
        reply = getQuestReply("pixel-too-early", replyLanguage);
        break;
      }

      nextQuestState.pixelAddressed = true;
      nextQuestState.pixelRejectedOrdinaryCommand = true;
      event = { type: "pixel-ordinary-rejected", progressed: true };
      reply = getQuestReply("pixel-ordinary-rejected", replyLanguage);
      break;

    case "pixel-directed-purr":
      actor = "pixel";
      if (!previousQuestState.guardHintGiven) {
        reply = getQuestReply("pixel-purr-too-early", replyLanguage);
        break;
      }

      nextQuestState.pixelAddressed = true;
      nextQuestState.codeRevealed = true;
      event = { type: "code-revealed", progressed: true };
      reply = getQuestReply("code-revealed", replyLanguage);
      break;

    case "oleg-directed-code":
      actor = "guard";
      if (!previousQuestState.olegNameKnown) {
        reply = getQuestReply("anonymous-code", replyLanguage);
        break;
      }

      if (!previousQuestState.codeRevealed) {
        reply = getQuestReply("code-not-revealed", replyLanguage);
        break;
      }

      nextQuestState.doorOpen = true;
      nextQuestState.escaped = true;
      event = { type: "door-opened", progressed: true };
      actor = "door";
      reply = getQuestReply("door-opened", replyLanguage);
      break;

    case "generic-door-command":
      actor = "guard";
      reply = previousQuestState.olegNameKnown
        ? getQuestReply("generic-door-known", replyLanguage)
        : getQuestReply("generic-door-unknown", replyLanguage);
      break;

    case "purr-without-pixel":
      actor = "pixel";
      reply = previousQuestState.guardHintGiven
        ? getQuestReply("purr-without-pixel", replyLanguage)
        : getQuestReply("purr-without-pixel-before-hint", replyLanguage);
      break;

    case "smalltalk":
      event = { type: "smalltalk-replied", progressed: false };
      reply = getQuestReply("smalltalk-deterministic", replyLanguage);
      break;

    case "unknown":
      reply = getQuestReply("unknown", replyLanguage);
      break;
  }

  return {
    action: { type: "none" },
    actor,
    event,
    replyLanguage,
    reply,
    trigger,
    previousQuestState,
    nextQuestState,
  };
}

export function getAllowedQuestTransitions(
  questState: Partial<QuestState> = {},
  replyLanguage: QuestLanguage = DEFAULT_REPLY_LANGUAGE,
): AllowedQuestTransition[] {
  const state = normalizeQuestState(questState);
  const transitions: AllowedQuestTransition[] = [
    {
      id: "no-progress",
      actor: "system",
      description:
        "Use when the player command should not progress the puzzle, including generic door commands, premature code guesses, or unclear input.",
      fallbackReply: getQuestReply("unknown", replyLanguage),
    },
    {
      id: "smalltalk-replied",
      actor: getSmalltalkActor(state),
      allowedActors: getSmalltalkActors(state),
      description:
        "Use for harmless greetings, thanks, jokes, or smalltalk that should not progress the puzzle. Let the most relevant visible character answer: guard before Pixel is engaged, Pixel after Pixel is engaged, door after escape.",
      fallbackReply: getSmalltalkFallbackReply(state, replyLanguage),
    },
  ];

  if (!state.olegNameKnown) {
    transitions.push({
      id: "oleg-name-learned",
      actor: "guard",
      description:
        "The player asks the guard's name or who he is. This is the only transition that may reveal the guard is Oleg.",
      fallbackReply: getQuestReply("guard-name", replyLanguage),
    });
  }

  if (state.olegNameKnown && !state.guardHintGiven) {
    const eventPhrase =
      replyLanguage === "en" ? "vibecoding event" : "вайбкодінг івент";

    transitions.push({
      id: "guard-hint-given",
      actor: "guard",
      description:
        `The player directly addresses Oleg and asks him to open/unlock the door or help with the exit/code. This may reveal that the exit is locked after the ${eventPhrase} and Pixel's exit-panel clue, but not the code.`,
      fallbackReply: getQuestReply("guard-hint", replyLanguage),
    });
  }

  if (state.guardHintGiven && !state.pixelRejectedOrdinaryCommand) {
    transitions.push({
      id: "pixel-ordinary-rejected",
      actor: "pixel",
      description:
        "The player directly addresses Pixel by name with an ordinary command, request, or question, including asking for the code without making a cat sound. Pixel acknowledges the address but refuses ordinary commands.",
      fallbackReply: getQuestReply("pixel-ordinary-rejected", replyLanguage),
    });
  }

  if (state.guardHintGiven && !state.codeRevealed) {
    transitions.push({
      id: "code-revealed",
      actor: "pixel",
      description:
        "Use only when the player directly says Pixel's name or a clear Pixel alias and also performs a gentle cat sound in the same transcript, such as mur, mrr, meow, purr, pur, prr, nya/няв/мяу, or similar. Do not use for ordinary commands like asking Pixel for the code without a cat sound. This is the only transition that may reveal code 404.",
      fallbackReply: getQuestReply("code-revealed", replyLanguage),
    });
  }

  if (state.olegNameKnown && state.codeRevealed && !state.doorOpen) {
    transitions.push({
      id: "door-opened",
      actor: "door",
      description:
        "The player directly addresses Oleg and gives the already revealed code 404. This is the only transition that may open the door or mark escape. The reply should use this exact final line: 404 accepted. Door not found, but exit found.",
      fallbackReply: getQuestReply("door-opened", replyLanguage),
    });
  }

  return transitions;
}

function getSmalltalkActor(state: QuestState): QuestActor {
  if (state.doorOpen || state.escaped) {
    return "door";
  }

  if (state.pixelAddressed) {
    return "pixel";
  }

  return "guard";
}

function getSmalltalkActors(state: QuestState): QuestActor[] {
  if (state.doorOpen || state.escaped) {
    return ["door", "guard", "pixel"];
  }

  if (state.pixelAddressed) {
    return ["pixel", "guard"];
  }

  return ["guard"];
}

function getSmalltalkFallbackReply(
  state: QuestState,
  replyLanguage: QuestLanguage,
): string {
  if (state.doorOpen || state.escaped) {
    return getQuestReply("smalltalk-after-escape", replyLanguage);
  }

  if (state.pixelAddressed) {
    return getQuestReply("smalltalk-pixel", replyLanguage);
  }

  return state.olegNameKnown
    ? getQuestReply("smalltalk-guard-known", replyLanguage)
    : getQuestReply("smalltalk-guard-unknown", replyLanguage);
}

export function createQuestTurnFromTransition({
  transcript,
  questState = {},
  transitionId,
  actor,
  reply,
  replyLanguage = DEFAULT_REPLY_LANGUAGE,
}: QuestTransitionTurnInput): QuestTurn {
  const previousQuestState = normalizeQuestState(questState);
  const nextQuestState = applyQuestTransition(previousQuestState, transitionId);
  const trigger = classifyQuestTranscript(transcript);
  const progressed = !["no-progress", "smalltalk-replied"].includes(
    transitionId,
  );

  return {
    action: { type: "none" },
    actor,
    event: { type: transitionId, progressed },
    replyLanguage,
    reply,
    trigger,
    previousQuestState,
    nextQuestState,
  };
}

function applyQuestTransition(
  previousQuestState: QuestState,
  transitionId: QuestTransitionId,
): QuestState {
  const nextQuestState = { ...previousQuestState };

  switch (transitionId) {
    case "oleg-name-learned":
      nextQuestState.olegNameKnown = true;
      break;
    case "guard-hint-given":
      nextQuestState.guardHintGiven = true;
      break;
    case "pixel-ordinary-rejected":
      nextQuestState.pixelAddressed = true;
      nextQuestState.pixelRejectedOrdinaryCommand = true;
      break;
    case "code-revealed":
      nextQuestState.pixelAddressed = true;
      nextQuestState.codeRevealed = true;
      break;
    case "door-opened":
      nextQuestState.doorOpen = true;
      nextQuestState.escaped = true;
      break;
    case "no-progress":
    case "smalltalk-replied":
      break;
  }

  return nextQuestState;
}

export function classifyQuestTranscript(transcript: string): QuestTrigger {
  const text = normalizeTranscript(transcript);
  const matched: string[] = [];
  const hasOleg = includesAny(
    text,
    ["олег", "олєг", "оліг", "олек", "олеж", "олежа", "oleg", "oleh", "olek"],
    matched,
  );
  const hasPixel = includesAny(
    text,
    [
      "pixel",
      "pixels",
      "піксель",
      "пиксель",
      "піксел",
      "пиксел",
      "піксіл",
      "пиксил",
      "піксі",
      "пикси",
      "пікс",
      "пикс",
      "pix",
      "kitty",
      "kitten",
      "the cat",
      "fluffy",
      "furball",
    ],
    matched,
  );
  const hasDoor = includesAny(
    text,
    [
      "двер",
      "вихід",
      "вийти",
      "відкрий",
      "відкрити",
      "відкрийте",
      "відчин",
      "відчинити",
      "відчиніть",
      "пусти",
      "випусти",
      "замкнен",
      "локдаун",
      "open",
      "open up",
      "door",
      "exit",
      "way out",
      "let me out",
      "let us out",
      "release me",
      "unlock",
      "locked",
      "lockdown",
    ],
    matched,
  );
  const hasNameQuestion = includesAny(
    text,
    [
      "як тебе звати",
      "як вас звати",
      "як звати",
      "як тебе звуть",
      "як вас звуть",
      "як тебе зовуть",
      "як вас зовуть",
      "як звуть",
      "как тебя зовут",
      "как вас зовут",
      "звати тебе",
      "зовуть тебе",
      "твоє ім",
      "ваше ім",
      "твоє імя",
      "ваше імя",
      "твоє імʼя",
      "ваше імʼя",
      "хто ти",
      "хто ви",
      "представ",
      "your name",
      "what is your name",
      "who are you",
      "what are you called",
      "tell me your name",
      "say your name",
      "introduce yourself",
      "identify yourself",
      "name",
    ],
    matched,
  );
  const hasCode404 = includesAny(
    text,
    [
      "404",
      "чотири нуль чотири",
      "чотири ноль чотири",
      "чотириста чотири",
      "сорок чотири",
      "four zero four",
      "four oh four",
      "four o four",
      "four hundred four",
      "for zero four",
      "for oh four",
      "for o four",
    ],
    matched,
  );
  const hasCodeIntent = includesAny(
    text,
    ["код", "code", "парол", "password", "passcode", "pin"],
    matched,
  );
  const purrMatches = findPurrMatches(text);
  const hasPurr = purrMatches.length > 0;
  matched.push(...purrMatches);

  if (hasPixel && hasPurr) {
    return {
      type: "pixel-directed-purr",
      actor: "pixel",
      directAddress: true,
      matched,
    };
  }

  if (hasOleg && hasCode404) {
    return {
      type: "oleg-directed-code",
      actor: "guard",
      directAddress: true,
      matched,
    };
  }

  if (hasOleg && (hasDoor || hasCodeIntent)) {
    return {
      type: "oleg-directed-door-command",
      actor: "guard",
      directAddress: true,
      matched,
    };
  }

  if (hasPixel) {
    return {
      type: "pixel-directed-command",
      actor: "pixel",
      directAddress: true,
      matched,
    };
  }

  if (hasNameQuestion) {
    return {
      type: "ask-guard-name",
      actor: "guard",
      directAddress: false,
      matched,
    };
  }

  if (hasDoor) {
    return {
      type: "generic-door-command",
      actor: "guard",
      directAddress: false,
      matched,
    };
  }

  if (hasPurr) {
    return {
      type: "purr-without-pixel",
      actor: "pixel",
      directAddress: false,
      matched,
    };
  }

  if (
    includesAny(
      text,
      [
        "привіт",
        "дякую",
        "як справи",
        "hello",
        "hi",
        "thanks",
        "thank you",
        "how are you",
        "hey",
        "good morning",
        "good afternoon",
        "good evening",
        "please",
        "nice to meet you",
      ],
      matched,
    )
  ) {
    return {
      type: "smalltalk",
      actor: "system",
      directAddress: false,
      matched,
    };
  }

  return {
    type: "unknown",
    actor: "system",
    directAddress: false,
    matched,
  };
}

function normalizeTranscript(transcript: string): string {
  return transcript
    .toLocaleLowerCase("uk-UA")
    .normalize("NFKC")
    .replace(/[ʼ'`]/g, "")
    .replace(/[.,!?;:()[\]{}"]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function includesAny(
  text: string,
  needles: string[],
  matched: string[],
): boolean {
  let found = false;

  for (const needle of needles) {
    if (text.includes(needle)) {
      matched.push(needle);
      found = true;
    }
  }

  return found;
}

function findPurrMatches(text: string): string[] {
  const matches = text.matchAll(
    /(?:^|\s)(мур+|мурк\w*|м(?:[\s-]?р)+|мр+|мяу+|мяв+|м[\s-]?я[\s-]?у+|няу+|няв+|н[\s-]?я[\s-]?у+|пур+|пурр+|пр+|purr+|purring|pur+|mur+|meow+|meowing|mew+|mrow+|nya+|nyan+|m(?:[\s-]?r)+|m[\s-]?e[\s-]?o[\s-]?w+|prr+)(?=\s|$)/g,
  );

  return [...matches].map((match) => match[1]).filter(Boolean);
}

function getQuestReply(
  replyId: QuestReplyId,
  replyLanguage: QuestLanguage,
): string {
  return QUEST_REPLIES[replyId][replyLanguage] ?? QUEST_REPLIES[replyId].uk;
}

function parseSupportedLanguageCode(
  languageCode: string | undefined,
): QuestLanguage | undefined {
  const normalized = languageCode?.toLocaleLowerCase("en-US").trim();

  if (!normalized) {
    return undefined;
  }

  if (normalized === "uk" || normalized.startsWith("uk-")) {
    return "uk";
  }

  if (normalized === "en" || normalized.startsWith("en-")) {
    return "en";
  }

  return undefined;
}

function clampLanguageConfidence(
  confidence: number | undefined,
): number | undefined {
  if (confidence === undefined || Number.isNaN(confidence)) {
    return undefined;
  }

  return Math.max(0, Math.min(1, confidence));
}

function isLanguageAmbiguousTranscript(transcript: string): boolean {
  const text = normalizeTranscript(transcript);

  if (!text) {
    return true;
  }

  const words = text.split(" ");
  const compact = text.replace(/\s+/g, "");
  const ambiguousTokens = new Set([
    "404",
    "pixel",
    "pix",
    "oleg",
    "oleh",
    "мур",
    "мр",
    "мрр",
    "няв",
    "мяу",
    "purr",
    "prr",
    "mrr",
    "meow",
    "mew",
  ]);

  if (words.length <= 2 && words.every((word) => ambiguousTokens.has(word))) {
    return true;
  }

  return (
    words.length <= 3 &&
    (compact === "404" || findPurrMatches(text).length > 0) &&
    !/[іїєґа-я]/u.test(text.replace(/мур|мр+|мяу|няв/gu, ""))
  );
}

function inferQuestLanguageFromTranscript(
  transcript: string,
): { language: QuestLanguage; confidence: number } | undefined {
  const text = normalizeTranscript(transcript);

  if (!text) {
    return undefined;
  }

  let ukScore = 0;
  let enScore = 0;

  if (/[іїєґ]/u.test(text)) {
    ukScore += 4;
  }

  if (/[а-я]/u.test(text)) {
    ukScore += 2;
  }

  if (/\b(як|тебе|вас|звати|хто|відкрий|відчин|двер|вихід|код|дякую|привіт)\b/u.test(text)) {
    ukScore += 3;
  }

  if (/[a-z]/u.test(text)) {
    enScore += 1;
  }

  if (
    /\b(what|who|your|name|open|door|exit|unlock|code|hello|thanks|please|let|out|guard)\b/u.test(
      text,
    )
  ) {
    enScore += 3;
  }

  if (ukScore === 0 && enScore === 0) {
    return undefined;
  }

  if (ukScore === enScore) {
    return undefined;
  }

  const total = ukScore + enScore;
  const language = ukScore > enScore ? "uk" : "en";
  const confidence = Math.max(ukScore, enScore) / total;

  return { language, confidence };
}
