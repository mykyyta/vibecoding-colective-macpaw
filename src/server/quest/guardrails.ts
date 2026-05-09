import type { QuestState } from "../../shared/voice.js";
import type { QuestTransitionId } from "./transitions.js";

// QuestTurn shape reproduced to avoid a circular import with index.ts.
// TypeScript structural typing makes this compatible with the real QuestTurn.
interface QuestTurnForGuardrail {
  actor: string;
  reply: string;
  event: { type: QuestTransitionId };
  previousQuestState: QuestState;
  nextQuestState: QuestState;
}

const MAX_REPLY_LENGTH = 320;
const MAX_SOFIA_REPLY_LENGTH = 220;

export function requiresOlegNameInReply(eventType: QuestTransitionId): boolean {
  return eventType === "oleg-name-learned";
}

export function isPrematureSofiaCatLanguageHint(
  turn: QuestTurnForGuardrail,
): boolean {
  return (
    turn.event.type === "sofia-hint-given" &&
    turn.previousQuestState.guardHintGiven &&
    !turn.previousQuestState.pixelRejectedOrdinaryCommand &&
    containsCatSoundOrLanguageHint(turn.reply)
  );
}

export function isAllowedQuestBrainReply(turn: QuestTurnForGuardrail): boolean {
  const { actor, reply, nextQuestState: state } = turn;

  if (!reply || reply.length > MAX_REPLY_LENGTH) {
    return false;
  }

  if (!state.olegNameKnown && containsOlegReveal(reply)) {
    return false;
  }

  if (!state.guardHintGiven && containsPixelKeypadClue(reply)) {
    return false;
  }

  if (!state.guardHintGiven && containsPixelNameReveal(reply)) {
    return false;
  }

  if (
    actor !== "pixel" &&
    !state.guardHintGiven &&
    containsCatSoundOrLanguageHint(reply)
  ) {
    return false;
  }

  if (!state.codeRevealed && containsCodeReveal(reply)) {
    return false;
  }

  if (!state.doorOpen && containsDoorOpenClaim(reply)) {
    return false;
  }

  return true;
}

export function isAllowedSofiaReply(
  reply: string,
  _eventType: QuestTransitionId,
): boolean {
  if (reply.length > MAX_SOFIA_REPLY_LENGTH || /[?？]/u.test(reply)) {
    return false;
  }

  const text = normalizeForGuardrail(reply);
  const hasEventRecapJoke =
    /(івент|ивент|event).{0,80}(сподобав|сподобалось|сподобався|заліг|застряг|застрягл|stuck|liked|enjoy)/u.test(
      text,
    ) ||
    /(сподобав|сподобалось|сподобався|заліг|застряг|застрягл|stuck|liked|enjoy).{0,80}(івент|ивент|event)/u.test(
      text,
    ) ||
    text.includes("фінальний вайб");

  if (hasEventRecapJoke) {
    return false;
  }

  return ![
    "як тобі",
    "як вам",
    "як ти",
    "як ви",
    "чи ти",
    "чи ви",
    "що ти хочеш",
    "що ви хочете",
    "what do you",
    "what would you",
    "how are you",
    "how was",
    "how do you",
    "do you want",
    "would you",
    "did you",
  ].some((phrase) => text.includes(phrase));
}

export function replyPassesGuardrails(turn: QuestTurnForGuardrail): boolean {
  if (
    requiresOlegNameInReply(turn.event.type) &&
    !containsOlegReveal(turn.reply)
  ) {
    return false;
  }

  if (
    turn.event.type === "guard-hint-given" &&
    !containsPixelNameReveal(turn.reply)
  ) {
    return false;
  }

  if (isPrematureSofiaCatLanguageHint(turn)) {
    return false;
  }

  if (!isAllowedQuestBrainReply(turn)) {
    return false;
  }

  if (
    turn.actor === "sofia" &&
    !isAllowedSofiaReply(turn.reply, turn.event.type)
  ) {
    return false;
  }

  return true;
}

export function containsOlegReveal(reply: string): boolean {
  const text = normalizeForGuardrail(reply);

  return /\b(олег|олєг|оліг|oleg|oleh)\b/u.test(text);
}

export function containsPixelKeypadClue(reply: string): boolean {
  const text = normalizeForGuardrail(reply);

  return (
    /\b(pixel|піксел\w*|пиксел\w*).{0,80}\b(keypad|код|парол|клавіатур|панел)/u.test(
      text,
    ) ||
    /\b(keypad|код|парол|клавіатур|панел).{0,80}\b(pixel|піксел\w*|пиксел\w*)/u.test(
      text,
    )
  );
}

export function containsPixelNameReveal(reply: string): boolean {
  const text = normalizeForGuardrail(reply);

  return (
    /(^|[^\p{L}\p{N}_])(pixel|піксель|пиксель|піксел|пиксел|пікс|пикс)(?=$|[^\p{L}\p{N}_])/u.test(text) ||
    /(^|[^\p{L}\p{N}_])(моє|моєму|моїм|my)\s+ім/u.test(text) ||
    /(знаєш|вгадав|назвав|назвала|said|guessed).{0,30}(ім|name)/u.test(text) ||
    /(мене|me).{0,20}(звати|called)/u.test(text)
  );
}

export function containsCatSoundOrLanguageHint(reply: string): boolean {
  const text = normalizeForGuardrail(reply);

  return (
    /(по-котяч|котяч|його мов|її мов|own language|мур|мяу|няв|purr|meow|cat sound)/u.test(text) ||
    /(^|[^\p{L}\p{N}_])мр+(?=$|[^\p{L}\p{N}_])/u.test(text)
  );
}

export function containsCodeReveal(reply: string): boolean {
  const text = normalizeForGuardrail(reply);

  return (
    /(^|[^\d])404([^\d]|$)/u.test(text) ||
    text.includes("чотири нуль чотири") ||
    text.includes("чотири ноль чотири") ||
    text.includes("чотириста чотири") ||
    text.includes("four zero four") ||
    text.includes("four oh four") ||
    text.includes("four o four") ||
    text.includes("four hundred four")
  );
}

export function containsDoorOpenClaim(reply: string): boolean {
  const text = normalizeForGuardrail(reply);
  const doorNearOpen =
    /двер\S*.{0,50}(відчин|відкри|розблок|open|unlock)/u.test(text) ||
    /(відчин|відкри|розблок|open|unlock).{0,50}двер/u.test(text) ||
    /door.{0,50}(open|unlock)/u.test(text) ||
    /(open|unlock).{0,50}door/u.test(text);
  const escapeClaim =
    /(можеш|можна|час)\s+виход/u.test(text) ||
    /(ти|тебе).{0,30}(вийш|випуст|escaped|escape)/u.test(text) ||
    /\b(you can|time to|free to).{0,30}(leave|exit|go out)\b/u.test(text) ||
    /\b(let|lets).{0,20}(you|player).{0,20}out\b/u.test(text);

  return doorNearOpen || escapeClaim;
}

export function normalizeForGuardrail(reply: string): string {
  return reply
    .toLocaleLowerCase("uk-UA")
    .normalize("NFKC")
    .replace(/\s+/gu, " ")
    .trim();
}
