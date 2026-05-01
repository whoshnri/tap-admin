"use client";

import React, { useState, useEffect, useCallback, useRef, forwardRef, useImperativeHandle } from "react";
import { cn } from "@/lib/utils";
import {
  useEditor,
  EditorContent,
  Editor,
} from "@tiptap/react";
import { BubbleMenu } from "@tiptap/react/menus";
import { Markdown } from "@tiptap/markdown";
import { UploadDialog } from "@/components/upload/UploadDialog";
import StarterKit from "@tiptap/starter-kit";
import Underline from "@tiptap/extension-underline";
import { TextStyle } from "@tiptap/extension-text-style";
import { Color } from "@tiptap/extension-color";
import Highlight from "@tiptap/extension-highlight";
import TextAlign from "@tiptap/extension-text-align";
import Link from "@tiptap/extension-link";
import { TipTapResizableImage } from "./TipTapResizableImage";
import Placeholder from "@tiptap/extension-placeholder";
import CodeBlockLowlight from "@tiptap/extension-code-block-lowlight";
import { Table } from "@tiptap/extension-table";
import TableRow from "@tiptap/extension-table-row";
import TableCell from "@tiptap/extension-table-cell";
import TableHeader from "@tiptap/extension-table-header";
import TaskList from "@tiptap/extension-task-list";
import TaskItem from "@tiptap/extension-task-item";
import { createLowlight, common } from "lowlight";

// Languages for lowlight
import js from 'highlight.js/lib/languages/javascript';
import ts from 'highlight.js/lib/languages/typescript';
import python from 'highlight.js/lib/languages/python';
import css from 'highlight.js/lib/languages/css';
import html from 'highlight.js/lib/languages/xml';
import shell from 'highlight.js/lib/languages/shell';

import {
  Bold,
  Italic,
  Underline as UnderlineIcon,
  Strikethrough,
  Code,
  Type,
  Heading1,
  Heading2,
  Heading3,
  List,
  ListOrdered,
  CheckSquare,
  Quote,
  Code2,
  Undo,
  Redo,
  AlignLeft,
  AlignCenter,
  AlignRight,
  AlignJustify,
  Link as LinkIcon,
  Image as ImageIcon,
  Table as TableIcon,
  Download,
  Copy,
  Eye,
  Maximize2,
  Minimize2,
  ChevronDown,
  Palette,
  Highlighter,
  Minus,
  Plus,
  Trash2,
  FileText,
  Eraser,
  X
} from "lucide-react";

// --- Lowlight Setup ---
const lowlight = createLowlight(common);
lowlight.register('js', js);
lowlight.register('ts', ts);
lowlight.register('python', python);
lowlight.register('css', css);
lowlight.register('html', html);
lowlight.register('shell', shell);

// --- Brand Colors ---
const COLORS = {
  green: "#5C9952",
  darkGreen: "#2D4A29",
  orange: "#D97941",
  muted: "#4A4A4A",
  border: "#E2E8E0",
  toolbarBg: "#FAFBF9",
  hover: "#EFF6EE",
  active: "#DCF0D9",
  white: "#FFFFFF",
  black: "#000000",
  bubbleBg: "#FFFFFF",
};

// --- Props Interface ---
interface TipTapEditorProps {
  initialContent?: string;
  onChange?: (html: string) => void;
  onJsonChange?: (json: object) => void;
  onTextChange?: (text: string) => void;
  editable?: boolean;
  placeholder?: string;
  showWordCount?: boolean;
  showToolbar?: boolean;
  label?: string;
  minHeight?: number;
}

// --- Sub-components (Dropdowns, Pickers) ---

const ToolbarButton = ({
  onClick,
  active,
  disabled,
  title,
  children
}: {
  onClick: () => void;
  active?: boolean;
  disabled?: boolean;
  title: string;
  children: React.ReactNode
}) => (
  <button
    type="button"
    onMouseDown={(e) => { e.preventDefault(); onClick(); }}
    disabled={disabled}
    title={title}
    className={cn(
      "inline-flex shrink-0 items-center justify-center w-8 h-8 max-md:w-10 max-md:h-10 rounded-md border-none transition-all duration-200",
      disabled ? "opacity-40 cursor-not-allowed text-[#CCC]" : "cursor-pointer",
      active ? "bg-[#DCF0D9] text-[#2D4A29]" : "bg-transparent text-[#4A4A4A] hover:bg-[#EFF6EE]"
    )}
  >
    {children}
  </button>
);

