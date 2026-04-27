import { Voice, SongStructure } from './types';

export const ARTIST_VOICES: Voice[] = [
  { 
    id: 'king-von', 
    name: 'King Von', 
    gender: 'male', 
    description: 'Aggressive Drill energy, distinctive flow.',
    imageUrl: '/input_file_5.png' 
  },
  { 
    id: 'drake', 
    name: 'Drake', 
    gender: 'male', 
    description: 'Smooth, melodic rap and R&B versatility.',
    imageUrl: '/input_file_4.png'
  },
  { 
    id: 'lil-durk', 
    name: 'Lil Durk', 
    gender: 'male', 
    description: 'Emotional melodic drill, raw storytelling.',
    imageUrl: '/input_file_3.png'
  },
  { 
    id: 'tyla', 
    name: 'Tyla', 
    gender: 'female', 
    description: 'Amapiano pop, ethereal and rhythmic.',
    imageUrl: '/input_file_2.png'
  },
  { 
    id: 'shensea', 
    name: 'Shensea', 
    gender: 'female', 
    description: 'Dancehall fusion, powerful and versatile.',
    imageUrl: '/input_file_1.png'
  },
  { 
    id: 'billie-eilish', 
    name: 'Billie Eilish', 
    gender: 'female', 
    description: 'Whispery, intimate, and dark pop vibes.',
    imageUrl: '/input_file_0.png'
  },
];

export const SONG_STRUCTURES: SongStructure[] = [
  { id: 'standard', name: 'Standard', sequence: ['Intro', 'Verse 1', 'Chorus', 'Verse 2', 'Chorus', 'Bridge', 'Chorus', 'Outro'] },
  { id: 'short', name: 'Short', sequence: ['Intro', 'Verse', 'Chorus', 'Outro'] },
  { id: 'club', name: 'Club Edit', sequence: ['Intro', 'Chorus', 'Verse', 'Chorus', 'Drop', 'Outro'] },
];

export const GENRES = [
  'Hip Hop',
  'Trap',
  'R&B',
  'Pop',
  'Dancehall',
  'Afrobeats',
  'Drill'
];
