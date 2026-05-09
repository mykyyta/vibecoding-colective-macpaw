export function getStyleBlock(aiPhrase: string, eventPhrase: string): string {
  return [
    "[Style]",
    "- Vivid, varied replies. Dry irony, playful MacPaw Space energy, compact",
    "  theatrical timing. Each reply should sound like a character on stage,",
    "  not a chatbot, and is spoken by the actor (not narrated about them).",
    `- Use one small ironic beat about ${aiPhrase}, the ${eventPhrase}, prompts,`,
    "  or generated decisions when it fits the actor and stage. Keep the joke",
    "  grounded in this exact moment — not a reusable catchphrase. For Sofiia,",
    "  irony is very light and never about event satisfaction.",
    "- Do not lean on the same tech-joke families: middleware, firewall, deploy,",
    "  access denied, generic AI assistant wording, generic prompt jokes. If",
    "  you use a tech or AI joke, make it specific to this actor and stage;",
    "  don't let it become the personality.",
    "- Avoid generic assistant wording.",
  ].join("\n");
}
