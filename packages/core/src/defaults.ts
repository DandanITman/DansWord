import type { AppSettings } from './types';

export const DEFAULT_SETTINGS: AppSettings = {
  theme: 'light',
  accentColor: '#2563eb',
  defaultSaveLocation: '',
  defaultFontFamily: 'Calibri',
  defaultFontSize: 11,
  autoSaveIntervalMs: 30000,
  spellCheckEnabled: true,
  language: 'en-US',
};

export const TEMPLATES = [
  {
    id: 'blank',
    name: 'Blank Document',
    description: 'Start with an empty page',
    content: {
      type: 'doc',
      content: [{ type: 'paragraph' }],
    },
  },
  {
    id: 'letter',
    name: 'Business Letter',
    description: 'Formal letter with date and signature block',
    content: {
      type: 'doc',
      content: [
        { type: 'paragraph', content: [{ type: 'text', text: '[Your Name]' }] },
        { type: 'paragraph', content: [{ type: 'text', text: '[Your Address]' }] },
        { type: 'paragraph' },
        { type: 'paragraph', content: [{ type: 'text', text: '[Date]' }] },
        { type: 'paragraph' },
        { type: 'paragraph', content: [{ type: 'text', text: 'Dear [Recipient],' }] },
        { type: 'paragraph' },
        {
          type: 'paragraph',
          content: [{ type: 'text', text: 'Write your letter here.' }],
        },
        { type: 'paragraph' },
        { type: 'paragraph', content: [{ type: 'text', text: 'Sincerely,' }] },
        { type: 'paragraph', content: [{ type: 'text', text: '[Your Name]' }] },
      ],
    },
  },
  {
    id: 'report',
    name: 'Simple Report',
    description: 'Report with title and sections',
    content: {
      type: 'doc',
      content: [
        {
          type: 'heading',
          attrs: { level: 1 },
          content: [{ type: 'text', text: 'Report Title' }],
        },
        { type: 'paragraph' },
        {
          type: 'heading',
          attrs: { level: 2 },
          content: [{ type: 'text', text: 'Introduction' }],
        },
        {
          type: 'paragraph',
          content: [{ type: 'text', text: 'Write your introduction here.' }],
        },
        {
          type: 'heading',
          attrs: { level: 2 },
          content: [{ type: 'text', text: 'Summary' }],
        },
        {
          type: 'paragraph',
          content: [{ type: 'text', text: 'Write your summary here.' }],
        },
      ],
    },
  },
  {
    id: 'resume',
    name: 'Resume',
    description: 'Basic resume layout',
    content: {
      type: 'doc',
      content: [
        {
          type: 'heading',
          attrs: { level: 1 },
          content: [{ type: 'text', text: 'Your Name' }],
        },
        {
          type: 'paragraph',
          content: [{ type: 'text', text: 'Email | Phone | City, State' }],
        },
        { type: 'paragraph' },
        {
          type: 'heading',
          attrs: { level: 2 },
          content: [{ type: 'text', text: 'Experience' }],
        },
        {
          type: 'paragraph',
          content: [{ type: 'text', text: 'Job Title — Company (Year–Year)' }],
        },
        {
          type: 'bulletList',
          content: [
            {
              type: 'listItem',
              content: [
                {
                  type: 'paragraph',
                  content: [{ type: 'text', text: 'Describe your key achievement.' }],
                },
              ],
            },
          ],
        },
        {
          type: 'heading',
          attrs: { level: 2 },
          content: [{ type: 'text', text: 'Education' }],
        },
        {
          type: 'paragraph',
          content: [{ type: 'text', text: 'Degree — School (Year)' }],
        },
      ],
    },
  },
] as const;
