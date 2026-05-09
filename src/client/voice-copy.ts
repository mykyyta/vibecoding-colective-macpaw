import type { QuestLanguage } from "../shared/voice.js";

export interface VoiceCopy {
  microphoneName: string;
  roomName: string;
  playerName: string;
  guardName: string;
  doorName: string;
  sofiaName: string;
  listening: string;
  holdLonger: string;
  thinking: string;
  notUnderstood: string;
  elevenLabsRetryBrowser: string;
  elevenLabsRetryMicrophone: string;
  browserUnavailableReadout: string;
  browserUnavailableBubble: string;
  microphoneBlocked: string;
  speechNotRecognized: string;
  questServerUnavailable: string;
  micSpeaking: string;
  micBusy: string;
  micReady: string;
  micUnavailable: string;
  micAudioHint: string;
  micWaitAria: string;
  micPressAria: string;
  hintAria: string;
  restart: string;
  leaderboardSubmitted: string;
  leaderboardHeading: string;
  leaderboardSceneLabel: string;
  leaderboardBoardLabel: string;
  leaderboardAria: string;
  leaderboardInvite: string;
  leaderboardNameLabel: string;
  leaderboardUnavailable: string;
  leaderboardSaving: string;
  leaderboardSave: string;
  leaderboardTries: string;
  leaderboardLoading: string;
  leaderboardEmpty: string;
  leaderboardErrorOffline: string;
  leaderboardErrorFinishAgain: string;
  leaderboardErrorDisplayName: string;
  leaderboardErrorNotConfigured: string;
  leaderboardErrorUnavailable: string;
  roomSceneAria: string;
  exitKeypadAria: string;
  pixelAria: string;
  guardAria: string;
  sofiaAria: string;
  relativeJustNow: string;
  relativeMinuteAgo: (minutes: number) => string;
  relativeHourAgo: (hours: number) => string;
  ambientListening: string;
  ambientDoorOpening: string;
  ambientEscaped: string;
  ambientCodeRevealed: string;
  ambientPixelAddressed: string;
  ambientGuardHintGiven: string;
  ambientOlegKnown: string;
  ambientInitial: string;
}

