import type {
  QuestActor,
  QuestEvent,
  QuestState,
  QuestTrigger,
  VoiceAction,
} from "../shared/voice.js";

export interface QuestTurn {
  action: VoiceAction;
  actor: QuestActor;
  event: QuestEvent;
  reply: string;
  trigger: QuestTrigger;
  previousQuestState: QuestState;
  nextQuestState: QuestState;
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

  return {
    olegNameKnown: source.olegNameKnown === true,
    guardHintGiven: source.guardHintGiven === true,
    pixelAddressed: source.pixelAddressed === true,
    pixelRejectedOrdinaryCommand: source.pixelRejectedOrdinaryCommand === true,
    codeRevealed: source.codeRevealed === true,
    doorOpen: source.doorOpen === true,
    escaped: source.escaped === true,
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
      nextQuestState.pixelAddressed = true;
      nextQuestState.pixelRejectedOrdinaryCommand = true;
      event = { type: "pixel-ordinary-rejected", progressed: true };
      reply =
        "Pixel кліпає так, ніби звичайні команди проходять повз його персональний firewall.";
      break;

    case "pixel-directed-purr":
      actor = "pixel";
      nextQuestState.pixelAddressed = true;
      nextQuestState.codeRevealed = true;
      event = { type: "code-revealed", progressed: true };
      reply =
        "Pixel мружиться. На бейджику біля лапи проявляється код: 404. Дуже продуктовий спосіб втекти.";
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
      reply =
        "Олег вводить 404. Двері визнають власну помилку, відчиняються, і MacPaw Space випускає тебе назовні.";
      break;

    case "generic-door-command":
      actor = "guard";
      reply = previousQuestState.olegNameKnown
        ? "Двері не реагують на загальні побажання. Олег любить, коли до нього звертаються по імені."
        : "Команда розчиняється в просторі. Схоже, двері слухають тільки того, з ким ти вже познайомився.";
      break;

    case "purr-without-pixel":
      actor = "pixel";
      if (previousQuestState.pixelAddressed) {
        nextQuestState.codeRevealed = true;
        event = { type: "code-revealed", progressed: true };
        reply =
          "Pixel впізнає муркотіння навіть без повторного тегу в задачі. Код: 404.";
        break;
      }

      reply =
        "Десь під сходами чути хвіст. Спочатку звернись до Pixel, тоді муркотіння матиме адресата.";
      break;

    case "smalltalk":
      event = { type: "smalltalk-replied", progressed: false };
      reply =
        "MacPaw Space підтримує smalltalk, але двері від цього не стають менш locked.";
      break;

    case "unknown":
      reply =
        previousQuestState.olegNameKnown
          ? "Я почув репліку, але квест не зрушив. Спробуй звернутися по імені: Олег, відкрий двері."
          : "Я почув репліку, але квест не зрушив. Почни з простого питання: як тебе звати?";
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
    /(?:^|\s)(мур+|мурк\w*|м(?:-?р)+|мяу+|няу+|purr+|pur+|mur+|m(?:-?r)+|prr+)(?=\s|$)/g,
  );

  return [...matches].map((match) => match[1]).filter(Boolean);
}
