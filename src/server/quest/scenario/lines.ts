import type { QuestLanguage } from "../../../shared/voice.js";

export const FINAL_DAN_LINES: Record<QuestLanguage, string> = {
  uk: "Ти зміг. Хувер і Фіксель, здається, тепер у твоєму фан-клубі.",
  en: "You did it. Hoover and Fixel may now be in your fan club.",
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
    uk: "Мрр. Людина знайшла Хувера, але ще не знайшла правильний тон.",
    en: "Mrr. The human found Hoover, but not the right tone yet.",
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
    uk: "Я тут. Після івенту в залі тихіше, але все ще відчувається рух.",
    en: "I'm here. The room is quieter after the event, but it still feels alive.",
  },
  "sofia-context-after-explained": {
    uk: "Ден усе ще шукає і тримається дуже впевнено для людини, яка явно щось шукає.",
    en: "Dan is still searching and looks very confident for someone who is clearly searching.",
  },
  "sofia-context-after-dan": {
    uk: "У кімнаті стало уважніше. Хувер ніби теж стежить за розмовою.",
    en: "The room feels more attentive now. Hoover seems to be following the conversation too.",
  },
  "sofia-context-after-hoover": {
    uk: "На сцені тихо. Fixel спить так переконливо, ніби це теж частина програми.",
    en: "It's quiet on stage. Fixel is sleeping so convincingly it almost feels scheduled.",
  },
  "sofia-hint-initial": {
    uk: "Я б почала з Дена. Спитай його прямо про двері — він точно знає більше, ніж видно зараз.",
    en: "I'd start with Dan. Ask him directly about the door — he knows more than it looks right now.",
  },
  "sofia-hint-after-explained": {
    uk: "Ден застряг у режимі «я зараз знайду». Запитай його прямо: «Дене, може, ти загубив бейдж?»",
    en: "Dan is stuck in 'I'll find it any second' mode. Ask him directly: 'Dan, maybe you lost the badge?'",
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
    uk: "Софія м'яко реагує, але не підхоплює цю нитку. У кімнаті поки все рухається без поспіху.",
    en: "Sofiia responds gently, but does not pick up that thread yet. The room is still moving at its own calm pace.",
  },
  "pre-activation-fixel-redirect": {
    uk: "Софія стишує голос. У цій кімнаті навіть сон виглядає як частина післяівентового настрою.",
    en: "Sofiia lowers her voice. In this room, even sleep feels like part of the after-event mood.",
  },
  "smalltalk-dan": {
    uk: "О, привіт. Я тут, ще трохи в післяівентовому режимі.",
    en: "Oh, hi. I'm here, still slightly in post-event mode.",
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
