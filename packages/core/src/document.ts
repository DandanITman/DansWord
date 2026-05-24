import type { DansWordDocument, DocumentMetadata } from './types';
import {
  DEFAULT_HEADER_FOOTER,
  DEFAULT_PAGE_SETUP,
  type DocumentComment,
  type DocumentFootnote,
  type HeaderFooter,
  type PageSetup,
} from './pageSetup';
import { BUILTIN_STYLES, DEFAULT_WATERMARK, type DocumentStyle, type Watermark } from './styles';

export interface DocumentEnvelope {
  metadata: DocumentMetadata;
  content: unknown;
  pageSetup: PageSetup;
  headerFooter: HeaderFooter;
  comments: DocumentComment[];
  trackChangesEnabled: boolean;
  watermark: Watermark;
  customStyles: DocumentStyle[];
  footnotes: DocumentFootnote[];
}

export function createDocumentEnvelope(
  content: unknown,
  partial?: Partial<Omit<DocumentEnvelope, 'content'>>,
): DocumentEnvelope {
  const now = new Date().toISOString();
  return {
    metadata: partial?.metadata ?? {
      title: 'Untitled',
      author: '',
      created: now,
      modified: now,
    },
    content,
    pageSetup: partial?.pageSetup ?? { ...DEFAULT_PAGE_SETUP },
    headerFooter: partial?.headerFooter ?? { ...DEFAULT_HEADER_FOOTER },
    comments: partial?.comments ?? [],
    trackChangesEnabled: partial?.trackChangesEnabled ?? false,
    watermark: partial?.watermark ?? { ...DEFAULT_WATERMARK },
    customStyles: partial?.customStyles ?? [...BUILTIN_STYLES],
    footnotes: partial?.footnotes ?? [],
  };
}

export function parseDansWordFile(raw: unknown): DocumentEnvelope {
  if (!raw || typeof raw !== 'object') {
    return createDocumentEnvelope({ type: 'doc', content: [{ type: 'paragraph' }] });
  }
  const file = raw as DansWordDocument;
  const pageSetup = file.pageSetup
    ? {
        ...DEFAULT_PAGE_SETUP,
        ...file.pageSetup,
        margins: { ...DEFAULT_PAGE_SETUP.margins, ...file.pageSetup.margins },
        columns: file.pageSetup.columns ?? DEFAULT_PAGE_SETUP.columns,
      }
    : undefined;
  return createDocumentEnvelope(file.content, {
    metadata: file.metadata,
    pageSetup,
    headerFooter: file.headerFooter,
    comments: file.comments,
    trackChangesEnabled: file.trackChangesEnabled,
    watermark: file.watermark,
    customStyles: file.customStyles,
    footnotes: file.footnotes,
  });
}

export function serializeDansWordFile(envelope: DocumentEnvelope): DansWordDocument {
  return {
    version: 2,
    metadata: { ...envelope.metadata, modified: new Date().toISOString() },
    content: envelope.content,
    pageSetup: envelope.pageSetup,
    headerFooter: envelope.headerFooter,
    comments: envelope.comments,
    trackChangesEnabled: envelope.trackChangesEnabled,
    watermark: envelope.watermark,
    customStyles: envelope.customStyles,
    footnotes: envelope.footnotes,
  };
}
