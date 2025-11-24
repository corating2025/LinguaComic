export enum AppState {
  IDLE,
  ANALYZING,
  GENERATING_IMAGES,
  COMPLETE,
  ERROR
}

export interface Vocabulary {
  word: string;
  definition: string;
  example: string;
  visualPrompt: string;
  imageUrl?: string;
}

export interface ComicPanel {
  panelId: number;
  visualPrompt: string;
  caption: string;
  characterDialogue: string;
  imageUrl?: string; // Populated after image generation
}

export interface LogicNode {
  id: string;
  label: string;
  group: number;
}

export interface LogicLink {
  source: string;
  target: string;
  relationship: string;
}

export interface LogicGraphData {
  nodes: LogicNode[];
  links: LogicLink[];
}

export interface AnalysisResult {
  summary: string;
  comicScript: ComicPanel[];
  logicGraph: LogicGraphData;
  vocabulary: Vocabulary[];
}