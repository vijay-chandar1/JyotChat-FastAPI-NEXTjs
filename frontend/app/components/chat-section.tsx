"use client";

import { useChat } from "ai/react";
import { ChatInput, ChatMessages } from "./ui/chat";
import React, { useState, useEffect } from 'react';
import { Switch } from "./ui/switch"
import axios from 'axios';

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
      const message = JSON.parse(error.message);
      alert(message.detail);
    },
  });

  const [isToggled, setIsToggled] = useState(false);
  const [displayMessages, setDisplayMessages] = useState(messages);
  const BASE_URL = process.env.REACT_APP_BASE_URL || 'http://localhost:8000';

  useEffect(() => {
    if (messages.length > 0) {
      const newMessages = [...messages];
      if (isToggled) {
        newMessages[newMessages.length - 1] = {...newMessages[newMessages.length - 1], content: ''};
      }
      setDisplayMessages(newMessages);
    }
  }, [messages, isToggled]);

  useEffect(() => {
    setIsToggled(false);
  }, [messages]);

  const handleToggle = async () => {
    setIsToggled(!isToggled);
    if (!isToggled) {
      try {   
        const response = await axios.post(`${BASE_URL}/translate`, { text: messages[messages.length - 1].content, target_language: 'en' });
        const newMessages = [...messages];
        newMessages[newMessages.length - 1] = {...newMessages[newMessages.length - 1], content: response.data.translated_text};
        setDisplayMessages(newMessages);
      } catch (error) {
        console.error('Error:', error);
      }
    } else {
      setDisplayMessages(messages);
    }
  };
  

  return (
    <div className="space-y-4 max-w-5xl w-full">
      <ChatMessages
        messages={displayMessages}
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
      <Switch checked={isToggled} onCheckedChange={handleToggle} />

      <p>{isToggled ? 'Show Original' : 'Show Translated'}</p>
    </div>
  );
}
