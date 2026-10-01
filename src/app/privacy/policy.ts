/* The privacy policy, word for word as the app shows it (catch8 supabase/functions/privacy/index.ts on the
   release of 1 October 2026). Edit it there first, then here, so the two never say different things. */

export type Block = { h: string } | { p: string } | { li: string[] };

export const POLICY: Block[] = [
  {
    "p": "Last updated 1 October 2026. Krovvi is made by Delvnco."
  },
  {
    "p": "This page says what Krovvi collects, where it is kept, who handles it for us, and how you can delete it. Questions go to mahmoudaidaors@krovvi.com."
  },
  {
    "h": "What Krovvi collects"
  },
  {
    "p": "Krovvi keeps what you give it, and what it learns from that, so it can answer you later."
  },
  {
    "li": [
      "Recordings you make in the app or share into it, and the audio of online meetings you send Krovvi's meeting bot to.",
      "Files, photos and videos you add, links you share (Krovvi opens the page to read it), and chat exports you bring in, such as a WhatsApp chat.",
      "Notes you type or paste, and your chats with Krovvi, with any photos you attach to them.",
      "What Krovvi writes from all of this: the words of your recordings, summaries and titles, and what it learns about your world, such as people, promises, dates and decisions, each linked to where it was said. You can see and change this in Memory.",
      "A sample of your voice, only if you choose Keep when Krovvi asks which voice in a recording is yours. It is made from up to 30 seconds of your own voice in that recording and used only to recognize your voice in your own later recordings, so what you say lands as yours. Krovvi never keeps a sample of anyone else's voice.",
      "Your iPhone calendar, if you turn it on: your events from four months back to three months ahead, with their titles, places and notes, and the people invited to them.",
      "Your iPhone contacts, if you turn them on: each contact's name, numbers, emails, company, job, birthday, addresses and the other details saved on it.",
      "Your location, if you turn it on: where your phone is while you use the app and, if you allow it all the time, the places you go. Krovvi uses it for travel times and to learn your home and work.",
      "Your Google account, if you connect it: your mail, calendar and contacts, and the Drive, Docs and Sheets files you ask about. Krovvi reads them on our server, and checks for new mail each morning.",
      "Your account: the name and email that Apple or Google share when you sign in, and a notification token so we can send you notifications.",
      "How you use the app: a count for each day of things like opening the app and sending what you agreed. Crash reports hold your phone model, your iOS version and what the app was doing, never your recordings or notes."
    ]
  },
  {
    "p": "We never sell your data. Krovvi has no ads. We do not use your data to train AI models."
  },
  {
    "h": "Where it is kept"
  },
  {
    "p": "Your data is kept on our servers. Supabase runs our database, and your audio, documents and photos are stored in Cloudflare R2. Your phone also keeps your recordings and your recent notes, so the app opens fast and plays audio without waiting. Deleting the app removes them from the phone."
  },
  {
    "h": "When Krovvi sends something out"
  },
  {
    "p": "Krovvi sends your data to someone else only when you ask it to. If you send someone what you agreed in a conversation, they get a private link that shows your name, the title you chose and the lines you picked, never the recording. Their answer is kept with your note. When you ask Krovvi to act for you, such as sending an email or adding a calendar event, it does that through the account you connected."
  },
  {
    "h": "Who handles your data for us"
  },
  {
    "p": "These companies process your data only to run Krovvi for you:"
  },
  {
    "li": [
      "OpenRouter: carries each request to Google's Gemini models, the AI that turns your recordings into text, reads your files and answers your questions, and only through services that do not store or train on what you send. Google Search looks up facts on the web the same way, and only the search words are sent.",
      "Cohere, through OpenRouter: puts the results of a search in your library in order, the closest to your question first. It receives the question and the passages it orders.",
      "Supabase: our database, sign-in and server functions.",
      "Trigger.dev: runs the jobs that read your recordings and files.",
      "Cloudflare R2: stores your audio, documents and photos.",
      "pyannoteAI: tells the voices in a recording apart and, if you keep a voice sample, makes it and recognizes your voice with it. It receives the audio and deletes it within 48 hours. The sample itself is kept in your Krovvi account.",
      "Recall.ai: runs the meeting bot you send to an online meeting. The meeting's recording is deleted there once your note has its audio.",
      "Composio: holds the connections you approve to Google, and makes the calls to it. We never see your password.",
      "Firecrawl and Supadata: read the web pages and video captions of links you share. They receive the link only.",
      "Expo: delivers notifications. A notification can show a note's title or a promise on your lock screen.",
      "Sentry: receives crash reports."
    ]
  },
  {
    "h": "How to delete your data"
  },
  {
    "li": [
      "A note: delete it in the app. It goes to Recently deleted, where you can bring it back or erase it at once. After 30 days it is erased for good, with its audio.",
      "Calendar, contacts or location: turn them off in Settings, Connected apps. Krovvi stops reading them and removes the events, contacts and places your phone sent to our server.",
      "Your voice sample: in Settings, Your voice, tap Delete sample. It is erased at once.",
      "Everything: in Settings, tap Delete account. This erases your recordings, notes, memory, files and connections from our servers. It cannot be undone.",
      "If you cannot open the app, write to mahmoudaidaors@krovvi.com and we will erase your data."
    ]
  },
  {
    "h": "Questions"
  },
  {
    "p": "Write to mahmoudaidaors@krovvi.com. When this policy changes, the date at the top changes with it."
  }
];
