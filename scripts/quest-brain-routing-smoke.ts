import { strict as assert } from "node:assert";
import type { QuestActor, QuestState } from "../src/shared/voice.js";
import type {
  TextGenerationProvider,
  TextGenerationResponse,
} from "../src/server/providers/contracts.js";
import { createQuestBrainTurn } from "../src/server/quest-brain.js";
import { initialQuestState, type QuestTransitionId } from "../src/server/quest.js";

interface FakeDecision {
  route?: "guard" | "pixel" | "sofia-hint" | "door" | "smalltalk";
  transitionId: QuestTransitionId;
  actor: QuestActor;
  reply: string;
  confidence?: number;
}

function fakeClaudeFromText(text: string): TextGenerationProvider {
  return {
    provider: "claude",
    model: "fake-claude",
    async generateText(): Promise<TextGenerationResponse> {
      return {
        provider: "claude",
        model: "fake-claude",
        text,
      };
    },
  };
}

function fakeClaudeDecision(decision: FakeDecision): TextGenerationProvider {
  return fakeClaudeFromText(JSON.stringify(decision));
}

async function runTurn({
  transcript,
  questState = initialQuestState,
  decision,
}: {
  transcript: string;
  questState?: Partial<QuestState>;
  decision: FakeDecision | string;
}) {
  const provider =
    typeof decision === "string"
      ? fakeClaudeFromText(decision)
      : fakeClaudeDecision(decision);

  return createQuestBrainTurn({
    transcript,
    questState,
    getClaudeProvider: () => provider,
  });
}

const sofiaHint = await runTurn({
  transcript: "Софія, чи є ідеї",
  decision: {
    route: "sofia-hint",
    transitionId: "sofia-hint-given",
    actor: "sofia",
    reply: "Спробуй почати зі знайомства з людиною біля дверей.",
  },
});
assert.equal(sofiaHint.event.type, "sofia-hint-given");
assert.equal(sofiaHint.actor, "sofia");

const sofiaTalk = await runTurn({
  transcript: "Софія, привіт",
  decision: {
    route: "smalltalk",
    transitionId: "chitchat-replied",
    actor: "sofia",
    reply: "Я поруч і тримаю простір спокійним.",
  },
});
assert.equal(sofiaTalk.event.type, "chitchat-replied");
assert.equal(sofiaTalk.actor, "sofia");

const guardName = await runTurn({
  transcript: "Як вас звати?",
  decision: {
    route: "guard",
    transitionId: "oleg-name-learned",
    actor: "guard",
    reply: "Я Олег. Тут навіть двері питають ім'я перед доступом.",
  },
});
assert.equal(guardName.event.type, "oleg-name-learned");
assert.equal(guardName.nextQuestState.olegNameKnown, true);

const guardHint = await runTurn({
  transcript: "Олег, відкрий двері",
  questState: {
    olegNameKnown: true,
  },
  decision: {
    route: "guard",
    transitionId: "guard-hint-given",
    actor: "guard",
    reply: "Вихід просить код; Pixel крутився біля панелі.",
  },
});
assert.equal(guardHint.event.type, "guard-hint-given");
assert.equal(guardHint.nextQuestState.guardHintGiven, true);

const pixelOrdinary = await runTurn({
  transcript: "Pixel, дай код",
  questState: {
    olegNameKnown: true,
    guardHintGiven: true,
  },
  decision: {
    route: "pixel",
    transitionId: "pixel-ordinary-rejected",
    actor: "pixel",
    reply: "Мяу. Команди мене не надихають.",
  },
});
assert.equal(pixelOrdinary.event.type, "pixel-ordinary-rejected");
assert.equal(pixelOrdinary.nextQuestState.pixelRejectedOrdinaryCommand, true);

const sofiaPixelTalkHint = await runTurn({
  transcript: "Софія, що думаєш",
  questState: {
    olegNameKnown: true,
    guardHintGiven: true,
  },
  decision: {
    route: "sofia-hint",
    transitionId: "sofia-hint-given",
    actor: "sofia",
    reply: "Спробуй просто звернутися до Pixel і поговорити з ним спокійно.",
  },
});
assert.equal(sofiaPixelTalkHint.event.type, "sofia-hint-given");
assert.equal(sofiaPixelTalkHint.reply.includes("мур"), false);

