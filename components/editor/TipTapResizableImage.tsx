"use client";

import { mergeAttributes } from '@tiptap/core';
import { ReactNodeViewRenderer, NodeViewWrapper, NodeViewProps } from '@tiptap/react';
import Image from '@tiptap/extension-image';
import React, { useRef, useState } from 'react';

const ResizableImageComponent = (props: NodeViewProps) => {
  const { node, updateAttributes, selected } = props;
  const wrapperRef = useRef<HTMLDivElement>(null);

  const startResize = (e: React.MouseEvent<HTMLDivElement>, direction: 'nw' | 'ne' | 'sw' | 'se' | 'n' | 'e' | 's' | 'w') => {
    e.preventDefault();
    e.stopPropagation();
    
    const startX = e.pageX;
    const startY = e.pageY;
    const startWidth = wrapperRef.current?.offsetWidth || 0;
    const startHeight = wrapperRef.current?.offsetHeight || 0;

    const onMouseMove = (moveEvent: globalThis.MouseEvent) => {
      const deltaX = moveEvent.pageX - startX;
      const deltaY = moveEvent.pageY - startY;

      let newWidth = startWidth;
      let newHeight = startHeight;

      if (['nw', 'ne', 'sw', 'se'].includes(direction)) {
        // Proportional scaling for corners
        const ratio = startHeight / startWidth;
        if (direction.includes('e')) newWidth = startWidth + deltaX;
        if (direction.includes('w')) newWidth = startWidth - deltaX;
        newHeight = newWidth * ratio;
      } else {
        // 1-axis stretching for edges
        if (direction.includes('e')) newWidth = startWidth + deltaX;
        if (direction.includes('w')) newWidth = startWidth - deltaX;
        if (direction.includes('s')) newHeight = startHeight + deltaY;
        if (direction.includes('n')) newHeight = startHeight - deltaY;
      }
      
      requestAnimationFrame(() => {
        if (wrapperRef.current) {
          if (direction !== 'n' && direction !== 's') {
            wrapperRef.current.style.width = `${Math.max(50, newWidth)}px`;
          }
          if (direction !== 'e' && direction !== 'w') {
            wrapperRef.current.style.height = `${Math.max(50, newHeight)}px`;
          }
        }
      });
    };

    const onMouseUp = () => {
      document.removeEventListener('mousemove', onMouseMove);
      document.removeEventListener('mouseup', onMouseUp);
      
      // Save final width and height to node attributes
      if (wrapperRef.current) {
        updateAttributes({ 
          width: wrapperRef.current.style.width,
          height: wrapperRef.current.style.height
        });
      }
    };

    document.addEventListener('mousemove', onMouseMove);
    document.addEventListener('mouseup', onMouseUp);
  };

  const align = node.attrs.align || 'center';
  const width = node.attrs.width || 'auto';
  const height = node.attrs.height || 'auto';

  const w = parseFloat(width);
  const h = parseFloat(height);
  const hasDimensions = !isNaN(w) && !isNaN(h) && typeof width === 'string' && width.includes('px') && typeof height === 'string' && height.includes('px');

  return (
    <NodeViewWrapper 
      as="div"
      style={{
        display: 'flex',
        justifyContent: align === 'center' ? 'center' : align === 'right' ? 'flex-end' : 'flex-start',
        margin: '2rem 0'
      }}
    >
      <div 
        ref={wrapperRef}
        className={`relative inline-block ${selected ? 'ring-2 ring-[#5C9952] ring-offset-2 rounded-none' : ''}`}
        style={{ width: width, height: hasDimensions ? 'auto' : height, aspectRatio: hasDimensions ? `${w} / ${h}` : 'auto', maxWidth: '100%' }}
      >
        <img 
          src={node.attrs.src} 
          alt={node.attrs.alt} 
          title={node.attrs.title}
          className="rounded-none block cursor-pointer"
          style={{ width: '100%', height: '100%', objectFit: 'fill' }}
        />
        
        {/* Resize Handles (only show when selected) */}
        {selected && (
          <>
            {/* Alignment Toolbar */}
            <div className="absolute -top-12 left-1/2 -translate-x-1/2 bg-white flex items-center gap-1 p-1 rounded-lg shadow-lg border border-gray-200 z-50">
              <button
                onClick={(e) => { e.preventDefault(); updateAttributes({ align: 'left' }); }}
                className={`p-1.5 rounded hover:bg-gray-100 ${align === 'left' ? 'text-[#5C9952]' : 'text-gray-600'}`}
                title="Align Left"
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="21" y1="6" x2="3" y2="6"/><line x1="15" y1="12" x2="3" y2="12"/><line x1="17" y1="18" x2="3" y2="18"/></svg>
              </button>
              <button
                onClick={(e) => { e.preventDefault(); updateAttributes({ align: 'center' }); }}
                className={`p-1.5 rounded hover:bg-gray-100 ${align === 'center' ? 'text-[#5C9952]' : 'text-gray-600'}`}
                title="Align Center"
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="21" y1="6" x2="3" y2="6"/><line x1="18" y1="12" x2="6" y2="12"/><line x1="21" y1="18" x2="3" y2="18"/></svg>
              </button>
              <button
                onClick={(e) => { e.preventDefault(); updateAttributes({ align: 'right' }); }}
                className={`p-1.5 rounded hover:bg-gray-100 ${align === 'right' ? 'text-[#5C9952]' : 'text-gray-600'}`}
                title="Align Right"
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="21" y1="6" x2="3" y2="6"/><line x1="21" y1="12" x2="9" y2="12"/><line x1="21" y1="18" x2="5" y2="18"/></svg>
              </button>
            </div>

            {/* Top Edge */}
            <div className="absolute -top-1.5 left-1/2 -translate-x-1/2 w-4 h-3 bg-white border-2 border-[#5C9952] rounded-full cursor-ns-resize z-10 shadow-sm" onMouseDown={(e) => startResize(e, 'n')} />
            {/* Bottom Edge */}
            <div className="absolute -bottom-1.5 left-1/2 -translate-x-1/2 w-4 h-3 bg-white border-2 border-[#5C9952] rounded-full cursor-ns-resize z-10 shadow-sm" onMouseDown={(e) => startResize(e, 's')} />
            {/* Left Edge */}
            <div className="absolute top-1/2 -left-1.5 -translate-y-1/2 w-3 h-4 bg-white border-2 border-[#5C9952] rounded-full cursor-ew-resize z-10 shadow-sm" onMouseDown={(e) => startResize(e, 'w')} />
            {/* Right Edge */}
            <div className="absolute top-1/2 -right-1.5 -translate-y-1/2 w-3 h-4 bg-white border-2 border-[#5C9952] rounded-full cursor-ew-resize z-10 shadow-sm" onMouseDown={(e) => startResize(e, 'e')} />

            {/* Top Left */}
            <div className="absolute -top-1.5 -left-1.5 w-3 h-3 bg-white border-2 border-[#5C9952] rounded-full cursor-nwse-resize z-10 shadow-sm" onMouseDown={(e) => startResize(e, 'nw')} />
            {/* Top Right */}
            <div className="absolute -top-1.5 -right-1.5 w-3 h-3 bg-white border-2 border-[#5C9952] rounded-full cursor-nesw-resize z-10 shadow-sm" onMouseDown={(e) => startResize(e, 'ne')} />
            {/* Bottom Left */}
            <div className="absolute -bottom-1.5 -left-1.5 w-3 h-3 bg-white border-2 border-[#5C9952] rounded-full cursor-nesw-resize z-10 shadow-sm" onMouseDown={(e) => startResize(e, 'sw')} />
            {/* Bottom Right */}
            <div className="absolute -bottom-1.5 -right-1.5 w-3 h-3 bg-white border-2 border-[#5C9952] rounded-full cursor-nwse-resize z-10 shadow-sm" onMouseDown={(e) => startResize(e, 'se')} />
          </>
        )}
      </div>
    </NodeViewWrapper>
  );
};