const Dropdown = ({
  label,
  icon,
  children,
  active
}: {
  label?: string;
  icon: React.ReactNode;
  children: React.ReactNode;
  active?: boolean;
}) => {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  return (
    <div ref={ref} style={{ position: "relative", display: "inline-block" }}>
      <button
        type="button"
        onMouseDown={(e) => { e.preventDefault(); setOpen(!open); }}
        className={cn(
          "flex items-center shrink-0 gap-1.5 h-8 max-md:h-10 px-2 max-md:px-3 rounded-md border-none text-[13px] font-poppins transition-colors cursor-pointer text-[#4A4A4A]",
          active ? "bg-[#DCF0D9]" : open ? "bg-[#EFF6EE]" : "bg-transparent hover:bg-[#EFF6EE]"
        )}
      >
        {icon}
        {label && <span className="font-medium whitespace-nowrap">{label}</span>}
        <ChevronDown size={14} style={{ transform: open ? "rotate(180deg)" : "rotate(0deg)", transition: "0.2s" }} className="shrink-0" />
      </button>
      {open && (
        <>
          {typeof window !== 'undefined' && window.innerWidth < 768 && (
            <div 
              style={{ position: "fixed", inset: 0, zIndex: 9999, background: 'rgba(0,0,0,0.4)', left: 0, right: 0 }} 
              onMouseDown={(e) => { e.preventDefault(); e.stopPropagation(); setOpen(false); }} 
            />
          )}
          <div style={typeof window !== 'undefined' && window.innerWidth < 768 ? {
            position: "fixed",
            bottom: 0,
            left: 0,
            right: 0,
            zIndex: 10000,
            background: COLORS.white,
            borderTopLeftRadius: "24px",
            borderTopRightRadius: "24px",
            padding: "24px 20px 40px",
            boxShadow: "0 -10px 40px rgba(0,0,0,0.15)",
            maxHeight: "80vh",
            overflowY: "auto",
            display: "flex",
            flexDirection: "column",
            gap: "8px"
          } : {
            position: "absolute",
            top: "100%",
            left: 0,
            marginTop: "4px",
            background: COLORS.white,
            border: `1px solid ${COLORS.border}`,
            borderRadius: "8px",
            boxShadow: "0 10px 15px -3px rgba(0, 0, 0, 0.1)",
            zIndex: 100,
            minWidth: "160px",
            padding: "4px",
            display: "flex",
            flexDirection: "column",
          }}>
            {typeof window !== 'undefined' && window.innerWidth < 768 && (
              <div className="flex justify-center mb-4 shrink-0">
                <div className="w-12 h-1.5 bg-gray-200 rounded-full" />
              </div>
            )}
            {typeof window !== 'undefined' && window.innerWidth < 768 && label && (
              <div className="text-[11px] font-bold text-[#A0AAB2] uppercase tracking-wider mb-2 px-1 shrink-0">{label}</div>
            )}
            {React.Children.map(children, (child) =>
              React.isValidElement(child) ? React.cloneElement(child as React.ReactElement<any>, { close: () => setOpen(false) }) : child
            )}
          </div>
        </>
      )}
    </div>
  );
};

const DropdownItem = ({
  onClick,
  label,
  icon,
  active,
  close
}: {
  onClick: () => void;
  label: string;
  icon: React.ReactNode;
  active?: boolean;
  close?: () => void;
}) => (
  <button
    type="button"
    onMouseDown={(e) => {
      e.preventDefault();
      onClick();
      close?.();
    }}
    style={{
      display: "flex",
      alignItems: "center",
      gap: "8px",
      width: "100%",
      padding: "8px 12px",
      borderRadius: "4px",
      border: "none",
      background: active ? COLORS.active : "transparent",
      color: active ? COLORS.darkGreen : COLORS.muted,
      cursor: "pointer",
      textAlign: "left",
      fontSize: "13px",
      fontFamily: "'Poppins', sans-serif",
    }}
    onMouseEnter={(e) => {
      if (!active) e.currentTarget.style.background = COLORS.hover;
    }}
    onMouseLeave={(e) => {
      if (!active) e.currentTarget.style.background = "transparent";
    }}
  >
    {icon}
    {label}
  </button>
);

const InsertOption = ({
  onClick,
  label,
  icon,
}: {
  onClick: () => void;
  label: string;
  icon: React.ReactNode;
}) => (
  <button
    type="button"
    onMouseDown={(e) => {
      e.preventDefault();
      onClick();
    }}
    style={{
      display: "flex",
      alignItems: "center",
      gap: "10px",
      padding: "8px 12px",
      borderRadius: "8px",
      border: `1px solid transparent`,
      background: "transparent",
      color: COLORS.muted,
      cursor: "pointer",
      textAlign: "left",
      fontSize: "13px",
      fontFamily: "'Poppins', sans-serif",
      width: "100%",
    }}
    onMouseEnter={(e) => {
      e.currentTarget.style.background = COLORS.hover;
      e.currentTarget.style.color = COLORS.darkGreen;
    }}
    onMouseLeave={(e) => {
      e.currentTarget.style.background = "transparent";
      e.currentTarget.style.color = COLORS.muted;
    }}
  >
    <div style={{ color: COLORS.green }}>{icon}</div>
    {label}
  </button>
);

const ColorPicker = ({
  editor,
  type
}: {
  editor: Editor;
  type: 'text' | 'highlight'
}) => {
  const swatches = [
    "#000000", "#5C9952", "#D97941", "#EF4444",
    "#3B82F6", "#8B5CF6", "#F59E0B", "#10B981"
  ];

  return (
    <Dropdown
      icon={type === 'text' ? <Palette size={16} /> : <Highlighter size={16} />}
      active={type === 'text' ? editor.isActive('textStyle') : editor.isActive('highlight')}
    >
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "4px", padding: "4px" }}>
        {swatches.map((color) => (
          <button
            type="button"
            key={color}
            onMouseDown={(e) => {
              e.preventDefault();
              if (type === 'text') {
                editor.chain().focus().setColor(color).run();
              } else {
                editor.chain().focus().setHighlight({ color }).run();
              }
            }}
            style={{
              width: "24px",
              height: "24px",
              borderRadius: "4px",
              border: "1px solid #EEE",
              background: color,
              cursor: "pointer",
            }}
          />
        ))}
        <button
          type="button"
          onMouseDown={(e) => {
            e.preventDefault();
            if (type === 'text') {
              editor.chain().focus().unsetColor().run();
            } else {
              editor.chain().focus().unsetHighlight().run();
            }
          }}
          style={{
            gridColumn: "span 4",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: "6px",
            marginTop: "4px",
            padding: "6px",
            fontSize: "11px",
            fontWeight: "600",
            color: COLORS.muted,
            background: "#F5F5F5",
            border: "1px solid #EEE",
            borderRadius: "6px",
            cursor: "pointer",
            fontFamily: "'Poppins', sans-serif",
            transition: "all 0.2s"
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = "#EBEBEB";
            e.currentTarget.style.color = COLORS.green;
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = "#F5F5F5";
            e.currentTarget.style.color = COLORS.muted;
          }}
        >
          <Eraser size={14} />
          Clear {type === 'text' ? 'Color' : 'Highlight'}
        </button>
      </div>
    </Dropdown>
  );
};

