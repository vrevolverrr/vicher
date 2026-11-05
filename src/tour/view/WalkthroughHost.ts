import type { TourStep } from '@/chat/ChatRecord';
import type { TourEvent } from '@/tour/HighlightTour';

/** What a walkthrough needs of the chat: to start the tour at a stop, and to hear which stop is on screen. */
export interface WalkthroughHost {
  /** The student picked stop `index` of `steps`: show it, then carry on from there. */
  pick(steps: readonly TourStep[], index: number): void;
  /** Tells `listener` which stop is on screen, for as long as the chat shows this walkthrough. */
  watch(listener: (event: TourEvent) => void): void;
}
