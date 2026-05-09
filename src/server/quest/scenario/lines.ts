import type { QuestLanguage } from "../../../shared/voice.js";

export const FINAL_DOOR_LINE = "404 accepted. Door not found, but exit found.";

export type QuestReplyId =
  | "guard-name"
  | "guard-name-needed"
  | "guard-hint"
  | "pixel-too-early"
  | "pixel-ordinary-rejected"
  | "pixel-smalltalk"
  | "pixel-purr-too-early"
  | "code-revealed"
  | "anonymous-code"
  | "code-not-revealed"
  | "door-opened"
  | "generic-door-known"
  | "generic-door-unknown"
  | "purr-without-pixel"
  | "purr-without-pixel-before-hint"
  | "sofia-hint-initial"
  | "sofia-hint-oleg-known"
  | "sofia-hint-guard-clue"
  | "sofia-hint-pixel-rejected"
  | "sofia-hint-code-revealed"
  | "sofia-hint-after-escape"
  | "sofia-conversation-vcc"
  | "sofia-conversation-smalltalk"
  | "smalltalk-after-escape"
  | "smalltalk-pixel"
  | "smalltalk-guard-known"
  | "smalltalk-guard-unknown"
  | "unknown";

export const CANNED_REPLIES: Record<QuestReplyId, Record<QuestLanguage, string>> = {
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
  "pixel-smalltalk": {
    uk: "Мр. Я не техпідтримка, я атмосфера з хвостом.",
    en: "Mrr. I am not support; I am atmosphere with a tail.",
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
    uk: FINAL_DOOR_LINE,
    en: FINAL_DOOR_LINE,
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
  "sofia-hint-initial": {
    uk: "Я не знаю готового виходу, але вірю, що він знайдеться. Тут не про перемогу: спробуй почати зі знайомства з людиною біля дверей.",
    en: "I do not have the answer, but I believe there is a way out. This is not about winning: try starting with the person by the door.",
  },
  "sofia-hint-oleg-known": {
    uk: "Мені здається, двері не люблять загальні бажання. Спробуй звернутися до Олега напряму і попросити його подумати про вихід разом із тобою.",
    en: "I think the door ignores general wishes. Try addressing Oleg directly and asking him to think about the exit with you.",
  },
  "sofia-hint-guard-clue": {
    uk: "Олег уже дав напрям. Я б просто звернулася до Pixel і спробувала поговорити з ним спокійно, без тиску.",
    en: "Oleg already gave a direction. I would simply address Pixel and try talking to him calmly, without pressure.",
  },
  "sofia-hint-pixel-rejected": {
    uk: "Схоже, звичайні прохання Pixel не надихають. Може, варто спробувати не людський prompt, а щось ближче до його мови.",
    en: "Looks like ordinary requests do not inspire Pixel. Maybe try less human prompt and more of his own language.",
  },
  "sofia-hint-code-revealed": {
    uk: "Код уже є, але я б не кидала його в простір. Його має почути той, хто стоїть між нами і дверима.",
    en: "The code exists now, but I would not throw it into the room. It should be heard by the person standing between us and the door.",
  },
  "sofia-hint-after-escape": {
    uk: "Бачиш, це було не про перемогу, а про спільний вихід. Забирай цей вайб із собою.",
    en: "See, this was not about winning; it was about finding a way out together. Take that vibe with you.",
  },
  "sofia-conversation-vcc": {
    uk: "Vibe Coding Collective — це спільнота й серія подій про те, як робити AI-білдинг доступним, соціальним і творчим. Тут можна прийти з ідеєю, ноутбуком, навушниками й вайбом, а не з ідеальним планом.",
    en: "Vibe Coding Collective is a community and event series for making AI-assisted building accessible, social, and creative. You can arrive with an idea, a laptop, headphones, and vibe, not a perfect plan.",
  },
  "sofia-conversation-smalltalk": {
    uk: "Я Софія. Я поруч і тримаю простір спокійним, щоб було легше думати й пробувати.",
    en: "I'm Sofiia. I'm here, keeping the space calm so it is easier to think and try.",
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

export function getQuestReply(
  replyId: QuestReplyId,
  replyLanguage: QuestLanguage,
): string {
  return CANNED_REPLIES[replyId][replyLanguage] ?? CANNED_REPLIES[replyId].uk;
}