// --- Main Component ---

const TipTapEditor = forwardRef<any, TipTapEditorProps>(({
  initialContent = "",
  onChange,
  onJsonChange,
  onTextChange,
  editable = true,
  placeholder = "Press 'Ctrl+I' to insert component, or start writing…",
  showWordCount = true,
  showToolbar = true,
  label,
  minHeight = 400,
}, ref) => {
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [previewMode, setPreviewMode] = useState(false);
  const [stats, setStats] = useState({ words: 0, chars: 0 });
  const [linkModal, setLinkModal] = useState<{ open: boolean; url: string; target: boolean } | null>(null);
  const [isUploadDialogOpen, setIsUploadDialogOpen] = useState(false);
  const [insertMenu, setInsertMenu] = useState<{ open: boolean, x: number, y: number } | null>(null);

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        codeBlock: false,
      }),
      Underline,
      TextStyle,
      Color,
      Highlight.configure({ multicolor: true }),
      TextAlign.configure({ types: ["heading", "paragraph"] }),
      Link.configure({
        openOnClick: false,
        HTMLAttributes: {
          class: 'tap-link',
        }
      }),
      TipTapResizableImage,
      Placeholder.configure({ placeholder, showOnlyCurrent: true, emptyNodeClass: 'is-empty' }),
      CodeBlockLowlight.configure({
        lowlight,
      }),
      Table.configure({ resizable: true }),
      TableRow,
      TableHeader,
      TableCell,
      TaskList,
      TaskItem.configure({ nested: true }),
      Markdown,
    ],
    editorProps: {
      handlePaste: (view, event) => {
        const text = event.clipboardData?.getData("text/plain");
        if (
          text &&
          (text.includes("# ") ||
            text.includes("## ") ||
            text.includes("- ") ||
            text.includes("* ") ||
            text.includes("```") ||
            (text.includes("[") && text.includes("](")))
        ) {
          if (editor) {
            editor.commands.insertContent(text, { contentType: "markdown" });
            return true;
          }
        }
        return false;
      },
      handleKeyDown: (view, event) => {
        if (event.key.toLowerCase() === 'i' && (event.ctrlKey || event.metaKey)) {
          event.preventDefault();
          const { bottom, left } = view.coordsAtPos(view.state.selection.from);
          const isMobile = window.innerWidth < 768;
          const adjustedLeft = left + 320 > window.innerWidth ? window.innerWidth - 340 : left;
          setInsertMenu({ open: true, x: isMobile ? 0 : adjustedLeft, y: isMobile ? 0 : bottom + 4 });
          return true;
        }
        if (event.key === '/') {
          const { $from, empty } = view.state.selection;
          // Trigger if typing '/' on an empty line
          if (empty && $from.parent.textContent.trim() === '') {
            event.preventDefault();
            const { bottom, left } = view.coordsAtPos(view.state.selection.from);
            const isMobile = window.innerWidth < 768;
            const adjustedLeft = left + 320 > window.innerWidth ? window.innerWidth - 340 : left;
            setInsertMenu({ open: true, x: isMobile ? 0 : adjustedLeft, y: isMobile ? 0 : bottom + 4 });
            return true;
          }
        }
        if (event.key === "Escape") {
          setInsertMenu(null);
        }
        return false;
      },
      attributes: {
        class: "focus:outline-none",
        lang: "en-GB",
        spellcheck: "true",
      },
    },
    content: initialContent,
    editable,
    immediatelyRender: false,
    onUpdate: ({ editor }) => {
      const html = editor.getHTML();
      const json = editor.getJSON();
      const text = editor.getText();

      onChange?.(html);
      onJsonChange?.(json);
      onTextChange?.(text);

      // Update stats
      const wordCount = text.trim() ? text.trim().split(/\s+/).length : 0;
      setStats({ words: wordCount, chars: text.length });
    },
  });

  useImperativeHandle(ref, () => ({
    focus() {
      editor?.commands.focus();
    }
  }), [editor]);

  // Handle outside clicks for medals (simplified for this structure)
  const modalRef = useRef<HTMLDivElement>(null);

  const insertLink = useCallback(() => {
    if (!editor) return;
    if (editor.isActive('link')) {
      editor.chain().focus().unsetLink().run();
      return;
    }
    const previousUrl = editor.getAttributes('link').href;
    setLinkModal({ open: true, url: previousUrl || "", target: true });
  }, [editor]);

  const insertImage = useCallback(() => {
    setIsUploadDialogOpen(true);
  }, []);

  const handleExport = (format: 'html' | 'txt' | 'copy-html' | 'copy-txt') => {
    if (!editor) return;
    const html = editor.getHTML();
    const text = editor.getText();

    if (format === 'html' || format === 'txt') {
      const blob = new Blob([format === 'html' ? html : text], { type: format === 'html' ? 'text/html' : 'text/plain' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `document.${format}`;
      a.click();
      URL.revokeObjectURL(url);
    } else if (format === 'copy-html') {
      navigator.clipboard.writeText(html);
    } else {
      navigator.clipboard.writeText(text);
    }
  };

  if (!editor) return null;

  return (
    <div className={cn(
      "w-full flex flex-col bg-white overflow-visible font-poppins",
      isFullscreen ? "fixed inset-0" : "relative rounded-xl border border-[#E2E8E0]"
    )}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Poppins:wght@300;400;500;600;700&display=swap');
      `}</style>

      {/* {label && (
        <div style={{ padding: "12px 16px 0", fontSize: "14px", fontWeight: "600", color: COLORS.darkGreen }}>
          {label}
        </div>
      )} */}

      {showToolbar && (
        <div className="flex items-center flex-wrap gap-0.5 max-md:gap-1 p-2 max-md:py-2.5 max-md:px-2 bg-[#FAFBF9] border-b border-[#E2E8E0] sticky top-0 z-30 max-md:fixed max-md:bottom-0 max-md:top-auto max-md:left-0 max-md:right-0 max-md:flex-nowrap max-md:overflow-x-auto max-md:border-t max-md:shadow-[0_-4px_10px_rgba(0,0,0,0.05)] hide-scrollbar">
          {!previewMode ? (
            <>
              {/* Block type */}
              <Dropdown icon={<Type size={16} />} label="Text Style">
                <DropdownItem icon={<Type size={14} />} label="Paragraph" active={editor.isActive('paragraph')} onClick={() => editor.chain().focus().setParagraph().run()} />
                <DropdownItem icon={<Heading1 size={14} />} label="Heading 1" active={editor.isActive('heading', { level: 1 })} onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()} />
                <DropdownItem icon={<Heading2 size={14} />} label="Heading 2" active={editor.isActive('heading', { level: 2 })} onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()} />
                <DropdownItem icon={<Heading3 size={14} />} label="Heading 3" active={editor.isActive('heading', { level: 3 })} onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()} />
                <DropdownItem icon={<List size={14} />} label="Bullet List" active={editor.isActive('bulletList')} onClick={() => editor.chain().focus().toggleBulletList().run()} />
                <DropdownItem icon={<ListOrdered size={14} />} label="Numbered List" active={editor.isActive('orderedList')} onClick={() => editor.chain().focus().toggleOrderedList().run()} />
                <DropdownItem icon={<CheckSquare size={14} />} label="Checklist" active={editor.isActive('taskList')} onClick={() => editor.chain().focus().toggleTaskList().run()} />
                <DropdownItem icon={<Quote size={14} />} label="Blockquote" active={editor.isActive('blockquote')} onClick={() => editor.chain().focus().toggleBlockquote().run()} />
                <DropdownItem icon={<Code2 size={14} />} label="Code Block" active={editor.isActive('codeBlock')} onClick={() => editor.chain().focus().toggleCodeBlock().run()} />
              </Dropdown>

              <div style={{ width: "1px", height: "20px", background: COLORS.border, margin: "0 4px" }} />

              {/* History */}
              <ToolbarButton onClick={() => editor.chain().focus().undo().run()} disabled={!editor.can().undo()} title="Undo"><Undo size={16} /></ToolbarButton>
              <ToolbarButton onClick={() => editor.chain().focus().redo().run()} disabled={!editor.can().redo()} title="Redo"><Redo size={16} /></ToolbarButton>

              <div style={{ width: "1px", height: "20px", background: COLORS.border, margin: "0 4px" }} />

              {/* Inline styles */}
              <ToolbarButton onClick={() => editor.chain().focus().toggleBold().run()} active={editor.isActive('bold')} title="Bold"><Bold size={16} /></ToolbarButton>
              <ToolbarButton onClick={() => editor.chain().focus().toggleItalic().run()} active={editor.isActive('italic')} title="Italic"><Italic size={16} /></ToolbarButton>
              <ToolbarButton onClick={() => editor.chain().focus().toggleUnderline().run()} active={editor.isActive('underline')} title="Underline"><UnderlineIcon size={16} /></ToolbarButton>
              <ToolbarButton onClick={() => editor.chain().focus().toggleStrike().run()} active={editor.isActive('strike')} title="Strikethrough"><Strikethrough size={16} /></ToolbarButton>
              <ToolbarButton onClick={() => editor.chain().focus().toggleCode().run()} active={editor.isActive('code')} title="Inline Code"><Code size={16} /></ToolbarButton>

              <div className="shrink-0" style={{ width: "1px", height: "20px", background: COLORS.border, margin: "0 4px" }} />

              {/* Colors */}
              <ColorPicker editor={editor} type="text" />
              <ColorPicker editor={editor} type="highlight" />

              <div className="shrink-0" style={{ width: "1px", height: "20px", background: COLORS.border, margin: "0 4px" }} />

              {/* Alignment */}
              <ToolbarButton onClick={() => editor.chain().focus().setTextAlign('left').run()} active={editor.isActive({ textAlign: 'left' })} title="Align Left"><AlignLeft size={16} /></ToolbarButton>
              <ToolbarButton onClick={() => editor.chain().focus().setTextAlign('center').run()} active={editor.isActive({ textAlign: 'center' })} title="Align Center"><AlignCenter size={16} /></ToolbarButton>
              <ToolbarButton onClick={() => editor.chain().focus().setTextAlign('right').run()} active={editor.isActive({ textAlign: 'right' })} title="Align Right"><AlignRight size={16} /></ToolbarButton>
              <ToolbarButton onClick={() => editor.chain().focus().setTextAlign('justify').run()} active={editor.isActive({ textAlign: 'justify' })} title="Align Justify"><AlignJustify size={16} /></ToolbarButton>

              <div className="shrink-0" style={{ width: "1px", height: "20px", background: COLORS.border, margin: "0 4px" }} />

              {/* Clear Formatting */}
              <ToolbarButton onClick={() => editor.chain().focus().unsetAllMarks().clearNodes().run()} title="Clear Formatting"><X size={16} /></ToolbarButton>

              <div className="shrink-0" style={{ width: "1px", height: "20px", background: COLORS.border, margin: "0 4px" }} />

              {/* Links & Media */}
              <ToolbarButton onClick={insertLink} active={editor.isActive('link')} title="Insert Link"><LinkIcon size={16} /></ToolbarButton>
              <ToolbarButton onClick={insertImage} title="Insert Image"><ImageIcon size={16} /></ToolbarButton>
              <ToolbarButton onClick={() => editor.chain().focus().setHorizontalRule().run()} title="Horizontal Rule"><Minus size={16} /></ToolbarButton>

              <div className="shrink-0" style={{ width: "1px", height: "20px", background: COLORS.border, margin: "0 4px" }} />

              {/* Table */}
              <Dropdown icon={<TableIcon size={16} />} active={editor.isActive('table')}>
                {!editor.isActive('table') ? (
                  <>
                    <DropdownItem icon={<Plus size={14} />} label="Insert 2×2" onClick={() => editor.chain().focus().insertTable({ rows: 2, cols: 2, withHeaderRow: true }).run()} />
                    <DropdownItem icon={<Plus size={14} />} label="Insert 3×3" onClick={() => editor.chain().focus().insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run()} />
                    <DropdownItem icon={<Plus size={14} />} label="Insert 4×4" onClick={() => editor.chain().focus().insertTable({ rows: 4, cols: 4, withHeaderRow: true }).run()} />
                  </>
                ) : (
                  <>
                    <DropdownItem icon={<Plus size={14} />} label="Add Row Above" onClick={() => editor.chain().focus().addRowBefore().run()} />
                    <DropdownItem icon={<Plus size={14} />} label="Add Row Below" onClick={() => editor.chain().focus().addRowAfter().run()} />
                    <DropdownItem icon={<Plus size={14} />} label="Add Column Before" onClick={() => editor.chain().focus().addColumnBefore().run()} />
                    <DropdownItem icon={<Plus size={14} />} label="Add Column After" onClick={() => editor.chain().focus().addColumnAfter().run()} />
                    <DropdownItem icon={<Trash2 size={14} />} label="Delete Row" onClick={() => editor.chain().focus().deleteRow().run()} />
                    <DropdownItem icon={<Trash2 size={14} />} label="Delete Column" onClick={() => editor.chain().focus().deleteColumn().run()} />
                    <DropdownItem icon={<Trash2 size={14} />} label="Delete Table" onClick={() => editor.chain().focus().deleteTable().run()} />
                  </>
                )}
              </Dropdown>

              <div style={{ flex: 1 }} />

              {/* Export & Mode */}
              <Dropdown icon={<Download size={16} />} label="Export">
                <DropdownItem icon={<FileText size={14} />} label="Download HTML" onClick={() => handleExport('html')} />
                <DropdownItem icon={<FileText size={14} />} label="Download .txt" onClick={() => handleExport('txt')} />
                <DropdownItem icon={<Copy size={14} />} label="Copy HTML" onClick={() => handleExport('copy-html')} />
                <DropdownItem icon={<Copy size={14} />} label="Copy Text" onClick={() => handleExport('copy-txt')} />
              </Dropdown>
            </>
          ) : (
            <>
              <div style={{ flex: 1 }} />
              <div style={{ display: "flex", alignItems: "center", gap: "8px", color: COLORS.green, fontSize: "12px", fontWeight: "600", marginRight: "12px" }}>
                PREVIEW MODE ACTIVE
              </div>
            </>
          )}

          <ToolbarButton onClick={() => setPreviewMode(!previewMode)} active={previewMode} title="Preview Mode"><Eye size={16} /></ToolbarButton>

        </div>
      )}

      {/* --- Bubble Menu --- */}
      {editor && !previewMode && (
        <BubbleMenu
          editor={editor}
          appendTo={() => document.body}
          updateDelay={10}
          options={{
            placement: "top",
          }}
          shouldShow={({ editor, state }) => {
            // Hide bubble menu when an image is selected
            if (editor.isActive('imageResize') || editor.isActive('image')) return false;
            // Only show when there is a text selection
            const { from, to } = state.selection;
            return from !== to;
          }}
        >
          <div className="flex items-center gap-0.5 p-1 z-100 bg-white border border-[#E2E8E0] rounded-lg shadow-xl mb-2">
            <ToolbarButton onClick={() => editor.chain().focus().toggleBold().run()} active={editor.isActive('bold')} title="Bold"><Bold size={14} /> </ToolbarButton>
            <ToolbarButton onClick={() => editor.chain().focus().toggleItalic().run()} active={editor.isActive('italic')} title="Italic"><Italic size={14} /> </ToolbarButton>
            <ToolbarButton onClick={() => editor.chain().focus().toggleUnderline().run()} active={editor.isActive('underline')} title="Underline"><UnderlineIcon size={14} /></ToolbarButton>
            <ToolbarButton onClick={() => editor.chain().focus().toggleStrike().run()} active={editor.isActive('strike')} title="Strikethrough"><Strikethrough size={14} /> </ToolbarButton>
            <ToolbarButton onClick={() => editor.chain().focus().toggleCode().run()} active={editor.isActive('code')} title="Inline Code"><Code size={14} /> </ToolbarButton>
            <ToolbarButton onClick={insertLink} active={editor.isActive('link')} title="Link"><LinkIcon size={14} /> </ToolbarButton>

            {editor.isActive('table') && (
              <>
                <div style={{ width: "1px", height: "20px", background: COLORS.border, margin: "0 4px" }} />
                <ToolbarButton onClick={() => editor.chain().focus().addRowAfter().run()} title="Add Row Below">
                  <div style={{ position: "relative", display: "flex", alignItems: "center" }}>
                    <Plus size={10} style={{ position: "absolute", top: -2, right: -2, zIndex: 1 }} />
                    <TableIcon size={14} />
                  </div>
                </ToolbarButton>
                <ToolbarButton onClick={() => editor.chain().focus().addColumnAfter().run()} title="Add Column Right">
                  <div style={{ position: "relative", display: "flex", alignItems: "center", transform: "rotate(90deg)" }}>
                    <Plus size={10} style={{ position: "absolute", top: -2, right: -2, zIndex: 1, transform: "rotate(-90deg)" }} />
                    <TableIcon size={14} />
                  </div>
                </ToolbarButton>
                <div style={{ width: "1px", height: "20px", background: COLORS.border, margin: "0 4px" }} />
                <ToolbarButton onClick={() => editor.chain().focus().deleteRow().run()} title="Delete Row">
                  <div style={{ position: "relative", display: "flex", alignItems: "center" }}>
                    <X size={10} style={{ position: "absolute", top: -2, right: -2, zIndex: 1, color: "#EF4444" }} />
                    <TableIcon size={14} />
                  </div>
                </ToolbarButton>
                <ToolbarButton onClick={() => editor.chain().focus().deleteColumn().run()} title="Delete Column">
                  <div style={{ position: "relative", display: "flex", alignItems: "center", transform: "rotate(90deg)" }}>
                    <X size={10} style={{ position: "absolute", top: -2, right: -2, zIndex: 1, transform: "rotate(-90deg)", color: "#EF4444" }} />
                    <TableIcon size={14} />
                  </div>
                </ToolbarButton>
              </>
            )}
          </div>
        </BubbleMenu>
      )}

      {/* --- Editor Area --- */}
      <div
        className="flex-1 overflow-y-auto overflow-x-hidden bg-white relative"
        style={{ minHeight: `${minHeight}px` }}
      >
        {previewMode ? (
          <div
            className="tap-prose"
            style={{ padding: "40px", lineHeight: "1.7", color: COLORS.darkGreen }}
            dangerouslySetInnerHTML={{ __html: editor.getHTML() }}
          />
        ) : (
          <EditorContent
            editor={editor}
            className="tap-prose"
            style={{ outline: "none" }}
          />
        )}
      </div>

      {/* --- Footer --- */}
      {showWordCount && (
        <div style={{
          padding: "8px 16px",
          borderTop: `1px solid ${COLORS.border}`,
          background: COLORS.toolbarBg,
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          fontSize: "11px",
          color: "#888",
          letterSpacing: "0.5px",
        }}>
          <div>
            WORDS: <span style={{ color: COLORS.green, fontWeight: "700" }}>{stats.words}</span> |
            CHARS: <span style={{ color: COLORS.green, fontWeight: "700" }}>{stats.chars}</span>
          </div>

        </div>
      )}

      {/* --- Modals for Link/Image --- */}
      {linkModal?.open && (
        <div style={{ position: "fixed", inset: 0, zIndex: 10000, display: "flex", alignItems: "center", justifyContent: "center", background: "rgba(0,0,0,0.4)", backdropFilter: "blur(4px)" }}>
          <div style={{ background: COLORS.white, padding: "28px", borderRadius: "16px", width: "360px", boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.25)", border: `1px solid ${COLORS.border}` }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "20px" }}>
              <h3 style={{ margin: 0, fontSize: "18px", fontWeight: "700", color: COLORS.darkGreen }}>Insert Link</h3>
              <button type="button" onMouseDown={(e) => { e.preventDefault(); setLinkModal(null); }} style={{ border: "none", background: "transparent", cursor: "pointer", color: COLORS.muted }}><X size={20} /></button>
            </div>
            <div style={{ marginBottom: "16px" }}>
              <label style={{ display: "block", fontSize: "12px", fontWeight: "600", color: COLORS.muted, marginBottom: "6px", textTransform: "uppercase", letterSpacing: "0.05em" }}>URL</label>
              <input
                type="text"
                placeholder="https://example.com"
                value={linkModal.url}
                onChange={(e) => setLinkModal({ ...linkModal, url: e.target.value })}
                style={{ width: "100%", padding: "12px", borderRadius: "8px", border: `1px solid ${COLORS.border}`, background: "#F9FAF9", fontSize: "14px", outline: "none", color: COLORS.black }}
                autoFocus
              />
            </div>
            <label style={{ display: "flex", alignItems: "center", gap: "10px", fontSize: "14px", color: COLORS.muted, marginBottom: "24px", cursor: "pointer" }}>
              <input type="checkbox" checked={linkModal.target} onChange={(e) => setLinkModal({ ...linkModal, target: e.target.checked })} style={{ width: "16px", height: "16px", accentColor: COLORS.green }} />
              Open in new tab
            </label>
            <div style={{ display: "flex", gap: "10px" }}>
              <button
                type="button"
                onClick={() => setLinkModal(null)}
                style={{ flex: 1, padding: "12px", borderRadius: "8px", border: `1px solid ${COLORS.border}`, background: COLORS.white, color: COLORS.muted, fontWeight: "600", cursor: "pointer", fontSize: "14px" }}
              >Cancel</button>
              <button
                type="button"
                onClick={() => {
                  if (linkModal.url) {
                    editor.chain().focus().setLink({ href: linkModal.url, target: linkModal.target ? "_blank" : "_self" }).run();
                  }
                  setLinkModal(null);
                }}
                style={{ flex: 1, padding: "12px", borderRadius: "8px", border: "none", background: COLORS.green, color: COLORS.white, fontWeight: "600", cursor: "pointer", fontSize: "14px" }}
              >Apply Link</button>
            </div>
          </div>
        </div>
      )}

      <UploadDialog
        isOpen={isUploadDialogOpen}
        onOpenChange={setIsUploadDialogOpen}
        title="Insert Image"
        description="Select or drag and drop an image to insert."
        accept="image/*"
        onUploadComplete={(url) => {
          if (url) {
            editor.chain().focus().setImage({ src: url, alt: "Blog Media" }).run();
          }
          setIsUploadDialogOpen(false);
        }}
      />

      {/* --- Insert Menu Bubble --- */}
      {insertMenu?.open && (
        <>
          <div 
            style={{ position: "fixed", inset: 0, zIndex: 9999, background: typeof window !== 'undefined' && window.innerWidth < 768 ? 'rgba(0,0,0,0.4)' : 'transparent' }} 
            onMouseDown={(e) => { e.preventDefault(); setInsertMenu(null); }} 
          />
          <div 
            onMouseDown={(e) => e.stopPropagation()}
            style={{ 
              position: "fixed", 
              zIndex: 10000, 
              ...(typeof window !== 'undefined' && window.innerWidth < 768 
                ? { bottom: 0, left: 0, right: 0, backgroundColor: COLORS.white, borderTopLeftRadius: '24px', borderTopRightRadius: '24px', padding: '24px 20px 40px', maxHeight: '80vh', overflowY: 'auto', boxShadow: "0 -10px 40px rgba(0,0,0,0.15)" }
                : { left: insertMenu.x, top: insertMenu.y, backgroundColor: COLORS.white, borderRadius: '12px', padding: '12px', border: `1px solid ${COLORS.border}`, boxShadow: "0 10px 15px -3px rgba(0, 0, 0, 0.1)", width: "320px" }
              )
            }}
          >
            {typeof window !== 'undefined' && window.innerWidth < 768 && (
              <div className="flex justify-center mb-6">
                <div className="w-12 h-1.5 bg-gray-200 rounded-full" />
              </div>
            )}
            <div style={{ fontSize: "11px", fontWeight: "700", color: "#A0AAB2", textTransform: "uppercase", letterSpacing: "0.5px", marginBottom: "8px", paddingLeft: "4px" }}>
              Insert Component
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "4px" }}>
              <InsertOption icon={<LinkIcon size={16} />} label="Link" onClick={() => { setInsertMenu(null); insertLink(); }} />
              <InsertOption icon={<ImageIcon size={16} />} label="Image" onClick={() => { setInsertMenu(null); insertImage(); }} />
              <InsertOption icon={<Minus size={16} />} label="Divider" onClick={() => { editor.chain().focus().setHorizontalRule().run(); setInsertMenu(null); }} />
              <InsertOption icon={<TableIcon size={16} />} label="Table" onClick={() => { editor.chain().focus().insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run(); setInsertMenu(null); }} />
              <InsertOption icon={<List size={16} />} label="Bullet List" onClick={() => { editor.chain().focus().toggleBulletList().run(); setInsertMenu(null); }} />
              <InsertOption icon={<ListOrdered size={16} />} label="Numbered" onClick={() => { editor.chain().focus().toggleOrderedList().run(); setInsertMenu(null); }} />
              <InsertOption icon={<CheckSquare size={16} />} label="Checklist" onClick={() => { editor.chain().focus().toggleTaskList().run(); setInsertMenu(null); }} />
              <InsertOption icon={<Code2 size={16} />} label="Code Block" onClick={() => { editor.chain().focus().toggleCodeBlock().run(); setInsertMenu(null); }} />
              <InsertOption icon={<Quote size={16} />} label="Quote" onClick={() => { editor.chain().focus().toggleBlockquote().run(); setInsertMenu(null); }} />
            </div>
          </div>
        </>
      )}

      {/* --- Prose Styles --- */}
      <style jsx global>{`
        .hide-scrollbar::-webkit-scrollbar {
          display: none;
        }
        .hide-scrollbar {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
        .tap-prose {
          padding: 40px;
          min-height: 400px;
        }
        .tap-prose .ProseMirror {
          min-height: 400px;
          outline: none;
        }
        .tap-prose h1 { font-size: 2.5rem; font-weight: 700; margin-top: 1.5rem; margin-bottom: 1rem; color: ${COLORS.darkGreen}; }
        .tap-prose h2 { font-size: 2rem; font-weight: 700; margin-top: 1.25rem; margin-bottom: 0.75rem; color: ${COLORS.darkGreen}; }
        .tap-prose h3 { font-size: 1.5rem; font-weight: 600; margin-top: 1rem; margin-bottom: 0.5rem; color: ${COLORS.darkGreen}; }
        .tap-prose p { margin-bottom: 1rem; line-height: 1.7; color: #374151; }
        
        .tap-prose ul { list-style-type: disc; padding-left: 1.5rem; margin-bottom: 1rem; }
        .tap-prose ol { list-style-type: decimal; padding-left: 1.5rem; margin-bottom: 1rem; }
        .tap-prose li { margin-bottom: 0.5rem; }

        .tap-prose blockquote {
          border-left: 4px solid ${COLORS.green};
          padding-left: 1rem;
          margin-left: 0;
          font-style: italic;
          color: ${COLORS.muted};
          margin-bottom: 1.5rem;
        }

        .tap-prose code {
          background: #f3f4f6;
          padding: 0.2rem 0.4rem;
          border-radius: 4px;
          font-family: monospace;
          color: ${COLORS.orange};
          font-size: 0.9em;
        }

        .tap-prose pre {
          background: #1f2937;
          color: #f8f8f2;
          padding: 1.5rem;
          border-radius: 8px;
          overflow-x: auto;
          margin-bottom: 1.5rem;
          font-family: 'JetBrains Mono', 'Fira Code', monospace;
        }

        .tap-prose a {
          color: ${COLORS.green};
          text-decoration: underline;
          font-weight: 500;
          cursor: pointer;
        }

        .tap-prose img {
          max-width: 100%;
          height: auto;
          border-radius: 12px;
        }

        /* Image Resize Extension - Container & Wrapper */
        .tap-prose div[style*="cursor: pointer"] {
          overflow: visible !important;
          position: relative;
        }

        .tap-prose .ProseMirror img {
          display: block;
          cursor: pointer;
        }

        /* Resize corner dots */
        .tap-prose div[style*="cursor: pointer"] > div[style*="border-radius: 50%"] {
          background: white !important;
          z-index: 50 !important;
        }

        /* Position controller bar */
        .tap-prose div[style*="cursor: pointer"] > div[style*="transform: translate"] {
          z-index: 50 !important;
        }

        .tap-prose table {
          border-collapse: collapse;
          table-layout: fixed;
          width: 100%;
          margin: 2rem 0;
          overflow: hidden;
        }

        .tap-prose table td, .tap-prose table th {
          border: 1px solid ${COLORS.border};
          box-sizing: border-box;
          min-width: 1em;
          padding: 10px 12px;
          position: relative;
          vertical-align: top;
        }

        .tap-prose table th {
          background: #f9fafb;
          font-weight: 700;
          text-align: left;
        }

        .tap-prose table tr:nth-child(even) {
          background: #fafbf9;
        }

        .tap-prose .selectedCell:after {
          background: rgba(92, 153, 82, 0.1);
          content: "";
          left: 0;
          right: 0;
          top: 0;
          bottom: 0;
          pointer-events: none;
          position: absolute;
          z-index: 2;
        }

        .ProseMirror .column-resizer {
          background-color: ${COLORS.green};
          bottom: -2px;
          opacity: 0;
          pointer-events: none;
          position: absolute;
          right: -2px;
          top: 0;
          width: 4px;
          transition: background-color 0.2s, opacity 0.2s;
          z-index: 10;
        }

        .ProseMirror .column-resizer:hover {
          opacity: 1;
        }

        .ProseMirror.resize-cursor {
          cursor: col-resize;
        }

        /* Show resizer handles on hover of a cell */
        .tap-prose table td:hover .column-resizer,
        .tap-prose table th:hover .column-resizer {
          opacity: 0.3;
        }

        .tap-prose table td:hover .column-resizer:hover,
        .tap-prose table th:hover .column-resizer:hover {
          background-color: ${COLORS.orange};
          opacity: 1;
        }

        .tap-prose hr {
          border: none;
          border-top: 1px solid ${COLORS.border};
          margin: 2rem 0;
        }

        /* Task List */
        .tap-prose ul[data-type="taskList"] {
          list-style: none;
          padding: 0;
        }
        .tap-prose ul[data-type="taskList"] li {
          display: flex;
          align-items: flex-start;
          gap: 12px;
          margin-bottom: 8px;
        }
        .tap-prose ul[data-type="taskList"] input[type="checkbox"] {
          margin-top: 6px;
          accent-color: ${COLORS.green};
          width: 16px;
          height: 16px;
          cursor: pointer;
        }

        /* Placeholder */
        .ProseMirror p.is-empty::before {
          content: attr(data-placeholder);
          float: left;
          color: #adb5bd;
          pointer-events: none;
          height: 0;
        }

        /* Syntax Highlighting */
        .hljs-comment, .hljs-quote { color: #6a737d; font-style: italic; }
        .hljs-keyword, .hljs-selector-tag { color: #d73a49; }
        .hljs-string, .hljs-doctag, .hljs-type { color: #032f62; }
        .hljs-title, .hljs-section, .hljs-name { color: #6f42c1; }
        .hljs-variable, .hljs-template-variable { color: #e36209; }
        .hljs-bullet, .hljs-number { color: #005cc5; }
        .hljs-attr, .hljs-attribute { color: #005cc5; }
        .hljs-symbol, .hljs-link { color: #005cc5; }
      `}</style>
    </div>
  );
});

TipTapEditor.displayName = "TipTapEditor";

export default TipTapEditor;
