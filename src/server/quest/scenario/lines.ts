import type { QuestLanguage } from "../../../shared/voice.js";

export const FINAL_DAN_LINES: Record<QuestLanguage, string> = {
  uk: "Код 404. Двері відчинено. Дякуємо, що були з нами.",
  en: "Code 404. Door open. Thanks for being with us.",
};

export const FINAL_DOOR_LINE = FINAL_DAN_LINES.en;

export type QuestReplyId =
  | "sofia-introduced"
  | "dan-badge-asked"
  | "hoover-ordinary-rejected"
  | "hoover-clue-given"
  | "fixel-sleeping-rejected"
  | "code-revealed"
  | "code-not-revealed"
  | "door-opened"
  | "sofia-context-initial"
  | "sofia-context-after-dan"
  | "sofia-context-after-hoover"
  | "sofia-hint-initial"
  | "sofia-hint-after-dan"
  | "sofia-hint-after-hoover"
  | "sofia-hint-code-revealed"
  | "sofia-hint-after-escape"
  | "sofia-conversation-vcc"
  | "sofia-conversation-smalltalk"
  | "pre-activation-hoover-redirect"
  | "pre-activation-fixel-redirect"
  | "smalltalk-dan"
  | "smalltalk-hoover"
  | "smalltalk-fixel"
  | "smalltalk-after-escape"
  | "unknown";

