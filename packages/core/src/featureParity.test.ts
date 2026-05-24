import { describe, expect, it } from 'vitest';
import {
  FEATURE_PARITY,
  IMPLEMENTED_FEATURE_IDS,
  EXCLUDED_FEATURE_IDS,
  featuresByStatus,
  paritySummary,
} from './featureParity';

describe('feature parity catalog', () => {
  it('has unique feature ids', () => {
    const ids = FEATURE_PARITY.map((f) => f.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it('marks core word-processor features as implemented or partial', () => {
    const mustHave = [
      'file.new',
      'file.open',
      'file.save',
      'file.docx',
      'edit.undo',
      'edit.find',
      'font.bold',
      'para.align',
      'insert.table',
      'insert.image',
      'layout.size',
      'view.zoom',
    ];
    for (const id of mustHave) {
      const feat = FEATURE_PARITY.find((f) => f.id === id);
      expect(feat, `missing catalog entry ${id}`).toBeDefined();
      expect(['implemented', 'partial']).toContain(feat!.status);
    }
  });

  it('excludes AI and cloud from baseline expectations', () => {
    for (const id of EXCLUDED_FEATURE_IDS) {
      const feat = FEATURE_PARITY.find((f) => f.id === id);
      expect(feat, `missing excluded entry ${id}`).toBeDefined();
      expect(feat!.status).toBe('missing');
    }
  });

  it('reports reasonable coverage vs Word baseline', () => {
    const summary = paritySummary();
    expect(summary.implemented).toBeGreaterThan(30);
    expect(summary.coveragePct).toBeGreaterThanOrEqual(65);
    expect(summary.coveragePct).toBeLessThan(98);
  });

  it('lists implemented ids consistently', () => {
    expect(IMPLEMENTED_FEATURE_IDS.length).toBe(featuresByStatus('implemented').length);
    for (const id of IMPLEMENTED_FEATURE_IDS) {
      const feat = FEATURE_PARITY.find((f) => f.id === id);
      expect(feat?.status).toBe('implemented');
    }
  });
});
