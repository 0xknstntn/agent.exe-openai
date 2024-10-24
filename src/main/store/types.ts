import { ChatCompletionMessageParam } from "openai/resources";

export type NextAction =
  | { type: 'key'; text: string }
  | { type: 'type'; text: string }
  | { type: 'mouse_move'; x: number; y: number }
  | { type: 'left_click' }
  | { type: 'right_click' }
  | { type: 'screenshot' }
  | { type: 'finish' }
  | { type: 'error'; message: string };

export type AppState = {
  instructions: string | null;
  fullyAuto: boolean;
  running: boolean;
  error: string | null;

  runHistory: ChatCompletionMessageParam[];

  RUN_AGENT: () => void;
  STOP_RUN: () => void;
  SET_INSTRUCTIONS: (instructions: string) => void;
  SET_FULLY_AUTO: (fullyAuto: boolean) => void;
  CLEAR_HISTORY: () => void;
};
