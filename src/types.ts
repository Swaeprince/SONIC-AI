export type Voice = {
  id: string;
  name: string;
  gender: 'male' | 'female';
  description: string;
  imageUrl?: string;
};

export type SongStructure = {
  id: string;
  name: string;
  sequence: string[];
};

export type GenerationStatus = 'idle' | 'analyzing' | 'generating_lyrics' | 'synthesizing_vocals' | 'mixing' | 'completed' | 'error';

export interface SongMetadata {
  title: string;
  genre: string;
  mood: string;
  bpm?: number;
  key?: string;
}
