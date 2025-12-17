export interface User {
  $id: string;
  email: string;
  name: string;
  avatar?: string;
  labels?: string[];
}

export interface Chat {
  $id: string;
  userId: string;
  title: string;
  createdAt: string;
  updatedAt: string;
}

export interface Message {
  $id: string;
  chatId: string;
  role: "user" | "assistant";
  content: string;
  files?: MessageFile[];
  createdAt: string;
}

export interface MessageFile {
  id: string;
  name: string;
  type: string;
  url?: string;
  size: number;
}

export type GroqModel =
  | "openai/gpt-oss-120b"
  | "qwen/qwen3-32b"
  | "openai/gpt-oss-20b"
  | "meta-llama/llama-4-scout-17b-16e-instruct"; // Vision model
