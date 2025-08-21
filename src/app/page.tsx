"use client";

import { useState, Suspense } from "react";
import { useSearchParams } from 'next/navigation';
import './chatbot.css'; // or '../../chatbot.css' if in root

function ChatbotContent() {
  const searchParams = useSearchParams();
  const initialMessage = searchParams.get('query') || '';
  const [message, setMessage] = useState(initialMessage);
  const [response, setResponse] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  const suggestedQuestions = [
    "How much for 50 drones?",
    "What is the travel fee for 100 miles?",
    "How do I book a drone show?",
    "Are your drones FAA-certified?",
  ];

  const handleSubmit = async (e: React.FormEvent | string) => {
    e.preventDefault?.();
    const inputMessage = typeof e === "string" ? e : message;
    console.log("Sending message:", inputMessage);
    setIsLoading(true);
    setError("");

    try {
      const res = await fetch("/api/chat/route", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: inputMessage }),
      });

      console.log("Fetch response status:", res.status);
      const data = await res.json();
      console.log("Fetch response data:", data);

      if (res.ok) {
        setResponse(data.reply);
        if (typeof window !== "undefined") {
          window.parent.postMessage("responding", "*");
          setTimeout(() => window.parent.postMessage("idle", "*"), 2000);
        }
      } else {
        setError(`Error: ${data.error || "Unknown error"}`);
      }
    } catch (error) {
      console.error("Fetch error:", error);
      setError("Failed to fetch response. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="chatbot-container">
      <h1>Vegas Drones Chatbot</h1>
      <p>Ask about our drone light shows!</p>
      <div className="suggested-questions">
        {suggestedQuestions.map((question, index) => (
          <button
            key={index}
            onClick={() => handleSubmit(question)}
            disabled={isLoading}
            className="suggested-button"
          >
            {question}
          </button>
        ))}
      </div>
      <form onSubmit={handleSubmit}>
        <input
          type="text"
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder="Type your question..."
          disabled={isLoading}
        />
        <button type="submit" disabled={isLoading}>
          {isLoading ? "Sending..." : "Send"}
        </button>
      </form>
      {response && (
        <div className="response">
          <p>{response}</p>
        </div>
      )}
      {error && (
        <div className="error">
          <p>{error}</p>
        </div>
      )}
    </div>
  );
}

export default function Home() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <ChatbotContent />
    </Suspense>
  );
}