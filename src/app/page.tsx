'use client';
import "./chatbot.css";
import { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';

export default function ChatPage() {
  const [messages, setMessages] = useState<{ role: 'user'|'assistant'; content: string }[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const searchParams = useSearchParams();

  // Auto-ask if ?q= is provided
  useEffect(() => {
    const q = searchParams.get('q');
    if (q && messages.length === 0) {
      setInput(q);
      handleSend(q); // fire immediately
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function handleSend(text?: string) {
    const msg = (text ?? input).trim();
    if (!msg) return;
    setLoading(true);
    setMessages(prev => [...prev, { role: 'user', content: msg }]);
    setInput('');

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: msg }),
      });
      const data = await res.json();
      setMessages(prev => [...prev, { role: 'assistant', content: data.reply ?? 'Sorry, no reply.' }]);
    } catch (e) {
      setMessages(prev => [...prev, { role: 'assistant', content: 'Failed to get response.' }]);
    } finally {
      setLoading(false);
    }
  }

  // Simple UI skeleton — keep your existing components if you have them
  return (
    <div className="chat-shell">
      {/* Starter prompt chips */}
      <div className="starter-chips">
        {[
          'Show me the difference between 100, 200, and 300 drones',
          'How much does a 150-drone show cost?',
          'Show me an example of a 150-drone show',
          'What’s the largest show Vegas Drones has done?',
          'Is my date available?',
          'What safety radius/space is required?',
          'What’s your refund / weather cancellation policy?',
          'How far do you travel from Las Vegas?'
        ].map((p) => (
          <button key={p} className="chip" onClick={() => handleSend(p)}>{p}</button>
        ))}
      </div>

      <div className="chat-window">
        {messages.map((m, i) => (
          <div key={i} className={`msg ${m.role}`}>{m.content}</div>
        ))}
        {loading && <div className="msg assistant">Loading…</div>}
      </div>

      <form className="chat-input" onSubmit={(e) => { e.preventDefault(); handleSend(); }}>
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Ask about pricing, availability, safety, etc."
        />
        <button type="submit" disabled={loading}>Send</button>
      </form>
    </div>
  );
}