export const TipTapResizableImage = Image.extend({
  addAttributes() {
    return {
      ...this.parent?.(),
      width: {
        default: 'auto',
        parseHTML: element => element.style.width || element.getAttribute('width') || 'auto',
        renderHTML: (attributes) => ({
          width: attributes.width,
        }),
      },
      height: {
        default: 'auto',
        parseHTML: element => element.style.height || element.getAttribute('height') || 'auto',
        renderHTML: (attributes) => ({
          height: attributes.height,
        }),
      },
      align: {
        default: 'center',
        parseHTML: element => element.getAttribute('data-align') || 'center',
        renderHTML: (attributes) => ({
          'data-align': attributes.align,
        }),
      },
    };
  },
  
  addNodeView() {
    return ReactNodeViewRenderer(ResizableImageComponent);
  },
  
  parseHTML() {
    return [
      {
        tag: 'img[src]',
      },
    ];
  },

  renderHTML({ HTMLAttributes }) {
    const { 'data-align': align, width, height, style, ...rest } = HTMLAttributes;
    
    // Compute aspect ratio safely to ensure mobile screens accurately scale forced dimension stretches perfectly
    const w = parseFloat(width as string);
    const h = parseFloat(height as string);
    const isValidAspect = !isNaN(w) && !isNaN(h) && typeof width === 'string' && width.includes('px') && typeof height === 'string' && height.includes('px');
    
    // Wrap the image in a flex container for alignment, matching the editor's NodeView
    return [
      'div', 
      { 
        style: `display: flex; justify-content: ${align === 'center' ? 'center' : align === 'right' ? 'flex-end' : 'flex-start'}; margin: 2rem 0;` 
      },
      ['img', mergeAttributes(rest, {
        'data-align': align,
        style: `width: ${width}; ${isValidAspect ? `height: auto; aspect-ratio: ${w} / ${h};` : `height: ${height};`} max-width: 100%; border-radius: 12px; object-fit: fill; ${style || ''}`.trim()
      })]
    ];
  },
});