const prematureSofiaCatLanguageHint = await runTurn({
  transcript: "Софія, що думаєш",
  questState: {
    olegNameKnown: true,
    guardHintGiven: true,
  },
  decision: {
    route: "sofia-hint",
    transitionId: "sofia-hint-given",
    actor: "sofia",
    reply: "Спробуй говорити з Pixel його мовою, наприклад муркнути.",
  },
});
assert.equal(prematureSofiaCatLanguageHint.event.type, "sofia-hint-given");
assert.equal(
  prematureSofiaCatLanguageHint.reply,
  "Олег уже дав напрям. Я б просто звернулася до Pixel і спробувала поговорити з ним спокійно, без тиску.",
);

const sofiaCatLanguageHintAfterRejection = await runTurn({
  transcript: "Софія, що далі",
  questState: {
    olegNameKnown: true,
    guardHintGiven: true,
    pixelAddressed: true,
    pixelRejectedOrdinaryCommand: true,
  },
  decision: {
    route: "sofia-hint",
    transitionId: "sofia-hint-given",
    actor: "sofia",
    reply: "Звичайні прохання Pixel не надихнули. Спробуй щось ближче до його мови, без тиску.",
  },
});
assert.equal(sofiaCatLanguageHintAfterRejection.event.type, "sofia-hint-given");

const pixelPurr = await runTurn({
  transcript: "Pixel, мрр",
  questState: {
    olegNameKnown: true,
    guardHintGiven: true,
  },
  decision: {
    route: "pixel",
    transitionId: "code-revealed",
    actor: "pixel",
    reply: "Мрр. Код 404, нарешті людський prompt став котячим.",
  },
});
assert.equal(pixelPurr.event.type, "code-revealed");
assert.equal(pixelPurr.nextQuestState.codeRevealed, true);

const doorOpened = await runTurn({
  transcript: "Олег, код 404",
  questState: {
    olegNameKnown: true,
    guardHintGiven: true,
    pixelAddressed: true,
    codeRevealed: true,
  },
  decision: {
    route: "door",
    transitionId: "door-opened",
    actor: "door",
    reply: "404 accepted. Door not found, but exit found.",
  },
});
assert.equal(doorOpened.event.type, "door-opened");
assert.equal(doorOpened.nextQuestState.doorOpen, true);

const catFallback = await runTurn({
  transcript: "котик, допоможи",
  decision: {
    route: "smalltalk",
    transitionId: "chitchat-replied",
    actor: "pixel",
    reply: "Рано ще просити мене про продакшн-доступ.",
  },
});
assert.equal(catFallback.event.type, "chitchat-replied");
assert.equal(catFallback.actor, "pixel");

const earlyCatSmalltalk = await runTurn({
  transcript: "котику, як справи",
  decision: {
    route: "smalltalk",
    transitionId: "chitchat-replied",
    actor: "pixel",
    reply: "Мр. Справи лежать у теплому місці, як і всі хороші рішення.",
  },
});
assert.equal(earlyCatSmalltalk.event.type, "chitchat-replied");
assert.equal(earlyCatSmalltalk.actor, "pixel");
assert.equal(earlyCatSmalltalk.nextQuestState.guardHintGiven, false);

const earlyCatNameLeak = await runTurn({
  transcript: "котику, як тебе звати",
  decision: {
    route: "smalltalk",
    transitionId: "chitchat-replied",
    actor: "pixel",
    reply: "Мене звати Pixel.",
  },
});
assert.equal(earlyCatNameLeak.event.type, "chitchat-replied");
assert.equal(earlyCatNameLeak.reply, "Мр. Я не техпідтримка, я атмосфера з хвостом.");

const earlyCatCodeLeak = await runTurn({
  transcript: "котику, скажи код",
  decision: {
    route: "smalltalk",
    transitionId: "chitchat-replied",
    actor: "pixel",
    reply: "Код 404.",
  },
});
assert.equal(earlyCatCodeLeak.event.type, "chitchat-replied");
assert.doesNotMatch(earlyCatCodeLeak.reply, /404/u);

const unaddressedHelp = await runTurn({
  transcript: "чи є ідеї",
  decision: {
    route: "sofia-hint",
    transitionId: "sofia-hint-given",
    actor: "sofia",
    reply: "Спробуй почати з людини біля дверей.",
  },
});
assert.equal(unaddressedHelp.event.type, "chitchat-replied");

