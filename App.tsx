import React, { useState, useRef, useEffect, useCallback } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { useLocalStorage } from './hooks/useLocalStorage';
import { TOOLBAR_ITEMS, SLASH_COMMANDS, DEFAULT_MARKDOWN } from './constants';
import type { ToolbarItem, SlashCommand, ActionParams } from './types';

// Component: ToolbarItemDropdown
const ToolbarItemDropdown: React.FC<{
  item: ToolbarItem;
  onAction: (action: (params: ActionParams) => void) => void;
}> = ({ item, onAction }) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const handleSelect = (dropdownItemAction: (params: ActionParams) => void) => {
    onAction(dropdownItemAction);
    setIsOpen(false);
  };

  return (
    <div className="relative inline-block" ref={dropdownRef}>
      <button
        title={item.label}
        onClick={() => setIsOpen(prev => !prev)}
        className="p-2 rounded-md hover:bg-zinc-900 text-main-text transition-colors duration-150 focus:outline-none focus:ring-2 focus:ring-accent"
      >
        {item.icon}
      </button>
      {isOpen && (
        <div className="absolute top-full left-0 mt-2 w-48 bg-surface border border-subtle-border rounded-md shadow-lg z-20 py-1">
          {item.items?.map(dropdownItem => (
            <button
              key={dropdownItem.id}
              onClick={() => handleSelect(dropdownItem.action)}
              className="w-full text-left px-4 py-2 text-sm text-main-text hover:bg-zinc-900"
            >
              {dropdownItem.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};


// Component: Toolbar
const Toolbar: React.FC<{ onAction: (item: { action?: (params: ActionParams) => void }) => void }> = ({ onAction }) => (
  <div className="flex items-center flex-wrap p-2 bg-surface border-b border-subtle-border space-x-1 gap-y-1">
    {TOOLBAR_ITEMS.map((item) => {
      if (item.type === 'dropdown') {
        return <ToolbarItemDropdown key={item.id} item={item} onAction={(action) => onAction({ action })} />;
      }
      return (
        <button
          key={item.id}
          title={item.label}
          onClick={() => onAction(item)}
          className="p-2 rounded-md hover:bg-zinc-900 text-main-text transition-colors duration-150 focus:outline-none focus:ring-2 focus:ring-accent"
        >
          {item.icon}
        </button>
      );
    })}
  </div>
);


// Component: SlashCommandMenu
interface SlashCommandMenuProps {
  commands: SlashCommand[];
  onSelect: (command: SlashCommand) => void;
  position: { top: number; left: number };
}
const SlashCommandMenu: React.FC<SlashCommandMenuProps> = ({ commands, onSelect, position }) => {
    const [selectedIndex, setSelectedIndex] = useState(0);

    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'ArrowDown') {
                e.preventDefault();
                setSelectedIndex((prev) => (prev + 1) % commands.length);
            } else if (e.key === 'ArrowUp') {
                e.preventDefault();
                setSelectedIndex((prev) => (prev - 1 + commands.length) % commands.length);
            } else if (e.key === 'Enter') {
                e.preventDefault();
                if (commands[selectedIndex]) {
                    onSelect(commands[selectedIndex]);
                }
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [commands, selectedIndex, onSelect]);

    if (commands.length === 0) return null;

    return (
        <div 
            className="absolute z-10 w-72 max-h-80 overflow-y-auto bg-surface border border-subtle-border rounded-lg shadow-2xl p-2"
            style={{ top: position.top, left: position.left }}
        >
            {commands.map((cmd, index) => (
                <div
                    key={cmd.id}
                    onClick={() => onSelect(cmd)}
                    onMouseEnter={() => setSelectedIndex(index)}
                    className={`flex flex-col p-2 rounded-md cursor-pointer ${
                        index === selectedIndex ? 'bg-accent text-white' : 'hover:bg-zinc-900 text-main-text'
                    }`}
                >
                    <span className="font-semibold">{cmd.label}</span>
                    <span className={`text-sm ${index === selectedIndex ? 'text-amber-100' : 'text-zinc-500'}`}>{cmd.description}</span>
                </div>
            ))}
        </div>
    );
};

// Component: Editor
interface EditorProps extends ActionParams {
    className?: string;
}
const Editor: React.FC<EditorProps> = ({ markdown, setMarkdown, textareaRef, className }) => {
    const [slashCommandState, setSlashCommandState] = useState<{
        isOpen: boolean;
        searchTerm: string;
        position: { top: number; left: number };
        triggerIndex: number;
    } | null>(null);

    const hiddenMirrorRef = useRef<HTMLDivElement>(null);

    const handleSlashCommandSelect = (command: SlashCommand) => {
        if (!textareaRef.current || !slashCommandState) return;
        
        const { triggerIndex, searchTerm } = slashCommandState;
        const textBefore = markdown.substring(0, triggerIndex);
        const textAfter = markdown.substring(triggerIndex + 2 + searchTerm.length);

        setMarkdown(textBefore + textAfter);
        setSlashCommandState(null);

        setTimeout(() => {
            if (textareaRef.current) {
                textareaRef.current.focus();
                textareaRef.current.selectionStart = textareaRef.current.selectionEnd = triggerIndex;
                command.action({ textareaRef, markdown: textBefore + textAfter, setMarkdown });
            }
        }, 0);
    };

    const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
        const text = e.target.value;
        const cursorPosition = e.target.selectionStart;
        setMarkdown(text);

        const textBeforeCursor = text.substring(0, cursorPosition);
        const match = textBeforeCursor.match(/\/\/(.*)$/);
        
        if (match && hiddenMirrorRef.current && textareaRef.current) {
            const searchTerm = match[1];
            const triggerIndex = match.index!;

            // Update mirror and calculate position
            hiddenMirrorRef.current.textContent = text.substring(0, triggerIndex + 2);
            const rect = hiddenMirrorRef.current.getBoundingClientRect();
            const textareaRect = textareaRef.current.getBoundingClientRect();
            
            setSlashCommandState({
                isOpen: true,
                searchTerm: searchTerm,
                position: { 
                    top: rect.bottom - textareaRect.top + textareaRef.current.scrollTop + 5,
                    left: rect.left - textareaRect.left + textareaRef.current.scrollLeft
                },
                triggerIndex,
            });
        } else {
            setSlashCommandState(null);
        }
    };

    const filteredCommands = slashCommandState?.isOpen
        ? SLASH_COMMANDS.filter(cmd =>
            cmd.command.toLowerCase().startsWith(slashCommandState.searchTerm.toLowerCase()) ||
            cmd.label.toLowerCase().includes(slashCommandState.searchTerm.toLowerCase())
          )
        : [];

    return (
        <div className={`relative h-full w-full ${className}`}>
             <div className="absolute top-0 left-0 -z-10 whitespace-pre-wrap invisible font-mono text-base p-4" ref={hiddenMirrorRef}></div>
            <textarea
                ref={textareaRef}
                value={markdown}
                onChange={handleInputChange}
                className="w-full h-full bg-surface text-main-text p-4 resize-none focus:outline-none font-mono text-base leading-relaxed"
                placeholder="Start writing your masterpiece..."
                onKeyDown={(e) => {
                    if (slashCommandState?.isOpen && (e.key === 'ArrowUp' || e.key === 'ArrowDown' || e.key === 'Enter')) {
                        e.preventDefault();
                    }
                }}
            />
            {slashCommandState?.isOpen && (
                <SlashCommandMenu
                    commands={filteredCommands}
                    onSelect={handleSlashCommandSelect}
                    position={slashCommandState.position}
                />
            )}
        </div>
    );
};

// Component: Preview
const Preview: React.FC<{ markdown: string, className?: string }> = ({ markdown, className }) => (
    <div className={`h-full w-full overflow-y-auto p-4 bg-surface ${className}`}>
        <article className="prose prose-invert max-w-none">
            <ReactMarkdown remarkPlugins={[remarkGfm]}>{markdown}</ReactMarkdown>
        </article>
    </div>
);


// Main App Component
export default function App() {
  const [markdown, setMarkdown] = useLocalStorage<string>('markdown-content', DEFAULT_MARKDOWN);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const [view, setView] = useState<'edit' | 'preview'>('edit');
  
  const handleToolbarAction = useCallback((item: { action?: (params: ActionParams) => void }) => {
    if (item.action) {
      item.action({ textareaRef, markdown, setMarkdown });
    }
  }, [markdown, setMarkdown]);

  return (
    <>
        <main className="h-screen w-screen bg-surface flex flex-col font-sans">
            <header className="flex-shrink-0 flex items-center justify-between p-2 bg-surface border-b border-subtle-border">
                <div>
                    <h1 className="text-lg font-bold text-main-text">Markdown Editor</h1>
                </div>
                <div className="md:hidden">
                    <div className="flex items-center bg-zinc-900 rounded-lg p-1">
                        <button onClick={() => setView('edit')} className={`px-3 py-1 text-sm rounded-md ${view === 'edit' ? 'bg-accent text-white' : 'text-main-text'}`}>Write</button>
                        <button onClick={() => setView('preview')} className={`px-3 py-1 text-sm rounded-md ${view === 'preview' ? 'bg-accent text-white' : 'text-main-text'}`}>Preview</button>
                    </div>
                </div>
            </header>
            
            <div className="flex-grow flex flex-col md:flex-row min-h-0">
                <div className="w-full md:w-1/2 flex flex-col md:border-r border-subtle-border">
                    <Toolbar onAction={handleToolbarAction} />
                    <Editor 
                        markdown={markdown} 
                        setMarkdown={setMarkdown} 
                        textareaRef={textareaRef} 
                        className={view === 'preview' ? 'hidden md:block' : 'block'}
                    />
                </div>
                <Preview 
                    markdown={markdown}
                    className={view === 'edit' ? 'hidden md:block' : 'block'}
                />
            </div>
        </main>
        <footer className="fixed bottom-4 right-4 bg-surface/50 backdrop-blur-sm text-main-text text-xs py-1 px-2 rounded-md flex items-center gap-1 border border-subtle-border">
            <span>Made with ❤️ by</span>
            <a href="https://detekfit.com" target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 font-semibold text-main-text hover:text-accent transition-colors">
                <img src="https://sin1.contabostorage.com/ade7e0e176374e7284cb775eb86f6479:assets/images/detekfit/svg-brand.svg" className="h-8 w-auto" alt="Detekfit Logo" />
                <span>Detekfit™</span>
            </a>
        </footer>
    </>
  );
}