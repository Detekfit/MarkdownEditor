import type { ToolbarItem, SlashCommand, ActionParams } from './types';

// Helper function for text manipulation with toggle functionality
const applyFormatting = (
  textarea: HTMLTextAreaElement,
  markdown: string,
  setMarkdown: (value: string) => void,
  prefix: string,
  suffix: string = '',
  placeholder: string = 'text'
) => {
  const start = textarea.selectionStart;
  const end = textarea.selectionEnd;
  const selectedText = markdown.substring(start, end);

  const prefixLen = prefix.length;
  const suffixLen = suffix.length;

  // Expanded range to check for surrounding markers
  const surroundingPrefix = markdown.substring(start - prefixLen, start);
  const surroundingSuffix = markdown.substring(end, end + suffixLen);
  const isWrapped = surroundingPrefix === prefix && surroundingSuffix === suffix;
  
  // Check if the selection itself is the wrapped content
  const selectionIsWrapped = selectedText.startsWith(prefix) && selectedText.endsWith(suffix);

  if (isWrapped) {
      // Case 1: The selection is inside already-wrapped text. Unwrap it.
      const newMarkdown = markdown.substring(0, start - prefixLen) + selectedText + markdown.substring(end + suffixLen);
      setMarkdown(newMarkdown);
      setTimeout(() => {
          textarea.focus();
          textarea.setSelectionRange(start - prefixLen, end - prefixLen);
      }, 0);

  } else if (selectionIsWrapped) {
      // Case 2: The selection *is* the wrapped text. Unwrap it.
      const unwrappedText = selectedText.substring(prefixLen, selectedText.length - suffixLen);
      const newMarkdown = markdown.substring(0, start) + unwrappedText + markdown.substring(end);
      setMarkdown(newMarkdown);
      setTimeout(() => {
          textarea.focus();
          textarea.setSelectionRange(start, start + unwrappedText.length);
      }, 0);

  } else {
      // Case 3: Not wrapped. Wrap it.
      const textToWrap = selectedText || placeholder;
      const textToInsert = `${prefix}${textToWrap}${suffix}`;
      const newMarkdown = markdown.substring(0, start) + textToInsert + markdown.substring(end);
      setMarkdown(newMarkdown);

      setTimeout(() => {
          textarea.focus();
          if (selectedText) {
              // If we wrapped existing text, select the whole new chunk so it can be unwrapped
              textarea.setSelectionRange(start, start + textToInsert.length);
          } else {
              // If we inserted a placeholder, just select the placeholder text
              textarea.setSelectionRange(start + prefixLen, start + prefixLen + placeholder.length);
          }
      }, 0);
  }
};

const applyLineFormatting = (
  textarea: HTMLTextAreaElement,
  markdown: string,
  setMarkdown: (value: string) => void,
  prefix: string
) => {
    const start = textarea.selectionStart;
    const lineStart = markdown.lastIndexOf('\n', start - 1) + 1;
    
    // Find the end of the current line
    let lineEnd = markdown.indexOf('\n', lineStart);
    if (lineEnd === -1) {
        lineEnd = markdown.length;
    }
    const currentLine = markdown.substring(lineStart, lineEnd);

    if (currentLine.startsWith(prefix)) {
        // Line is already formatted, so un-format it
        const newMarkdown =
            markdown.substring(0, lineStart) +
            currentLine.substring(prefix.length) +
            markdown.substring(lineEnd);
        
        setMarkdown(newMarkdown);

        setTimeout(() => {
            textarea.focus();
            const newCursorPos = Math.max(lineStart, start - prefix.length);
            textarea.setSelectionRange(newCursorPos, newCursorPos);
        }, 0);
    } else {
        // Line is not formatted, so format it
        const newMarkdown =
            markdown.substring(0, lineStart) +
            prefix +
            currentLine +
            markdown.substring(lineEnd);
        
        setMarkdown(newMarkdown);

        setTimeout(() => {
            textarea.focus();
            textarea.setSelectionRange(start + prefix.length, start + prefix.length);
        }, 0);
    }
};

