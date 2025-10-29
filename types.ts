import type React from 'react';

export interface ActionParams {
  textareaRef: React.RefObject<HTMLTextAreaElement>;
  markdown: string;
  setMarkdown: (value: string) => void;
}

export interface DropdownItem {
  id: string;
  label: string;
  action: (params: ActionParams) => void;
}

export interface ToolbarItem {
  id: string;
  label: string;
  icon: React.ReactNode;
  action?: (params: ActionParams) => void; // Optional for dropdown parent
  type?: 'button' | 'dropdown';
  items?: DropdownItem[];
}

export interface SlashCommand {
  id: string;
  command: string;
  label: string;
  description: string;
  action: (params: ActionParams) => void;
}
