"use client";

import { useChat } from "ai/react";
import { ChatInput, ChatMessages } from "./ui/chat";

export default function ChatSection() {
  const {
    messages,
    input,
    isLoading,
    handleSubmit,
    handleInputChange,
    reload,
    stop,
  } = useChat({
    api: process.env.NEXT_PUBLIC_CHAT_API,
    headers: {
      "Content-Type": "application/json", // using JSON because of vercel/ai 2.2.26
    },
    onError: (error) => {
      let message;
      try {
        // Try to parse the error message as JSON
        const parsedMessage = JSON.parse(error.message);
        message = parsedMessage.detail;
      } catch (e) {
        // If parsing fails, use the raw error message
        message = error.message;
      }
      alert(message);
    },
  });

  return (
    <div className="space-y-4 max-w-5xl w-full">
      <ChatMessages
        messages={messages}
        isLoading={isLoading}
        reload={reload}
        stop={stop}
      />
      <ChatInput
        input={input}
        handleSubmit={handleSubmit}
        handleInputChange={handleInputChange}
        isLoading={isLoading}
        multiModal={true}
      />
    </div>
  );
}
