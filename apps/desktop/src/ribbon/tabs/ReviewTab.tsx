import { GitCompare, MessageSquare, Check, X, CheckCheck, XCircle } from 'lucide-react';
import {
  acceptAllTrackChanges,
  acceptTrackChangeInSelection,
  rejectAllTrackChanges,
  rejectTrackChangeInSelection,
} from '../../utils/trackChanges';
import type { RibbonTabProps } from '../types';

export function ReviewTab({ editor, actions, flags }: RibbonTabProps) {
  const { pendingInsertions, pendingDeletions } = flags;
  const pending = pendingInsertions + pendingDeletions;

  return (
    <>
      <div className="ribbon-group">
        <div className="ribbon-group-content">
          <div className="ribbon-column">
            <div className="ribbon-row">
              <button
                className={`ribbon-btn-horizontal-compact ${flags.trackChangesEnabled ? 'active' : ''}`}
                onClick={actions.onToggleTrackChanges}
                title="Track Changes"
                data-testid="ribbon-track-changes"
              >
                <GitCompare size={14} /> <span>Track Changes</span>
              </button>
              <button
                className="ribbon-btn-horizontal-compact"
                onClick={actions.onToggleComments}
                title="Document Comments"
                data-testid="ribbon-comments"
              >
                <MessageSquare size={14} /> <span>Comments</span>
              </button>
            </div>
            <div className="ribbon-row" style={{ marginTop: '2px' }}>
              <button
                className="ribbon-btn-sm-compact"
                onClick={() => editor && void acceptTrackChangeInSelection(editor)}
                title="Accept Selected Change"
                data-testid="ribbon-accept"
              >
                <Check size={14} /> <span>Accept</span>
              </button>
              <button
                className="ribbon-btn-sm-compact"
                onClick={() => editor && void rejectTrackChangeInSelection(editor)}
                title="Reject Selected Change"
                data-testid="ribbon-reject"
              >
                <X size={14} /> <span>Reject</span>
              </button>
              <button
                className="ribbon-btn-sm-compact"
                onClick={() => editor && acceptAllTrackChanges(editor)}
                title="Accept All Changes"
                data-testid="ribbon-accept-all"
              >
                <CheckCheck size={14} /> <span>Accept All</span>
              </button>
              <button
                className="ribbon-btn-sm-compact"
                onClick={() => editor && rejectAllTrackChanges(editor)}
                title="Reject All Changes"
                data-testid="ribbon-reject-all"
              >
                <XCircle size={14} /> <span>Reject All</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Accept and Reject act on changes that nothing in the UI could count:
          countTrackChanges existed but was only ever called by tests. */}
      <div className="ribbon-group">
        <div className="ribbon-group-content">
          <div className="ribbon-column ribbon-change-summary" data-testid="ribbon-change-summary">
            {pending === 0 ? (
              <span className="ribbon-change-none">No pending changes</span>
            ) : (
              <>
                <span data-testid="ribbon-pending-insertions">{pendingInsertions} inserted</span>
                <span data-testid="ribbon-pending-deletions">{pendingDeletions} deleted</span>
              </>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