// SVG Icons
const BoldIcon = () => <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 12a4 4 0 0 0 0-8H6v8"/><path d="M15 20a4 4 0 0 0 0-8H6v8Z"/></svg>;
const ItalicIcon = () => <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="19" x2="10" y1="4" y2="4"/><line x1="14" x2="5" y1="20" y2="20"/><line x1="15" x2="9" y1="4" y2="20"/></svg>;
const HeadingIcon = () => <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M6 12h12"/><path d="M6 7v10"/><path d="M18 7v10"/></svg>;
const LinkIcon = () => <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.72"/><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.72-1.72"/></svg>;
const QuoteIcon = () => <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 21c3 0 7-1 7-8V5c0-1.25-.756-2.017-2-2H4c-1.25 0-2 .75-2 2v6h7.5"/><path d="M14 21c3 0 7-1 7-8V5c0-1.25-.75-2.017-2-2h-4c-1.25 0-2 .75-2 2v6h7.5"/></svg>;
const CodeIcon = () => <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="16 18 22 12 16 6"/><polyline points="8 6 2 12 8 18"/></svg>;
const ListIcon = () => <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="8" x2="21" y1="6" y2="6"/><line x1="8" x2="21" y1="12" y2="12"/><line x1="8" x2="21" y1="18" y2="18"/><line x1="3" x2="3.01" y1="6" y2="6"/><line x1="3" x2="3.01" y1="12" y2="12"/><line x1="3" x2="3.01" y1="18" y2="18"/></svg>;
const ListOrderedIcon = () => <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="10" x2="21" y1="6" y2="6"/><line x1="10" x2="21" y1="12" y2="12"/><line x1="10" x2="21" y1="18" y2="18"/><path d="M4 6h1v4"/><path d="m2 10h3"/><path d="M3 18h2v-2a2 2 0 1 0-2-2v2Z"/></svg>;
const ImagePlusIcon = () => <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h7"/><line x1="16" x2="22" y1="5" y2="5"/><line x1="19" x2="19" y1="2" y2="8"/><circle cx="9" cy="9" r="2"/><path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21"/></svg>;
const TableIcon = () => <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 3v18"/><rect width="18" height="18" x="3" y="3" rx="2"/><path d="M3 9h18"/><path d="M3 15h18"/></svg>;
const CheckSquareIcon = () => <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 11 12 14 22 4"/><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/></svg>;


const createAction = (handler: (textarea: HTMLTextAreaElement, markdown: string, setMarkdown: (v: string) => void) => void) => {
    return ({ textareaRef, markdown, setMarkdown }: ActionParams) => {
        if (textareaRef.current) {
            handler(textareaRef.current, markdown, setMarkdown);
        }
    };
};

export const TOOLBAR_ITEMS: ToolbarItem[] = [
    { 
        id: 'heading', 
        label: 'Headings', 
        icon: <HeadingIcon />, 
        type: 'dropdown',
        items: [
            { id: 'h1', label: 'Heading 1', action: createAction((t, m, s) => applyLineFormatting(t, m, s, '# ')) },
            { id: 'h2', label: 'Heading 2', action: createAction((t, m, s) => applyLineFormatting(t, m, s, '## ')) },
            { id: 'h3', label: 'Heading 3', action: createAction((t, m, s) => applyLineFormatting(t, m, s, '### ')) },
            { id: 'h4', label: 'Heading 4', action: createAction((t, m, s) => applyLineFormatting(t, m, s, '#### ')) },
        ]
    },
    { id: 'bold', label: 'Bold', icon: <BoldIcon />, type: 'button', action: createAction((t, m, s) => applyFormatting(t, m, s, '**', '**', 'bold text')) },
    { id: 'italic', label: 'Italic', icon: <ItalicIcon />, type: 'button', action: createAction((t, m, s) => applyFormatting(t, m, s, '*', '*', 'italic text')) },
    { id: 'quote', label: 'Blockquote', icon: <QuoteIcon />, type: 'button', action: createAction((t, m, s) => applyLineFormatting(t, m, s, '> ')) },
    { id: 'code', label: 'Code Block', icon: <CodeIcon />, type: 'button', action: createAction((t, m, s) => applyFormatting(t, m, s, '\n```\n', '\n```\n', 'code snippet')) },
    { id: 'link', label: 'Link', icon: <LinkIcon />, type: 'button', action: createAction((t, m, s) => applyFormatting(t, m, s, '[', '](url)', 'link text')) },
    { id: 'image', label: 'Image', icon: <ImagePlusIcon />, type: 'button', action: createAction((t, m, s) => applyFormatting(t, m, s, '![', '](image_url)', 'alt text')) },
    { id: 'table', label: 'Table', icon: <TableIcon />, type: 'button' },
    { id: 'ul', label: 'Bullet List', icon: <ListIcon />, type: 'button', action: createAction((t, m, s) => applyLineFormatting(t, m, s, '- ')) },
    { id: 'ol', label: 'Numbered List', icon: <ListOrderedIcon />, type: 'button', action: createAction((t, m, s) => applyLineFormatting(t, m, s, '1. ')) },
    { id: 'task', label: 'Task List', icon: <CheckSquareIcon />, type: 'button', action: createAction((t, m, s) => applyLineFormatting(t, m, s, '- [ ] ')) },
];

