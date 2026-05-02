/**
 * TUN brand voice — every user-facing string lives here.
 * "Would a knowledgeable brewing mate actually say this?"
 */

export const copy = {
  empty: {
    noRecipes: 'No recipes. Start designing.',
    noBatches: 'Nothing fermenting. Sort it out.',
    noFeed: 'Quiet in here. Follow some brewers.',
    noTemplates: 'No templates found.',
  },
  errors: {
    generic: "That didn't work. Try again.",
    network: "Connection's gone fuzzy. One more time.",
    notFound: "Can't find that. It's either gone or never was.",
  },
  auth: {
    signIn: 'Pop in.',
    signUp: 'Get pitching.',
    signOut: 'See you later.',
    welcomeBack: 'Right then. Back to it.',
  },
  onboarding: {
    welcome: "Right then. Let's make some beer.",
    welcomeBody:
      "TUN helps you design recipes, run your brew day, and track every batch until it's pourable. Built for homebrewers, by homebrewers.",
    getPitching: 'Get pitching',
    hasAccount: "I've got an account",
    chooseLevel: 'How brewy are you?',
    levelHelp: "We'll calibrate the help we offer accordingly. No judgement either way.",
    beginner: 'Just curious',
    beginnerBody: 'Never brewed. Want to start. Show me everything, explain why.',
    intermediate: "I've made a few",
    intermediateBody: 'Comfortable with the basics. Help me get smarter about it.',
    advanced: "Don't patronise me",
    advancedBody: 'Years deep. Skip the explainers. Show me the data.',
    unitsTitle: 'Metric or imperial?',
    unitsBody: "Stick with what you know. You can change this later.",
    metric: 'Metric',
    imperial: 'Imperial',
    done: "Done. Let's brew.",
  },
  recipe: {
    newRecipe: 'New recipe',
    save: 'Saved. Get brewing.',
    delete: 'Bin this recipe? No coming back.',
    brewThis: 'Brew this',
    fork: 'Fork it',
    styleMismatch: "This isn't a {style} any more. Still good — just not what BJCP would call it.",
    predictedProfile: 'Predicted profile',
    whatIf: 'What if?',
    tweaks: 'A few thoughts:',
  },
  batch: {
    newBatch: 'New batch',
    startBrewDay: "I'm ready. Start the brew.",
    pitched: 'Pitched. Start the timer.',
    logMeasurement: 'Log it',
    readyToBottle: 'Ready to bottle',
    readyToKeg: 'Ready to keg',
    complete: "And we're off.",
    completeBody: "Your {name} is in. We'll let you know when something interesting happens.",
  },
  notifications: {
    lagPhase: "Your {style}'s quiet. {hours} hours in and nothing showing. Worth a peek at the airlock.",
    krausenUp: "Krausen's up. She's working.",
    gravityDropping: "Gravity's nearly bottomed out on your {style}. Few more days.",
    dryHop: 'Dry-hop day. {amount} of {hop}. Keep it clean.',
    coldCrash: 'Time to crash that {style}. {temp}°C for {days}hrs.',
    ready: "Your {style}'s ready. Bottling weekend?",
    forked: '{user} forked your {style} recipe. They\'ve got taste.',
    commented: "{user}'s got thoughts on your {style}.",
  },
  validation: {
    needName: 'Need a name for this one.',
    needBatchSize: 'How big is this batch?',
    needIngredient: 'Every beer needs something in it.',
  },
  cta: {
    continue: 'Continue',
    cancel: 'Cancel',
    done: 'Done',
    skip: 'Skip ahead',
    pause: 'Pause',
    resume: 'Resume',
  },
} as const;

export type CopyKey = keyof typeof copy;
