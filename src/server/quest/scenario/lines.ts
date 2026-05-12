import type { QuestLanguage } from "../../../shared/voice.js";

export const FINAL_DAN_LINES: Record<QuestLanguage, string> = {
  uk: "Код 404. Двері відчинено. Дякуємо, що були з нами.",
  en: "Code 404. Door open. Thanks for being with us.",
};

export const FINAL_DOOR_LINE = FINAL_DAN_LINES.en;

export type QuestReplyId =
  | "sofia-introduced"
  | "dan-explained-door"
  | "dan-stalling"
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
    uk: "А, двері — без бейджа з кодом їх не відкриєш. У мене такий якраз був, зараз дістану — ось він, секунду, зараз...",
    en: "Ah, the door — you can't open it without a badge with the code. I have one right here, just a second, getting it... one moment...",
  },
  "dan-stalling": {
    uk: "Зараз, секунду — він точно десь тут був, в одній з кишень. Ось-ось знайду.",
    en: "One second — it was right here, in one of my pockets. Almost got it.",
  },
  "dan-badge-asked": {
    uk: "Хм... мабуть, ти правий — я його ніяк не знайду, але точно ж десь був. Хоча, до речі, біля мене довго крутився якийсь білий кіт, Хувер. Спитай у нього — раптом щось бачив.",
    en: "Hmm... you might be right — I really can't find it, but it was definitely here. Although, come to think of it, a white cat called Hoover was hanging around me for a while. Ask him — maybe he saw something.",
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
    uk: "Дивись, Ден усе шукає, і шукає, і шукає... Як думаєш — а раптом він просто загубив?",
    en: "Look, Dan keeps searching and searching and searching... What if he just lost it?",
  },
  "sofia-context-after-dan": {
    uk: "Як там пошук? Якщо Ден на когось показав — рухайся туди, тільки спокійно.",
    en: "How's the search? If Dan pointed at someone — go that way, just gently.",
  },
  "sofia-context-after-hoover": {
    uk: "Майже все. На сцені спить хтось дуже впертий — на нього треба підступитися хитро. Може, його чимось пригостити?",
    en: "Almost there. Someone very stubborn is asleep on the stage — you'll need to approach them cleverly. Maybe offer something tasty?",
  },
  "sofia-hint-initial": {
    uk: "Я б почала з Дена. Спитай його прямо про двері — він точно знає більше, ніж видно зараз.",
    en: "I'd start with Dan. Ask him directly about the door — he knows more than it looks right now.",
  },
  "sofia-hint-after-explained": {
    uk: "Він уже хвилин п'ять шукає. Спробуй просто запитати, чи він часом не загубив його — може, тоді нарешті визнає.",
    en: "He's been searching for ages. Try just asking him whether he maybe lost it — that might make him finally admit it.",
  },
  "sofia-hint-after-dan": {
    uk: "Якщо Ден на когось показав — звернись до нього без тиску. Коти не дуже на накази.",
    en: "If Dan pointed at someone — speak to them without pressure. Cats don't really do orders.",
  },
  "sofia-hint-after-hoover": {
    uk: "Тепер на сцену. Той, хто там спить, не реагує на крики — а от голод у котів сильніший за сон. Запропонуй йому щось смачне.",
    en: "Now look at the stage. The one sleeping there won't react to noise — but hunger beats sleep in cats. Try offering him something tasty.",
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