export const SLASH_COMMANDS: SlashCommand[] = [
    { id: 'h1', command: 'h1', label: 'Heading 1', description: 'Large section heading', action: createAction((t, m, s) => applyLineFormatting(t, m, s, '# ')) },
    { id: 'h2', command: 'h2', label: 'Heading 2', description: 'Medium section heading', action: createAction((t, m, s) => applyLineFormatting(t, m, s, '## ')) },
    { id: 'h3', command: 'h3', label: 'Heading 3', description: 'Small section heading', action: createAction((t, m, s) => applyLineFormatting(t, m, s, '### ')) },
    { id: 'h4', command: 'h4', label: 'Heading 4', description: 'Extra small section heading', action: createAction((t, m, s) => applyLineFormatting(t, m, s, '#### ')) },
    { id: 'h5', command: 'h5', label: 'Heading 5', description: 'Smallest section heading', action: createAction((t, m, s) => applyLineFormatting(t, m, s, '##### ')) },
    { id: 'bold', command: 'bold', label: 'Bold', description: 'Make text bold', action: createAction((t, m, s) => applyFormatting(t, m, s, '**', '**', 'bold text')) },
    { id: 'italic', command: 'italic', label: 'Italic', description: 'Make text italic', action: createAction((t, m, s) => applyFormatting(t, m, s, '*', '*', 'italic text')) },
    { id: 'quote', command: 'quote', label: 'Blockquote', description: 'Insert a quote', action: createAction((t, m, s) => applyLineFormatting(t, m, s, '> ')) },
    { id: 'code', command: 'code', label: 'Code Block', description: 'Insert a code block', action: createAction((t, m, s) => applyFormatting(t, m, s, '\n```\n', '\n```\n', 'code snippet')) },
    { id: 'link', command: 'link', label: 'Link', description: 'Insert a hyperlink', action: createAction((t, m, s) => applyFormatting(t, m, s, '[', '](url)', 'link text')) },
    { id: 'image', command: 'image', label: 'Image', description: 'Insert an image', action: createAction((t, m, s) => applyFormatting(t, m, s, '![', '](image_url)', 'alt text')) },
    { id: 'table', command: 'table', label: 'Table', description: 'Insert a table', action: () => {} },
    { id: 'ul', command: 'ul', label: 'Bullet List', description: 'Create a bulleted list', action: createAction((t, m, s) => applyLineFormatting(t, m, s, '- ')) },
    { id: 'ol', command: 'ol', label: 'Numbered List', description: 'Create a numbered list', action: createAction((t, m, s) => applyLineFormatting(t, m, s, '1. ')) },
    { id: 'task', command: 'task', label: 'Task List', description: 'Add a to-do item', action: createAction((t, m, s) => applyLineFormatting(t, m, s, '- [ ] '))},
    { id: 'hr', command: 'hr', label: 'Divider', description: 'Insert a horizontal rule', action: createAction((t, m, s) => applyLineFormatting(t, m, s, '\n---\n')) },
];


export const DEFAULT_MARKDOWN = `# Welcome to Markdown Editor!

This is a sleek, intuitive, and powerful live Markdown editor built with React and Tailwind CSS.

## Key Features

- **Live Preview**: See your rendered Markdown instantly as you type.
- **Toolbar**: Quick access to common formatting options.
- **Slash Commands**: Type \`//\` to bring up a command menu for efficient writing. Try typing \`//h2\` or \`//image\`.
- **Responsive Design**: Works beautifully on desktop and mobile devices.

### Examples

**Lists:**
- Unordered Item 1
- Unordered Item 2
  - Nested Item

1. Ordered Item 1
2. Ordered Item 2

**Task List:**
- [x] Write the code
- [ ] Add the tests
- [ ] Deploy to production

**Table:**
| Feature    | Status |
| ---------- | ------ |
| Tables     | ✅     |
| Task Lists | ✅     |


**Code:**
\`\`\`javascript
function greet() {
  console.log("Hello, world!");
}
\`\`\`

**Blockquote:**
> To be, or not to be, that is the question.

Start typing on the left to see the magic happen!
`;