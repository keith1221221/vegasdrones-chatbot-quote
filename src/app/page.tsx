"use client";

import { useState, useEffect } from "react";

export default function Chatbot() {
  const [message, setMessage] = useState("");
  const [messages, setMessages] = useState<{ role: string; content: string }[]>([]);
  const [isResponding, setIsResponding] = useState(false);

  // Preprogrammed questions
  const suggestedQuestions = [
    "How much for 50 drones?",
    "What is the travel fee for Los Angeles?",
    "Can you do a custom logo show?",
    "How long does a drone show last?",
  ];

  // Handle sending a message
  const sendMessage = async (msg: string) => {
    if (!msg.trim()) return;

    setIsResponding(true);
    setMessages((prev) => [...prev, { role: "user", content: msg }]);

    // Notify parent window (for video playback)
    window.parent.postMessage("responding", "*");

    try {
      const response = await fetch("/api/route", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: msg }),
      });
      const data = await response.json();
      if (data.reply) {
        setMessages((prev) => [...prev, { role: "assistant", content: data.reply }]);
      } else {
        setMessages((prev) => [...prev, { role: "assistant", content: "Sorry, something went wrong." }]);
      }
    } catch (error) {
      console.error("Error sending message:", error);
      setMessages((prev) => [...prev, { role: "assistant", content: "Error: Failed to get response." }]);
    }

    // Notify parent window after response
    setTimeout(() => {
      setIsResponding(false);
      window.parent.postMessage("idle", "*");
    }, 2000);
  };

  // Handle form submission
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    sendMessage(message);
    setMessage("");
  };

  // Handle clicking a suggested question
  const handleSuggestedQuestion = (question: string) => {
    sendMessage(question);
  };

  return (
    <div style={styles.container}>
      <h1 style={styles.header}>Vegas Drones Assistant</h1>
      <div style={styles.suggestedQuestions}>
        {suggestedQuestions.map((question, index) => (
          <button
            key={index}
            style={styles.suggestedButton}
            onClick={() => handleSuggestedQuestion(question)}
            disabled={isResponding}
          >
            {question}
          </button>
        ))}
      </div>
      <div style={styles.messageContainer}>
        {messages.map((msg, index) => (
          <div
            key={index}
            style={msg.role === "user" ? styles.userMessage : styles.assistantMessage}
          >
            {msg.content}
          </div>
        ))}
      </div>
      <form onSubmit={handleSubmit} style={styles.form}>
        <input
          type="text"
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder="Ask about drone shows..."
          style={styles.input}
          disabled={isResponding}
        />
        <button type="submit" style={styles.submitButton} disabled={isResponding}>
          Send
        </button>
      </form>
    </div>
  );
}

const styles = {
  container: {
    background: "#ffffff",
    color: "#000000",
    padding: "20px",
    height: "100%",
    display: "flex",
    flexDirection: "column" as const,
    fontFamily: "'Poppins', sans-serif",
  },
  header: {
    fontFamily: "'Orbitron', sans-serif",
    fontSize: "1.5rem",
    color: "#ff1e1e",
    textAlign: "center" as const,
    marginBottom: "10px",
  },
  suggestedQuestions: {
    display: "flex",
    flexWrap: "wrap" as const,
    gap: "10px",
    marginBottom: "15px",
    justifyContent: "center" as const,
  },
  suggestedButton: {
    background: "#ff4d4d",
    color: "#ffffff",
    border: "none",
    borderRadius: "20px",
    padding: "8px 16px",
    cursor: "pointer",
    fontSize: "0.9rem",
    transition: "background 0.3s ease",
  },
  messageContainer: {
    flex: 1,
    overflowY: "auto" as const,
    marginBottom: "10px",
  },
  userMessage: {
    background: "#f0f0f0",
    color: "#000000",
    padding: "10px",
    borderRadius: "10px",
    margin: "5px 10px",
    textAlign: "right" as const,
  },
  assistantMessage: {
    background: "#ff4d4d",
    color: "#ffffff",
    padding: "10px",
    borderRadius: "10px",
    margin: "5px 10px",
    textAlign: "left" as const,
  },
  form: {
    display: "flex",
    gap: "10px",
  },
  input: {
    flex: 1,
    padding: "10px",
    border: "1px solid #ccc",
    borderRadius: "5px",
    fontSize: "1rem",
  },
  submitButton: {
    background: "#ff1e1e",
    color: "#ffffff",
    border: "none",
    borderRadius: "5px",
    padding: "10px 20px",
    cursor: "pointer",
    fontSize: "1rem",
  },
};