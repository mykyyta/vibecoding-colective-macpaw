import type { QuestLanguage } from "../../../shared/voice.js";

export const FINAL_DAN_LINES: Record<QuestLanguage, string> = {
  uk: "Код 404. Двері відчинено. Дякуємо, що були з нами.",
  en: "Code 404. Door open. Thanks for being with us.",
};

export const FINAL_DOOR_LINE = FINAL_DAN_LINES.en;

export type QuestReplyId =
  | "dan-door-checked"
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
  | "smalltalk-dan"
  | "smalltalk-hoover"
  | "smalltalk-fixel"
  | "smalltalk-after-escape"
  | "unknown";

export const CANNED_REPLIES: Record<QuestReplyId, Record<QuestLanguage, string>> = {
  "dan-door-checked": {
    uk: "Схоже, тут кодовий замок. Я можу ввести код, але спершу глянь на Hoover біля дверей: він тут крутився.",
    en: "Looks like a code lock. I can enter the code, but first check Hoover by the door: he was circling here.",
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
    uk: "Івент уже завершився, а двері схоже лишилися в after-hours режимі. Dan зазвичай розбирається з панеллю біля виходу.",
    en: "The event is over, and the door seems to be in after-hours mode. Dan usually handles the exit panel.",
  },
  "sofia-context-after-dan": {
    uk: "Dan уже перевірив двері. Далі варто спокійно говорити з тим, на кого він вказав.",
    en: "Dan has checked the door. Next, it is worth calmly talking to the one he pointed at.",
  },
  "sofia-context-after-hoover": {
    uk: "Тепер увага на сцену. Там є дуже сонна причина, чому бейдж поки не допомагає.",
    en: "Now the stage matters. There is a very sleepy reason the badge is not helping yet.",
  },
  "sofia-hint-initial": {
    uk: "Я б почала з Dan. Він ближче до дверної панелі й може зрозуміти, що саме заблоковано.",
    en: "I would start with Dan. He is closer to the door panel and can work out what is blocked.",
  },
  "sofia-hint-after-dan": {
    uk: "Dan дав напрям. Спробуй звернутися до Hoover спокійно й без тиску.",
    en: "Dan gave a direction. Try addressing Hoover calmly and without pressure.",
  },
  "sofia-hint-after-hoover": {
    uk: "Після підказки Hoover я б подивилася на Fixel і спробувала його розбудити.",
    en: "After Hoover's clue, I would look at Fixel and try waking him.",
  },
  "sofia-hint-code-revealed": {
    uk: "Код уже видно. Його має почути Dan, бо саме він працює з панеллю.",
    en: "The code is visible now. Dan should hear it because he is working with the panel.",
  },
  "sofia-hint-after-escape": {
    uk: "Бачиш, це було не про перемогу, а про спільний вихід. Дякую, що були з нами.",
    en: "See, this was not about winning; it was about finding a way out together. Thanks for being with us.",
  },
  "sofia-conversation-vcc": {
    uk: "Vibe Coding Collective — це спільнота й серія подій про те, як робити AI-білдинг доступним, соціальним і творчим.",
    en: "Vibe Coding Collective is a community and event series for making AI-assisted building accessible, social, and creative.",
  },
  "sofia-conversation-smalltalk": {
    uk: "Я Софія. Я поруч і тримаю простір спокійним, щоб було легше думати й пробувати.",
    en: "I'm Sofiia. I'm here, keeping the space calm so it is easier to think and try.",
  },
  "smalltalk-dan": {
    uk: "Dan киває в бік панелі. Він готовий допомогти, коли буде що вводити.",
    en: "Dan nods toward the panel. He is ready to help once there is something to enter.",
  },
  "smalltalk-hoover": {
    uk: "Hoover примружується. У нього явно є думка, але не для командного тону.",
    en: "Hoover narrows his eyes. He clearly has a thought, but not for a command tone.",
  },
  "smalltalk-fixel": {
    uk: "мрр...",
    en: "mrr...",
  },
  "smalltalk-after-escape": {
    uk: "Sofiia усміхається. After-hours режим завершився людяніше, ніж почався.",
    en: "Sofiia smiles. After-hours mode ended more humanely than it began.",
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
