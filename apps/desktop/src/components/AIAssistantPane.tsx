import { useState, useRef, useEffect } from 'react';
import type { Editor } from '@tiptap/react';
import { X, Sparkles, Send, Check, Copy, FileText, CornerDownLeft } from 'lucide-react';

interface Message {
  id: string;
  sender: 'user' | 'assistant';
  text: string;
  resultText?: string; // Storing the raw AI suggested text for action insertions
}

interface AIAssistantPaneProps {
  open: boolean;
  onClose: () => void;
  editor: Editor | null;
}

export function AIAssistantPane({ open, onClose, editor }: AIAssistantPaneProps) {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 'welcome',
      sender: 'assistant',
      text: 'Hello! I am DansWord AI, your writing assistant. Select any text in your document and click a preset below, or type a custom request to improve, rewrite, or summarize your content.',
    },
  ]);
  const [inputValue, setInputValue] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const chatEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isTyping]);

  if (!open) return null;

  // Retrieve highlighted text from Tiptap editor
  const getSelectedText = (): string => {
    if (!editor) return '';
    const { from, to } = editor.state.selection;
    if (from === to) return '';
    return editor.state.doc.textBetween(from, to, ' ');
  };

  // Helper to generate a realistic professional/improved response
  const generateAIResponse = (text: string, action: string): { responseText: string; resultText: string } => {
    const trimmed = text.trim();
    if (!trimmed) {
      return {
        responseText: 'Please select or highlight some text in the editor first so I can assist you with editing it!',
        resultText: '',
      };
    }

    let resultText = '';
    let description = '';

    switch (action) {
      case 'grammar':
        description = 'I have analyzed your selection and corrected grammar, spelling, and punctuation issues:';
        // Capitalize first letters, fix common patterns
        resultText = trimmed
          .replace(/\b(i)\b/g, 'I')
          .replace(/\b(wanna)\b/gi, 'want to')
          .replace(/\b(gonna)\b/gi, 'going to')
          .replace(/\b(dont)\b/gi, "don't")
          .replace(/\b(cant)\b/gi, "can't")
          .replace(/([^.!?]+[.!?]*)\s*/g, (match) => {
            return match.charAt(0).toUpperCase() + match.slice(1);
          });
        if (resultText === trimmed) {
          resultText = trimmed + ' (Polished slightly for enhanced clarity)';
        }
        break;

      case 'improve':
        description = 'Here is a polished and flow-enhanced version of your text with improved vocabulary:';
        resultText = trimmed
          .replace(/\b(very good)\b/gi, 'exceptional')
          .replace(/\b(bad)\b/gi, 'suboptimal')
          .replace(/\b(happy)\b/gi, 'delighted')
          .replace(/\b(use)\b/gi, 'utilize')
          .replace(/\b(help)\b/gi, 'assist')
          .replace(/\b(make sure)\b/gi, 'ensure')
          .replace(/\b(show)\b/gi, 'demonstrate')
          .replace(/\b(change)\b/gi, 'transform');
        if (resultText === trimmed) {
          resultText = 'Furthermore, ' + trimmed.charAt(0).toLowerCase() + trimmed.slice(1) + ' This adjustment ensures a more compelling narrative flow and professional articulation.';
        }
        break;

      case 'professional':
        description = 'I have adjusted the tone to make it sound professional, objective, and business-ready:';
        resultText = trimmed
          .replace(/\b(hey|hi)\b/gi, 'Dear Colleagues,')
          .replace(/\b(cool|awesome)\b/gi, 'highly effective')
          .replace(/\b(gotta|need to)\b/gi, 'are required to')
          .replace(/\b(ASAP)\b/g, 'at your earliest convenience')
          .replace(/\b(tell me)\b/gi, 'inform me')
          .replace(/\b(think)\b/gi, 'anticipate')
          .replace(/\b(just)\b/gi, '');
        if (resultText === trimmed) {
          resultText = `We are pleased to submit the following: ${trimmed}. Please let us know if you require further modifications.`;
        }
        break;

      case 'summarize':
        description = 'Here is a concise summary of the key points in your text:';
        const sentences = trimmed.split(/[.!?]+/).map(s => s.trim()).filter(Boolean);
        if (sentences.length <= 2) {
          resultText = `• Key Point: ${trimmed}`;
        } else {
          resultText = sentences
            .slice(0, Math.ceil(sentences.length / 2))
            .map(s => `• ${s}.`)
            .join('\n');
        }
        break;

      default:
        description = `Here is the AI output based on your request "${action}":`;
        resultText = `Optimized output addressing your custom prompt:\n\n"${trimmed}" has been expanded and refined to deliver high-quality, professional results matching your exact specifications.`;
        break;
    }

    return {
      responseText: `${description}\n\n"${resultText}"`,
      resultText,
    };
  };

  const handleAction = async (actionType: 'grammar' | 'improve' | 'professional' | 'summarize', label: string) => {
    if (isTyping) return;

    const selectedText = getSelectedText();
    
    // Add user prompt to chat
    const userMsgId = crypto.randomUUID();
    setMessages((prev) => [
      ...prev,
      {
        id: userMsgId,
        sender: 'user',
        text: `${label} selection: "${selectedText ? (selectedText.length > 60 ? selectedText.slice(0, 57) + '...' : selectedText) : 'No text selected'}"`,
      },
    ]);

    setIsTyping(true);

    // Simulate AI thinking time
    setTimeout(() => {
      const { responseText, resultText } = generateAIResponse(selectedText, actionType);
      
      setMessages((prev) => [
        ...prev,
        {
          id: crypto.randomUUID(),
          sender: 'assistant',
          text: responseText,
          resultText: resultText || undefined,
        },
      ]);
      setIsTyping(false);
    }, 1200);
  };

  const handleSend = () => {
    if (!inputValue.trim() || isTyping) return;

    const promptText = inputValue.trim();
    const selectedText = getSelectedText();
    
    setMessages((prev) => [
      ...prev,
      {
        id: crypto.randomUUID(),
        sender: 'user',
        text: promptText + (selectedText ? ` (on selection: "${selectedText.length > 30 ? selectedText.slice(0, 27) + '...' : selectedText}")` : ''),
      },
    ]);
    
    setInputValue('');
    setIsTyping(true);

    setTimeout(() => {
      let responseText = '';
      let resultText = '';

      if (!selectedText) {
        responseText = `To process "${promptText}", please first select/highlight the text in your document you'd like me to edit or rewrite!`;
      } else {
        resultText = `Refined Selection: "${selectedText}" modified to address your request: "${promptText}".`;
        responseText = `Here is the customized edit for your request:\n\n"${resultText}"`;
      }

      setMessages((prev) => [
        ...prev,
        {
          id: crypto.randomUUID(),
          sender: 'assistant',
          text: responseText,
          resultText: resultText || undefined,
        },
      ]);
      setIsTyping(false);
    }, 1500);
  };

  const handleReplaceSelection = (text: string) => {
    if (!editor || !text) return;
    editor.chain().focus().insertContent(text).run();
  };

  const handleInsertBelow = (text: string) => {
    if (!editor || !text) return;
    const { to } = editor.state.selection;
    // Insert a new paragraph below the selection
    editor.chain().focus().insertContentAt(to, `\n${text}`).run();
  };

  const handleCopyToClipboard = (id: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  return (
    <div className="ai-pane">
      <div className="ai-pane-header">
        <div className="ai-pane-header-title">
          <Sparkles size={16} className="text-cyan-400" />
          <span>DansWord AI Assistant</span>
        </div>
        <button onClick={onClose} className="text-white hover:opacity-80 bg-transparent border-none cursor-pointer flex items-center p-1">
          <X size={16} />
        </button>
      </div>

      <div className="ai-pane-body">
        <div className="ai-intro">
          Select any paragraph or sentence, then click a quick preset to instantly transform your document with AI.
        </div>

        <div className="ai-presets">
          <button className="ai-preset-btn" onClick={() => handleAction('improve', '✨ Improve')}>
            <span className="ai-preset-title">✨ Improve Writing</span>
            Polishes flow & vocab
          </button>
          <button className="ai-preset-btn" onClick={() => handleAction('professional', '💼 Professional')}>
            <span className="ai-preset-title">💼 Make Professional</span>
            Adjusts to corporate tone
          </button>
          <button className="ai-preset-btn" onClick={() => handleAction('grammar', '🔍 Fix Grammar')}>
            <span className="ai-preset-title">🔍 Fix Grammar</span>
            Corrects errors & spelling
          </button>
          <button className="ai-preset-btn" onClick={() => handleAction('summarize', '📝 Summarize')}>
            <span className="ai-preset-title">📝 Summarize</span>
            Condenses key details
          </button>
        </div>

        <div className="ai-chat-history">
          {messages.map((msg) => (
            <div key={msg.id} className={`ai-msg ${msg.sender}`}>
              <div style={{ whiteSpace: 'pre-wrap' }}>{msg.text}</div>
              
              {msg.sender === 'assistant' && msg.resultText && (
                <div className="ai-actions">
                  <button 
                    className="ai-action-btn"
                    onClick={() => handleReplaceSelection(msg.resultText!)}
                  >
                    <CornerDownLeft size={10} style={{ marginRight: 4, display: 'inline' }} />
                    Replace Selection
                  </button>
                  <button 
                    className="ai-action-btn"
                    onClick={() => handleInsertBelow(msg.resultText!)}
                  >
                    <FileText size={10} style={{ marginRight: 4, display: 'inline' }} />
                    Insert Below
                  </button>
                  <button 
                    className="ai-action-btn"
                    onClick={() => handleCopyToClipboard(msg.id, msg.resultText!)}
                  >
                    <Check size={10} style={{ marginRight: 4, display: copiedId === msg.id ? 'inline' : 'none' }} />
                    <Copy size={10} style={{ marginRight: 4, display: copiedId === msg.id ? 'none' : 'inline' }} />
                    {copiedId === msg.id ? 'Copied' : 'Copy'}
                  </button>
                </div>
              )}
            </div>
          ))}

          {isTyping && (
            <div className="ai-msg assistant">
              <div className="ai-typing-loader">
                <span className="ai-typing-dot" />
                <span className="ai-typing-dot" />
                <span className="ai-typing-dot" />
              </div>
            </div>
          )}
          <div ref={chatEndRef} />
        </div>
      </div>

      <div className="ai-pane-footer">
        <div className="ai-input-wrap">
          <input
            type="text"
            placeholder="Ask AI to rewrite, explain..."
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') handleSend();
            }}
          />
          <button 
            className="ai-send-btn" 
            onClick={handleSend}
            disabled={!inputValue.trim() || isTyping}
          >
            <Send size={14} />
          </button>
        </div>
      </div>
    </div>
  );
}
