import type { QuestLanguage } from "../../../shared/voice.js";

export const FINAL_DAN_LINES: Record<QuestLanguage, string> = {
  uk: "Код 404. Двері відчинено. Дякуємо, що були з нами.",
  en: "Code 404. Door open. Thanks for being with us.",
};

export const FINAL_DOOR_LINE = FINAL_DAN_LINES.en;

export type QuestReplyId =
  | "sofia-introduced"
  | "dan-explained-door"
  | "dan-badge-asked"
  | "hoover-ordinary-rejected"
  | "hoover-clue-given"
  | "fixel-sleeping-rejected"
  | "code-revealed"
  | "code-not-revealed"
  | "door-opened"
  | "sofia-context-initial"
  | "sofia-context-after-explained"
  | "sofia-context-after-dan"
  | "sofia-context-after-hoover"
  | "sofia-hint-initial"
  | "sofia-hint-after-explained"
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
    uk: "Привіт, я Софія, це Ден. Сьогодні був класний івент, але тепер нам потрібна твоя допомога з дверима. Я впевнена — щось точно придумаємо.",
    en: "Hi, I'm Sofiia, this is Dan. Today's event was great, but now we need your help with the door. I'm sure we'll figure something out.",
  },
  "dan-explained-door": {
    uk: "Ага, двері... тут проста історія: потрібен бейдж з кодом, у мене такий був, але я його кудись 'оптимізував' і знайти не можу — буквально дамп пам'яті.",
    en: "Ah, the door... simple story really: you need a badge with the code, I had one, but I 'optimized' it away somewhere and can't find it — basically a memory dump.",
  },
  "dan-badge-asked": {
    uk: "Хм, де я його останній раз бачив... ага, точно — тут увесь час білий кіт біля мене крутився. Скоріш за все саме він щось знає — спитай у нього.",
    en: "Hmm, where did I last see it... ah, right — the white cat was circling me the whole time. Most likely he's the one who knows something — ask him.",
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
  "sofia-context-after-explained": {
    uk: "Ну ось, бейдж кудись поділся. Розпитай Дена ще — він точно пам'ятає більше, ніж сказав з першого разу.",
    en: "Well, the badge is gone somewhere. Ask Dan a bit more — he definitely remembers more than he said the first time.",
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
    uk: "Я б почала з Дена. Спитай його прямо про двері — він точно знає більше, ніж видно зараз.",
    en: "I'd start with Dan. Ask him directly about the door — he knows more than it looks right now.",
  },
  "sofia-hint-after-explained": {
    uk: "Ден уже зізнався, що бейдж загубив. Розпитай його ще — де він його залишив, хто був поруч. Може, ще хтось бачив.",
    en: "Dan already admitted he lost the badge. Ask him a bit more — where he left it, who was around. Maybe someone else saw.",
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
    uk: "О, привіт! Класно, що зайшов — у мене ще контекст переповнений після того, що ми сьогодні шейпнули.",
    en: "Oh, hi! Good you came by — my context is still saturated from everything we shipped today.",
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
