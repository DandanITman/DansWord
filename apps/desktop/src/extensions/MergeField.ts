import { Mark, mergeAttributes } from '@tiptap/core';

export const MergeField = Mark.create({
  name: 'mergeField',

  addAttributes() {
    return {
      field: { default: 'Field' },
    };
  },

  parseHTML() {
    return [{ tag: 'span.merge-field' }];
  },

  renderHTML({ HTMLAttributes }) {
    const field = HTMLAttributes.field ?? 'Field';
    return [
      'span',
      mergeAttributes(HTMLAttributes, { class: 'merge-field', 'data-field': field }),
      `{{${field}}}`,
    ];
  },

  addCommands() {
    return {
      insertMergeField:
        (field: string) =>
        ({ chain }) =>
          chain()
            .insertContent({
              type: 'text',
              text: `{{${field}}}`,
              marks: [{ type: this.name, attrs: { field } }],
            })
            .run(),
    };
  },
});

declare module '@tiptap/core' {
  interface Commands<ReturnType> {
    mergeField: {
      insertMergeField: (field: string) => ReturnType;
    };
  }
}
