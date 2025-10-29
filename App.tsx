import React, { useState, useRef, useEffect, useCallback } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { useLocalStorage } from './hooks/useLocalStorage';
import { TOOLBAR_ITEMS, SLASH_COMMANDS, DEFAULT_MARKDOWN } from './constants';
import type { ToolbarItem, SlashCommand, ActionParams } from './types';

// Component: TableDialog
interface TableDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onInsert: (tableMarkdown: string) => void;
}
const TableDialog: React.FC<TableDialogProps> = ({ isOpen, onClose, onInsert }) => {
  const [rows, setRows] = useState(2);
  const [cols, setCols] = useState(2);

  if (!isOpen) {
    return null;
  }

  const generateTableMarkdown = () => {
    if (rows < 0 || cols < 1) return '';
    const header = `| ${Array.from({ length: cols }, (_, i) => `Header ${i + 1}`).join(' | ')} |`;
    const divider = `| ${Array.from({ length: cols }, () => '---').join(' | ')} |`;
    const body = Array.from({ length: Math.max(0, rows) }, () =>
      `| ${Array.from({ length: cols }, () => 'Cell').join(' | ')} |`
    ).join('\n');
    
    return rows > 0 ? `${header}\n${divider}\n${body}` : `${header}\n${divider}`;
  };

  const handleInsert = () => {
    onInsert(generateTableMarkdown());
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50" onClick={onClose}>
      <div className="bg-surface border border-subtle-border rounded-lg shadow-2xl p-6 w-full max-w-sm" onClick={(e) => e.stopPropagation()}>
        <h2 className="text-xl font-bold mb-4 text-main-text">Create Table</h2>
        <div className="space-y-4">
          <div>
            <label htmlFor="columns" className="block text-sm font-medium text-zinc-400 mb-1">Columns</label>
            <input type="number" id="columns" value={cols} onChange={(e) => setCols(Math.max(1, parseInt(e.target.value, 10) || 1))} min="1" className="w-full bg-zinc-900 border border-subtle-border rounded-md px-3 py-2 text-main-text focus:outline-none focus:ring-2 focus:ring-accent" />
          </div>
          <div>
            <label htmlFor="rows" className="block text-sm font-medium text-zinc-400 mb-1">Body Rows</label>
            <input type="number" id="rows" value={rows} onChange={(e) => setRows(Math.max(0, parseInt(e.target.value, 10) || 0))} min="0" className="w-full bg-zinc-900 border border-subtle-border rounded-md px-3 py-2 text-main-text focus:outline-none focus:ring-2 focus:ring-accent" />
          </div>
        </div>
        <div className="mt-6 flex justify-end space-x-3">
          <button onClick={onClose} className="px-4 py-2 rounded-md bg-zinc-800 text-main-text hover:bg-zinc-700 transition-colors focus:outline-none focus:ring-2 focus:ring-zinc-600">Cancel</button>
          <button onClick={handleInsert} className="px-4 py-2 rounded-md bg-accent text-white hover:bg-amber-600 transition-colors focus:outline-none focus:ring-2 focus:ring-amber-400">Insert Table</button>
        </div>
      </div>
    </div>
  );
};


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
const Toolbar: React.FC<{ onAction: (item: Partial<ToolbarItem> & { action?: (params: ActionParams) => void; }) => void }> = ({ onAction }) => (
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
    onOpenTableDialog: () => void;
}
const Editor: React.FC<EditorProps> = ({ markdown, setMarkdown, textareaRef, className, onOpenTableDialog }) => {
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

        const newMarkdown = textBefore + textAfter;
        setMarkdown(newMarkdown);
        setSlashCommandState(null);

        setTimeout(() => {
            if (textareaRef.current) {
                textareaRef.current.focus();
                textareaRef.current.selectionStart = textareaRef.current.selectionEnd = triggerIndex;
                if (command.id === 'table') {
                    onOpenTableDialog();
                } else {
                    command.action({ textareaRef, markdown: newMarkdown, setMarkdown });
                }
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
  const cursorPositionRef = useRef(0);
  const [view, setView] = useState<'edit' | 'preview'>('edit');
  const [isTableDialogOpen, setTableDialogOpen] = useState(false);
  
  const openTableDialog = useCallback(() => {
    if (textareaRef.current) {
      cursorPositionRef.current = textareaRef.current.selectionStart;
    }
    setTableDialogOpen(true);
  }, []);

  const handleInsertTable = (tableString: string) => {
    if (!textareaRef.current || !tableString) {
      setTableDialogOpen(false);
      return;
    };

    const start = cursorPositionRef.current;
    
    const textBefore = markdown.substring(0, start);
    const prefix = (textBefore.length === 0 || textBefore.endsWith('\n\n')) ? '' : (textBefore.endsWith('\n') ? '\n' : '\n\n');

    const newMarkdown = markdown.substring(0, start) + prefix + tableString + markdown.substring(start);
    
    setMarkdown(newMarkdown);
    setTableDialogOpen(false);

    setTimeout(() => {
      textareaRef.current?.focus();
      const selectionStart = start + prefix.length + 2; // After "| "
      const headerText = 'Header 1';
      const selectionEnd = selectionStart + headerText.length;
      textareaRef.current?.setSelectionRange(selectionStart, selectionEnd);
    }, 0);
  };
  
  const handleToolbarAction = useCallback((item: Partial<ToolbarItem> & { action?: (params: ActionParams) => void }) => {
    if (item.id === 'table') {
      openTableDialog();
    } else if (item.action) {
      item.action({ textareaRef, markdown, setMarkdown });
    }
  }, [markdown, setMarkdown, openTableDialog]);

  return (
    <>
        <TableDialog isOpen={isTableDialogOpen} onClose={() => setTableDialogOpen(false)} onInsert={handleInsertTable} />
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
                        onOpenTableDialog={openTableDialog}
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