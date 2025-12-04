export interface Message {
  id: string;
  role: 'user' | 'model';
  text: string;
  image?: string; // base64 string
  groundingMetadata?: GroundingMetadata;
  timestamp: Date;
  poi?: PoiData; // Legacy support
}

export interface GroundingMetadata {
  groundingChunks?: GroundingChunk[];
}

export interface GroundingChunk {
  web?: {
    uri: string;
    title: string;
  };
  maps?: {
    uri: string;
    title: string;
    placeAnswerSources?: {
      reviewSnippets?: {
        content: string;
      }[];
    };
  };
}

export interface Coordinates {
  latitude: number;
  longitude: number;
}

export interface PoiData {
  lat: number;
  lng: number;
  title: string;
  category?: 'police' | 'hospital' | 'school' | 'food' | 'bank' | 'park' | 'shop' | 'default';
}