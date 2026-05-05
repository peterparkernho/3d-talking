declare module '@met4citizen/talkinghead/modules/lipsync-en.mjs' {
  export interface VisemeTimeline {
    words: string;
    visemes: string[];
    times: number[];
    durations: number[];
    i: number;
  }

  export class LipsyncEn {
    constructor();
    preProcessText(s: string): string;
    wordsToVisemes(w: string): VisemeTimeline;
  }
}
