import { useEffect, useRef } from 'react';

export interface SpellSuggestionState {
  x: number;
  y: number;
  word: string;
  from: number;
  to: number;
  suggestions: string[];
}

interface SpellSuggestionMenuProps {
  state: SpellSuggestionState | null;
  onPick: (replacement: string) => void;
  /** Teach the checker this word so it stops being flagged. */
  onAddToDictionary?: (word: string) => void;
  onClose: () => void;
}

export function SpellSuggestionMenu({
  state,
  onPick,
  onAddToDictionary,
  onClose,
}: SpellSuggestionMenuProps) {
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!state) return;
    const onPointerDown = (event: MouseEvent) => {
      if (!menuRef.current?.contains(event.target as Node)) onClose();
    };
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
    };
    window.addEventListener('mousedown', onPointerDown);
    window.addEventListener('keydown', onKeyDown);
    return () => {
      window.removeEventListener('mousedown', onPointerDown);
      window.removeEventListener('keydown', onKeyDown);
    };
  }, [state, onClose]);

  if (!state) return null;

  return (
    <div
      ref={menuRef}
      className="spell-suggestion-menu"
      style={{ top: state.y, left: state.x }}
      role="menu"
      aria-label="Spelling suggestions"
    >
      <div className="spell-suggestion-title">Replace &ldquo;{state.word}&rdquo;</div>
      {state.suggestions.length === 0 ? (
        <div className="spell-suggestion-empty">No suggestions</div>
      ) : (
        state.suggestions.map((suggestion) => (
          <button
            key={suggestion}
            type="button"
            className="spell-suggestion-item"
            role="menuitem"
            onClick={() => onPick(suggestion)}
          >
            {suggestion}
          </button>
        ))
      )}
      {onAddToDictionary && (
        <button
          type="button"
          className="spell-suggestion-item spell-suggestion-add"
          role="menuitem"
          onClick={() => onAddToDictionary(state.word)}
        >
          Add to dictionary
        </button>
      )}
      <button type="button" className="spell-suggestion-dismiss" onClick={onClose}>
        Ignore
      </button>
    </div>
  );
}
