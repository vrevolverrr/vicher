import type { Rating } from '@/chat/ChatRecord';

/** The thumb a reply starts with, and what to do when the student gives or takes back one. */
export interface ReplyFeedback {
  rating?: Rating;
  rate: (rating: Rating | undefined) => void;
}
