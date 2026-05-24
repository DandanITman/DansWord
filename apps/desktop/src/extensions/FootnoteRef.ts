import { Mark, mergeAttributes } from '@tiptap/core';

export const FootnoteRef = Mark.create({
  name: 'footnoteRef',

  addAttributes() {
    return {
      id: { default: null },
      number: { default: 1 },
    };
  },

  parseHTML() {
    return [{ tag: 'sup.footnote-ref', getAttrs: (el) => ({ id: (el as HTMLElement).dataset.footnoteId, number: (el as HTMLElement).textContent }) }];
  },

  renderHTML({ HTMLAttributes }) {
    const { number, id, ...rest } = HTMLAttributes;
    return [
      'sup',
      mergeAttributes(rest, { class: 'footnote-ref', 'data-footnote-id': id }),
      String(number ?? ''),
    ];
  },

  addCommands() {
    return {
      setFootnoteRef:
        (attrs: { id: string; number: number }) =>
        ({ commands }) =>
          commands.setMark(this.name, attrs),
      unsetFootnoteRef:
        () =>
        ({ commands }) =>
          commands.unsetMark(this.name),
    };
  },
});

declare module '@tiptap/core' {
  interface Commands<ReturnType> {
    footnoteRef: {
      setFootnoteRef: (attrs: { id: string; number: number }) => ReturnType;
      unsetFootnoteRef: () => ReturnType;
    };
  }
}
