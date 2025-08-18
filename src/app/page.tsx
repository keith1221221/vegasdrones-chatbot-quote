'use client'

import { useState } from 'react'

export default function Page() {
  const [message, setMessage] = useState('')
  const [chatHistory, setChatHistory] = useState<{ role: string; content: string }[]>([])
  const [isLoading, setIsLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!message) return

    setChatHistory(prev => [...prev, { role: 'user', content: message }])
    setIsLoading(true)

    const res = await fetch('/api/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message })
    })
    const data = await res.json()

    setChatHistory(prev => [...prev, { role: 'assistant', content: data.reply }])
    setIsLoading(false)
    setMessage('')
  }

  return (
    <div style={{ maxWidth: 700, margin: '0 auto', padding: 20 }}>
      <h1>Vegas Drones Chatbot</h1>

      <div style={{ border: '1px solid #ccc', padding: 10, height: 400, overflowY: 'auto' }}>
        {chatHistory.map((msg, i) => (
          <div key={i}>
            <strong>{msg.role === 'user' ? 'You' : 'Bot'}:</strong> {msg.content}
          </div>
        ))}
        {isLoading && <div>Loading...</div>}
      </div>

      <form onSubmit={handleSubmit} style={{ marginTop: 10 }}>
        <input
          type="text"
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder="Ask something..."
          style={{ width: '80%', padding: 8 }}
        />
        <button type="submit" style={{ padding: 8 }}>Send</button>
      </form>
    </div>
  )
}