export const CANNED_REPLIES: Record<QuestReplyId, Record<QuestLanguage, string>> = {
  "sofia-introduced": {
    uk: "Привіт! Я Софія, а це Ден. Івент уже згорнули, нас попросили на вихід — а двері якось заблоковані. Думаю, разом точно щось вигадаємо. Ден поруч, з нього й починай — він тут точно більше знає.",
    en: "Hi! I'm Sofiia, this is Dan. The event has wrapped and we've been asked out — and the door is somehow locked. I think together we'll figure something out. Dan is right here — start with him, he definitely knows more.",
  },
  "dan-badge-asked": {
    uk: "А, двері... ага, без бейджика їх не відчиниш. Я свій десь 'оптимізував', чесно. Слухай, тут весь час білий кіт біля мене крутився — спитай у нього, він точно бачив.",
    en: "Ah, the door... yeah, without a badge you can't open it. I 'optimized' mine away somewhere, honestly. Listen, the white cat was circling me the whole time — ask him, he definitely saw it.",
  },
  "hoover-ordinary-rejected": {
    uk: "Мяу. Hoover чує команду, але виглядає так, ніби людські накази сьогодні не в пріоритеті.",
    en: "Meow. Hoover hears the command, but looks like human orders are not today's priority.",
  },
  "hoover-clue-given": {
    uk: "Мрр. Так значно краще. Бейдж забрав Fixel і зробив із нього подушку.",
    en: "Mrr. Much better. Fixel took the badge and made it a pillow.",
  },
  "fixel-sleeping-rejected": {
    uk: "мрр-рр...",
    en: "mrr-rh...",
  },
  "code-revealed": {
    uk: "мррп.",
    en: "mrrp.",
  },
  "code-not-revealed": {
    uk: "Dan не вводить здогадки. Спершу треба побачити код на бейджі.",
    en: "Dan does not enter guesses. First the badge code needs to be visible.",
  },
  "door-opened": {
    uk: FINAL_DAN_LINES.uk,
    en: FINAL_DAN_LINES.en,
  },
  "sofia-context-initial": {
    uk: "О, ти ще тут. Спробуй поговорити з Деном — він тут найближче до дверей, з нього варто почати.",
    en: "Oh, still here. Try talking to Dan — he's the closest one to the door, that's where to start.",
  },
  "sofia-context-after-dan": {
    uk: "Як там пошук? Якщо Ден на когось показав — рухайся туди, тільки спокійно.",
    en: "How's the search? If Dan pointed at someone — go that way, just gently.",
  },
  "sofia-context-after-hoover": {
    uk: "Майже все. Десь там сцена і дуже сонна причина, чому бейдж поки мовчить.",
    en: "Almost there. Somewhere a stage — and a very sleepy reason the badge is still quiet.",
  },
  "sofia-hint-initial": {
    uk: "Я б почала з Дена. Він був із бейджиком і точно пам'ятає більше, ніж вдає.",
    en: "I'd start with Dan. He had the badge — he remembers more than he lets on.",
  },
  "sofia-hint-after-dan": {
    uk: "Якщо Ден на когось показав — звернись до нього без тиску. Коти не дуже на накази.",
    en: "If Dan pointed at someone — speak to them without pressure. Cats don't really do orders.",
  },
  "sofia-hint-after-hoover": {
    uk: "Тепер на сцену. Там хтось дуже міцно спить — спробуй розбудити.",
    en: "Now look at the stage. Someone is very deeply asleep — try waking them.",
  },
  "sofia-hint-code-revealed": {
    uk: "Код у тебе. Ден біля панелі — він має почути.",
    en: "You have the code. Dan is at the panel — he should hear it.",
  },
  "sofia-hint-after-escape": {
    uk: "Ось і все. Дякую, що були з нами — це було і про вихід, і про шлях до нього.",
    en: "And that's it. Thanks for being with us — this was about the exit, and the way to it.",
  },
  "sofia-conversation-vcc": {
    uk: "Vibe Coding Collective — це спільнота, де ми разом пробуємо робити AI-продукти. Без правил, без переможців, просто кодимо і кайфуємо.",
    en: "Vibe Coding Collective is a community where we try building AI products together. No rules, no winners — we just code and enjoy it.",
  },
  "sofia-conversation-smalltalk": {
    uk: "Я Софія. Радію, що ти тут — простір живий, коли в ньому є хтось ще.",
    en: "I'm Sofiia. Glad you're here — the space comes alive when there's someone else in it.",
  },
  "pre-activation-hoover-redirect": {
    uk: "Софія м'яко: білий кіт поки сам по собі. Думаю, варто спершу спитати в Дена — він тут не просто так.",
    en: "Sofiia gently: the white cat is on his own for now. I think it's worth asking Dan first — he's here for a reason.",
  },
  "pre-activation-fixel-redirect": {
    uk: "Софія підказує: до сплячого кота ми ще дійдемо. Спершу варто почути, що скаже білий кіт біля дверей.",
    en: "Sofiia hints: we'll get to the sleeping cat soon. First it's worth hearing what the white cat by the door has to say.",
  },
  "smalltalk-dan": {
    uk: "Слухай, ти бачив той демо з агентом, який сам пише тести? Я весь вечір думаю, що ми буквально живемо в майбутньому.",
    en: "Hey, did you catch that demo with the agent that writes its own tests? I've been thinking all evening — we literally live in the future.",
  },
  "smalltalk-hoover": {
    uk: "Мрр. Хувер дивиться поверх тебе так, ніби вже сказав усе важливе.",
    en: "Mrr. Hoover looks past you as if he's already said everything that matters.",
  },
  "smalltalk-fixel": {
    uk: "мрр...",
    en: "mrr...",
  },
  "smalltalk-after-escape": {
    uk: "Софія усміхається. Ну от — без драми, як і має бути.",
    en: "Sofiia smiles. There — no drama, just the way it should be.",
  },
  unknown: {
    uk: "Sofiia чує це як загальний сигнал. Найкраще зараз говорити з конкретним адресатом.",
    en: "Sofiia hears that as a general signal. The best move now is to speak to a specific addressee.",
  },
};

export function getFinalDoorLine(replyLanguage: QuestLanguage): string {
  return FINAL_DAN_LINES[replyLanguage];
}

export function getQuestReply(
  replyId: QuestReplyId,
  replyLanguage: QuestLanguage,
): string {
  return CANNED_REPLIES[replyId][replyLanguage] ?? CANNED_REPLIES[replyId].uk;
}