export const VOICE_COPY: Record<QuestLanguage, VoiceCopy> = {
  uk: {
    microphoneName: "Мікрофон",
    roomName: "Кімната",
    playerName: "Ти",
    guardName: "Охоронець",
    doorName: "Двері",
    sofiaName: "Софія",
    listening: "Слухаю.",
    holdLonger: "Потримай кнопку трохи довше і скажи фразу ще раз.",
    thinking: "Думаю, що ти сказав.",
    notUnderstood: "Не розібрав. Утримай кнопку і скажи ще раз.",
    elevenLabsRetryBrowser:
      "ElevenLabs не розшифрував. Спробуй ще раз: наступна спроба піде через браузер.",
    elevenLabsRetryMicrophone:
      "ElevenLabs не розшифрував. Перевір мікрофон і спробуй ще раз.",
    browserUnavailableReadout:
      "Цей браузер не дав голос. Відкрий http://localhost:3000 у Chrome або Safari і дозволь мікрофон.",
    browserUnavailableBubble:
      "Цей браузер не дав голос. Відкрий демо в Chrome або Safari і дозволь мікрофон.",
    microphoneBlocked:
      "Мікрофон заблоковано. Дозволь доступ у браузері або відкрий демо в Chrome/Safari.",
    speechNotRecognized: "Голос не розпізнано.",
    questServerUnavailable:
      "Сервер квесту не відповів. Спробуй ще раз, коли локальний API піднятий.",
    micSpeaking: "Listening",
    micBusy: "Wait...",
    micReady: "Push to talk",
    micUnavailable: "Mic blocked",
    micAudioHint: "EN/UA · sound on",
    micWaitAria: "Wait",
    micPressAria: "Push to talk, English or Ukrainian, sound on",
    hintAria: "Показати підказку",
    restart: "Нова спроба",
    leaderboardSubmitted: "Записано. Ти вийшов з кімнати офіційно.",
    leaderboardHeading: "Останні виходи",
    leaderboardSceneLabel: "Сцена",
    leaderboardBoardLabel: "Дошка",
    leaderboardAria: "Останні проходження",
    leaderboardInvite: "Додай ім'я, щоб потрапити в лідерборд.",
    leaderboardNameLabel: "Ім'я",
    leaderboardUnavailable: "Лідерборд ще налаштовується, запис недоступний.",
    leaderboardSaving: "Збереження",
    leaderboardSave: "Зберегти",
    leaderboardTries: "спроб",
    leaderboardLoading: "Завантаження",
    leaderboardEmpty: "Ще немає виходів",
    leaderboardErrorOffline: "Офлайн",
    leaderboardErrorFinishAgain: "Пройди ще раз",
    leaderboardErrorDisplayName: "Ім'я: 1-32 символи",
    leaderboardErrorNotConfigured: "Не налаштовано",
    leaderboardErrorUnavailable: "Недоступно",
    roomSceneAria: "Голосова квест-кімната MacPaw Space",
    exitKeypadAria: "Панель виходу",
    pixelAria: "Pixel",
    guardAria: "Охоронець",
    sofiaAria: "Софія, організаторка Vibecoding Collective",
    relativeJustNow: "щойно",
    relativeMinuteAgo: (minutes) => `${minutes} хв тому`,
    relativeHourAgo: (hours) => `${hours} год тому`,
    ambientListening: "утримуй, говори, відпусти",
    ambientDoorOpening: "EXIT resolved",
    ambientEscaped: "EXIT accepted",
    ambientCodeRevealed: "Олег чекає код",
    ambientPixelAddressed: "Pixel любить лагідне мур-мур",
    ambientGuardHintGiven: "Pixel сидів біля keypad",
    ambientOlegKnown: "Олег реагує на своє ім'я",
    ambientInitial: "спитай, як звуть охоронця",
  },
  en: {
    microphoneName: "Microphone",
    roomName: "Room",
    playerName: "You",
    guardName: "Guard",
    doorName: "Door",
    sofiaName: "Sofiia",
    listening: "Listening.",
    holdLonger: "Hold the button a little longer and say the phrase again.",
    thinking: "Working out what you said.",
    notUnderstood: "I did not catch that. Hold the button and try again.",
    elevenLabsRetryBrowser:
      "ElevenLabs could not transcribe that. Try again: the next attempt will use browser speech.",
    elevenLabsRetryMicrophone:
      "ElevenLabs could not transcribe that. Check the microphone and try again.",
    browserUnavailableReadout:
      "This browser did not provide voice input. Open http://localhost:3000 in Chrome or Safari and allow the microphone.",
    browserUnavailableBubble:
      "This browser did not provide voice input. Open the demo in Chrome or Safari and allow the microphone.",
    microphoneBlocked:
      "Microphone blocked. Allow browser access or open the demo in Chrome/Safari.",
    speechNotRecognized: "Voice was not recognized.",
    questServerUnavailable:
      "The quest server did not answer. Try again when the local API is running.",
    micSpeaking: "Speak",
    micBusy: "Wait...",
    micReady: "Push to talk",
    micUnavailable: "Mic blocked",
    micAudioHint: "EN/UA · sound on",
    micWaitAria: "Wait",
    micPressAria: "Push to talk, English or Ukrainian, sound on",
    hintAria: "Show hint",
    restart: "Restart",
    leaderboardSubmitted: "Saved. You escaped the room officially.",
    leaderboardHeading: "Recent exits",
    leaderboardSceneLabel: "Scene",
    leaderboardBoardLabel: "Board",
    leaderboardAria: "Recent exits",
    leaderboardInvite: "Add your name to join the leaderboard.",
    leaderboardNameLabel: "Name",
    leaderboardUnavailable: "Leaderboard setup is still in progress, so saving is unavailable.",
    leaderboardSaving: "Saving",
    leaderboardSave: "Save",
    leaderboardTries: "tries",
    leaderboardLoading: "Loading",
    leaderboardEmpty: "No exits yet",
    leaderboardErrorOffline: "Offline",
    leaderboardErrorFinishAgain: "Finish again",
    leaderboardErrorDisplayName: "Name: 1-32 chars",
    leaderboardErrorNotConfigured: "Not configured",
    leaderboardErrorUnavailable: "Unavailable",
    roomSceneAria: "Voice-operated MacPaw Space quest room",
    exitKeypadAria: "Exit keypad",
    pixelAria: "Pixel the cat",
    guardAria: "Human guard",
    sofiaAria: "Sofiia, Vibecoding Collective organizer",
    relativeJustNow: "just now",
    relativeMinuteAgo: (minutes) => `${minutes} min ago`,
    relativeHourAgo: (hours) => `${hours} hr ago`,
    ambientListening: "hold, speak, release",
    ambientDoorOpening: "EXIT resolved",
    ambientEscaped: "EXIT accepted",
    ambientCodeRevealed: "Oleg is waiting for the code",
    ambientPixelAddressed: "Pixel likes a gentle purr",
    ambientGuardHintGiven: "Pixel sat near the keypad",
    ambientOlegKnown: "Oleg responds to his name",
    ambientInitial: "ask the guard for his name",
  },
};
