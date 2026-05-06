import type {
  QuestActor,
  QuestEvent,
  QuestEventType,
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

export function createQuestTurn(
  transcript: string,
  questState: Partial<QuestState> = {},
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
      reply =
        "Я Олег. Не просто охоронець, а останній middleware між тобою і виходом.";
      break;

    case "oleg-directed-door-command":
      actor = "guard";
      if (!previousQuestState.olegNameKnown) {
        reply =
          "Охоронець дивиться крізь команду. Спершу непогано б дізнатися, як його звати.";
        break;
      }

      nextQuestState.guardHintGiven = true;
      event = { type: "guard-hint-given", progressed: true };
      reply =
        "Олег тут. Двері у demo lockdown: потрібен код. Pixel останнім крутився біля keypad, і це не комплімент.";
      break;

    case "pixel-directed-command":
      actor = "pixel";
      if (!previousQuestState.guardHintGiven) {
        reply =
          "Мр? Я Pixel, не декор на сходах. Спершу з'ясуй у охоронця, чому мої лапи взагалі важливі.";
        break;
      }

      nextQuestState.pixelAddressed = true;
      nextQuestState.pixelRejectedOrdinaryCommand = true;
      event = { type: "pixel-ordinary-rejected", progressed: true };
      reply =
        "Мяу. Звичайні команди дряпають мій firewall і падають на підлогу.";
      break;

    case "pixel-directed-purr":
      actor = "pixel";
      if (!previousQuestState.guardHintGiven) {
        reply =
          "Мрр, звук правильний, але секрет ще не має адреси. Спершу розберися з дверима через охоронця.";
        break;
      }

      nextQuestState.pixelAddressed = true;
      nextQuestState.codeRevealed = true;
      event = { type: "code-revealed", progressed: true };
      reply =
        "Мрр-р. Код на моєму бейджику: 404. Не питай, я сам це не деплоїв.";
      break;

    case "oleg-directed-code":
      actor = "guard";
      if (!previousQuestState.olegNameKnown) {
        reply =
          "Охоронець не приймає код від незнайомого процесу. Спершу треба познайомитись.";
        break;
      }

      if (!previousQuestState.codeRevealed) {
        reply =
          "Олег не відкриває двері на вгадування. Спершу отримай код від того, хто сидів біля keypad.";
        break;
      }

      nextQuestState.doorOpen = true;
      nextQuestState.escaped = true;
      event = { type: "door-opened", progressed: true };
      actor = "door";
      reply = "404 accepted. Door not found, but exit found.";
      break;

    case "generic-door-command":
      actor = "guard";
      reply = previousQuestState.olegNameKnown
        ? "Двері не реагують на загальні побажання. Олег любить, коли до нього звертаються по імені."
        : "Команда розчиняється в просторі. Схоже, двері слухають тільки того, з ким ти вже познайомився.";
      break;

    case "purr-without-pixel":
      actor = "pixel";
      reply =
        "Мр? Це було в повітря. Назви мене Pixel, тоді муркотіння матиме адресата.";
      break;

    case "smalltalk":
      event = { type: "smalltalk-replied", progressed: false };
      reply =
        "MacPaw Space підтримує smalltalk. Двері чемно роблять вигляд, що це не до них.";
      break;

    case "unknown":
      reply = "Кімната почула звук, подумала секунду і нічого не зламала.";
      break;
  }

  return {
    action: { type: "none" },
    actor,
    event,
    reply,
    trigger,
    previousQuestState,
    nextQuestState,
  };
}

