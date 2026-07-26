import {
  ChevronLeft,
  ChevronRight,
  Highlighter,
  Mail,
  MailCheck,
  Users,
  UserPlus,
  MapPin,
  MessageSquare,
  Eye,
} from 'lucide-react';
import { MERGE_DOCUMENT_LABELS, includedRecords, type MergeDocumentType } from '@dansword/core';
import {
  RibbonButton,
  RibbonGroup,
  RibbonLine,
  RibbonMenuButton,
  RibbonMenuHeader,
  RibbonMenuItem,
  RibbonMenuSeparator,
  RibbonStack,
} from '../RibbonKit';
import type { RibbonTabProps } from '../types';

export function MailingsTab({ actions, flags }: RibbonTabProps) {
  const { mailMerge, mergePreview, mergeDocumentType } = flags;
  const recipients = includedRecords(mailMerge);
  const hasList = recipients.length > 0;
  const position = Math.min(mergePreview.index + 1, Math.max(1, recipients.length));

  return (
    <>
      <RibbonGroup label="Start Mail Merge">
        <RibbonStack>
          <RibbonMenuButton
            icon={<Mail size={20} />}
            label="Start Mail Merge"
            title="Choose what kind of merged document to produce"
            size="large"
            testId="mailings-start"
          >
            <RibbonMenuHeader label="Document type" />
            {(Object.keys(MERGE_DOCUMENT_LABELS) as MergeDocumentType[]).map((type) => (
              <RibbonMenuItem
                key={type}
                label={MERGE_DOCUMENT_LABELS[type]}
                checked={mergeDocumentType === type}
                onClick={() => actions.onStartMailMerge(type)}
              />
            ))}
          </RibbonMenuButton>
          <RibbonMenuButton
            icon={<Users size={20} />}
            label="Select Recipients"
            title="Choose the list of people to merge"
            size="large"
            testId="mailings-select-recipients"
          >
            <RibbonMenuItem
              label="Use an Existing List…"
              hint="CSV or tab-separated file"
              onClick={actions.onSelectRecipients}
            />
            <RibbonMenuItem
              label="Edit Recipient List…"
              disabled={!mailMerge.records.length}
              onClick={actions.onEditRecipients}
            />
          </RibbonMenuButton>
        </RibbonStack>
        <RibbonStack>
          <RibbonButton
            icon={<UserPlus size={14} />}
            label="Edit Recipient List"
            title="Tick the recipients to include"
            disabled={!mailMerge.records.length}
            onClick={actions.onEditRecipients}
            testId="mailings-edit-recipients"
          />
          <span className="rb-status-note" data-testid="mailings-status">
            {mailMerge.records.length
              ? `${recipients.length} of ${mailMerge.records.length} recipients${
                  mailMerge.sourceName ? ` · ${mailMerge.sourceName}` : ''
                }`
              : 'No recipient list attached'}
          </span>
        </RibbonStack>
      </RibbonGroup>

      <RibbonGroup label="Write &amp; Insert Fields">
        <RibbonStack>
          <RibbonButton
            icon={<MapPin size={14} />}
            label="Address Block"
            title="Insert an address block built from the list's fields"
            disabled={!hasList}
            onClick={actions.onInsertAddressBlock}
            testId="mailings-address-block"
          />
          <RibbonButton
            icon={<MessageSquare size={14} />}
            label="Greeting Line"
            title="Insert a greeting line"
            disabled={!hasList}
            onClick={actions.onInsertGreetingLine}
            testId="mailings-greeting-line"
          />
        </RibbonStack>
        <RibbonStack>
          <RibbonMenuButton
            icon={<span className="rb-glyph">«»</span>}
            label="Insert Merge Field"
            title="Insert a field from the recipient list"
            disabled={!mailMerge.fields.length}
            testId="mailings-insert-field"
            menuWidth={230}
          >
            <RibbonMenuHeader label="Fields" />
            {mailMerge.fields.map((field) => (
              <RibbonMenuItem
                key={field}
                label={field}
                onClick={() => actions.onInsertMergeField(field)}
                testId={`mailings-field-${field}`}
              />
            ))}
          </RibbonMenuButton>
          <RibbonButton
            icon={<Highlighter size={14} />}
            label="Highlight Merge Fields"
            title="Shade the merge fields so they stand out"
            active={mergePreview.highlight}
            onClick={actions.onToggleHighlightMergeFields}
            testId="mailings-highlight-fields"
          />
        </RibbonStack>
      </RibbonGroup>

      <RibbonGroup label="Preview Results">
        <RibbonStack>
          <RibbonButton
            icon={<Eye size={20} />}
            label="Preview Results"
            title="Replace the merge fields with the first recipient's details"
            size="large"
            active={mergePreview.active}
            disabled={!hasList}
            onClick={actions.onTogglePreviewResults}
            testId="mailings-preview"
          />
        </RibbonStack>
        <RibbonStack>
          <RibbonLine>
            <RibbonButton
              icon={<ChevronLeft size={14} />}
              title="Previous recipient"
              size="icon"
              disabled={!mergePreview.active || mergePreview.index === 0}
              onClick={() => actions.onGoToMergeRecord(mergePreview.index - 1)}
              testId="mailings-prev-record"
            />
            <span className="rb-record-counter" data-testid="mailings-record">
              {hasList ? `${position} / ${recipients.length}` : '– / –'}
            </span>
            <RibbonButton
              icon={<ChevronRight size={14} />}
              title="Next recipient"
              size="icon"
              disabled={!mergePreview.active || mergePreview.index >= recipients.length - 1}
              onClick={() => actions.onGoToMergeRecord(mergePreview.index + 1)}
              testId="mailings-next-record"
            />
          </RibbonLine>
        </RibbonStack>
      </RibbonGroup>

      <RibbonGroup label="Finish">
        <RibbonMenuButton
          icon={<MailCheck size={20} />}
          label="Finish &amp; Merge"
          title="Produce the merged documents"
          size="large"
          disabled={!hasList}
          testId="mailings-finish"
        >
          <RibbonMenuItem
            label="Edit Individual Documents…"
            hint="One file per recipient"
            onClick={() => actions.onFinishMerge('documents')}
          />
          <RibbonMenuSeparator />
          <RibbonMenuItem label="Print Documents…" onClick={() => actions.onFinishMerge('print')} />
        </RibbonMenuButton>
      </RibbonGroup>
    </>
  );
}