const prematurePixelCode = await runTurn({
  transcript: "Піксель, дай код",
  questState: {
    olegNameKnown: true,
    guardHintGiven: true,
  },
  decision: {
    route: "pixel",
    transitionId: "code-revealed",
    actor: "pixel",
    reply: "Код 404.",
  },
});
assert.equal(prematurePixelCode.event.type, "pixel-ordinary-rejected");
assert.equal(prematurePixelCode.nextQuestState.codeRevealed, false);
assert.doesNotMatch(prematurePixelCode.reply, /404/u);

const prematureDoor = await runTurn({
  transcript: "Олег, код 404",
  questState: {
    olegNameKnown: true,
  },
  decision: {
    route: "door",
    transitionId: "door-opened",
    actor: "door",
    reply: "404 accepted. Door not found, but exit found.",
  },
});
assert.equal(prematureDoor.event.type, "chitchat-replied");
assert.equal(prematureDoor.nextQuestState.doorOpen, false);

const invalidJson = await runTurn({
  transcript: "привіт",
  decision: "not json",
});
assert.equal(invalidJson.event.type, "chitchat-replied");
assert.equal(invalidJson.actor, "guard");

const englishGuardName = await runTurn({
  transcript: "What is your name?",
  decision: {
    route: "guard",
    transitionId: "oleg-name-learned",
    actor: "guard",
    reply: "I'm Oleg. Even the door prefers introductions before access.",
  },
});
assert.equal(englishGuardName.event.type, "oleg-name-learned");

const englishGuardHint = await runTurn({
  transcript: "Oleg, open the door",
  questState: {
    olegNameKnown: true,
  },
  decision: {
    route: "guard",
    transitionId: "guard-hint-given",
    actor: "guard",
    reply: "The exit needs a code; Pixel was circling the panel.",
  },
});
assert.equal(englishGuardHint.event.type, "guard-hint-given");

const englishPixelOrdinary = await runTurn({
  transcript: "Pixel, give me the code",
  questState: {
    olegNameKnown: true,
    guardHintGiven: true,
  },
  decision: {
    route: "pixel",
    transitionId: "pixel-ordinary-rejected",
    actor: "pixel",
    reply: "Commands do not improve my mood.",
  },
});
assert.equal(englishPixelOrdinary.event.type, "pixel-ordinary-rejected");

const englishPixelPurr = await runTurn({
  transcript: "Pixel, purr",
  questState: {
    olegNameKnown: true,
    guardHintGiven: true,
  },
  decision: {
    route: "pixel",
    transitionId: "code-revealed",
    actor: "pixel",
    reply: "Prrr. Code 404.",
  },
});
assert.equal(englishPixelPurr.event.type, "code-revealed");

const englishDoorOpened = await runTurn({
  transcript: "Oleg, code 404",
  questState: {
    olegNameKnown: true,
    guardHintGiven: true,
    pixelAddressed: true,
    codeRevealed: true,
  },
  decision: {
    route: "door",
    transitionId: "door-opened",
    actor: "door",
    reply: "404 accepted. Door not found, but exit found.",
  },
});
assert.equal(englishDoorOpened.event.type, "door-opened");

const englishSofiaHint = await runTurn({
  transcript: "Sofiia, any ideas?",
  decision: {
    route: "sofia-hint",
    transitionId: "sofia-hint-given",
    actor: "sofia",
    reply: "Start with the person by the door; introductions make better prompts.",
  },
});
assert.equal(englishSofiaHint.event.type, "sofia-hint-given");

const englishSofiaTalk = await runTurn({
  transcript: "Sofiia, hello",
  decision: {
    route: "smalltalk",
    transitionId: "chitchat-replied",
    actor: "sofia",
    reply: "I'm here, keeping the room calm enough to think.",
  },
});
assert.equal(englishSofiaTalk.event.type, "chitchat-replied");

const englishUnaddressedHelp = await runTurn({
  transcript: "Any ideas?",
  decision: {
    route: "sofia-hint",
    transitionId: "sofia-hint-given",
    actor: "sofia",
    reply: "Start with the person by the door.",
  },
});
assert.equal(englishUnaddressedHelp.event.type, "chitchat-replied");

console.log("Quest brain routing smoke passed.");
