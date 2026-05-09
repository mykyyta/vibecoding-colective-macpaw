import type {
  QuestActor,
  QuestEventType,
  QuestLanguage,
  VoiceTurnResponse,
} from "../../../shared/voice.js";

type QuestSoundEffect = NonNullable<VoiceTurnResponse["soundEffect"]>;

const FIXEL_SOUND_EFFECT_BY_EVENT: Partial<
  Record<QuestEventType, QuestSoundEffect["id"]>
> = {
  "chitchat-replied": "fixel-purr-soft",
  "fixel-sleeping-rejected": "fixel-grumble",
  "code-revealed": "fixel-wake-mrrp",
};

const FIXEL_FALLBACK_TEXT: Record<QuestSoundEffect["id"], Record<QuestLanguage, string>> = {
  "fixel-purr-soft": {
    uk: "мрр...",
    en: "mrr...",
  },
  "fixel-grumble": {
    uk: "мрр-рр...",
    en: "mrr-rh...",
  },
  "fixel-wake-mrrp": {
    uk: "мррп.",
    en: "mrrp.",
  },
};

export function getQuestSoundEffect({
  actor,
  eventType,
  language,
}: {
  actor: QuestActor;
  eventType: QuestEventType;
  language: QuestLanguage;
}): QuestSoundEffect | undefined {
  if (actor !== "fixel") {
    return undefined;
  }

  const id = FIXEL_SOUND_EFFECT_BY_EVENT[eventType];

  if (!id) {
    return undefined;
  }

  return {
    assetUrl: `/audio/${id}.mp3`,
    fallbackText: FIXEL_FALLBACK_TEXT[id][language],
    id,
    provider: "asset",
  };
}