export function getAllowedQuestTransitions(
  questState: Partial<QuestState> = {},
): AllowedQuestTransition[] {
  const state = normalizeQuestState(questState);
  const transitions: AllowedQuestTransition[] = [
    {
      id: "no-progress",
      actor: "system",
      description:
        "Use when the player command should not progress the puzzle, including generic door commands, premature code guesses, or unclear input.",
      fallbackReply: "Кімната почула звук, подумала секунду і нічого не зламала.",
    },
    {
      id: "smalltalk-replied",
      actor: getSmalltalkActor(state),
      allowedActors: getSmalltalkActors(state),
      description:
        "Use for harmless greetings, thanks, jokes, or smalltalk that should not progress the puzzle. Let the most relevant visible character answer: guard before Pixel is engaged, Pixel after Pixel is engaged, door after escape.",
      fallbackReply: getSmalltalkFallbackReply(state),
    },
  ];

  if (!state.olegNameKnown) {
    transitions.push({
      id: "oleg-name-learned",
      actor: "guard",
      description:
        "The player asks the guard's name or who he is. This is the only transition that may reveal the guard is Oleg.",
      fallbackReply:
        "Я Олег. Не просто охоронець, а останній middleware між тобою і виходом.",
    });
  }

  if (state.olegNameKnown && !state.guardHintGiven) {
    transitions.push({
      id: "guard-hint-given",
      actor: "guard",
      description:
        "The player directly addresses Oleg and asks him to open/unlock the door or help with the exit/code. This may reveal demo lockdown and Pixel's keypad clue, but not the code.",
      fallbackReply:
        "Олег тут. Двері у demo lockdown: потрібен код. Pixel останнім крутився біля keypad, і це не комплімент.",
    });
  }

  if (state.guardHintGiven && !state.pixelRejectedOrdinaryCommand) {
    transitions.push({
      id: "pixel-ordinary-rejected",
      actor: "pixel",
      description:
        "The player directly addresses Pixel by name with an ordinary command, request, or question, including asking for the code without making a cat sound. Pixel acknowledges the address but refuses ordinary commands.",
      fallbackReply:
        "Мяу. Звичайні команди дряпають мій firewall і падають на підлогу.",
    });
  }

  if (state.guardHintGiven && !state.codeRevealed) {
    transitions.push({
      id: "code-revealed",
      actor: "pixel",
      description:
        "Use only when the player directly says Pixel's name or a clear Pixel alias and also performs a gentle cat sound in the same transcript, such as mur, mrr, meow, purr, pur, prr, nya/няв/мяу, or similar. Do not use for ordinary commands like asking Pixel for the code without a cat sound. This is the only transition that may reveal code 404.",
      fallbackReply:
        "Мрр-р. Код на моєму бейджику: 404. Не питай, я сам це не деплоїв.",
    });
  }

  if (state.olegNameKnown && state.codeRevealed && !state.doorOpen) {
    transitions.push({
      id: "door-opened",
      actor: "door",
      description:
        "The player directly addresses Oleg and gives the already revealed code 404. This is the only transition that may open the door or mark escape. The reply should use this exact final line: 404 accepted. Door not found, but exit found.",
      fallbackReply: "404 accepted. Door not found, but exit found.",
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

function getSmalltalkFallbackReply(state: QuestState): string {
  if (state.doorOpen || state.escaped) {
    return "Двері тихо сяють, ніби теж хочуть сказати: демо закрите красиво.";
  }

  if (state.pixelAddressed) {
    return "Мяу. Я бачила дорожчу презентацію, але ця хоча б має правильний запах.";
  }

  return state.olegNameKnown
    ? "Олег киває. Smalltalk прийнято, двері все ще в режимі принципової безпеки."
    : "Охоронець ледь киває. Ввічливість прийнято, доступ ще ні.";
}

export function createQuestTurnFromTransition({
  transcript,
  questState = {},
  transitionId,
  actor,
  reply,
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
    ["олег", "олєг", "оліг", "олек", "олеж", "олежа", "oleg", "olek"],
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
      "door",
      "exit",
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
      "four hundred four",
    ],
    matched,
  );
  const hasCodeIntent = includesAny(
    text,
    ["код", "code", "парол", "password"],
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
    /(?:^|\s)(мур+|мурк\w*|м(?:[\s-]?р)+|мр+|мяу+|мяв+|м[\s-]?я[\s-]?у+|няу+|няв+|н[\s-]?я[\s-]?у+|пур+|пурр+|пр+|purr+|pur+|mur+|meow+|mew+|m(?:[\s-]?r)+|m[\s-]?e[\s-]?o[\s-]?w+|prr+)(?=\s|$)/g,
  );

  return [...matches].map((match) => match[1]).filter(Boolean);
}
