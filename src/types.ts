export interface Flashcard {
  question: string;
  answer: string;
}

export interface Slide {
  title: string;
  content: string[];
}

export interface StudyMaterial {
  summary: string;
  flashcards: Flashcard[];
  presentation: Slide[];
  diagramUrl?: string;
  videoUrl?: string;
}

export type ThemeMode = 'light' | 'dark';
