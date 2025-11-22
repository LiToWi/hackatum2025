'use client';

import React, { useState, useRef, useEffect } from 'react';
import { MessageCircle, X, Send, Loader2, Bot } from 'lucide-react';
import Markdown from 'react-markdown';

interface Message {
    id: string;
    text: string;
    sender: 'user' | 'bot';
    timestamp: Date;
}

export const CHATBOT_SYSTEM_INSTRUCTION = `
You are Bubu.Dev, a friendly and professional AI assistant for the "Rent2Own" platform.
Your goal is to help students understand how they can rent apartments in Munich while building equity.

Answer user questions concisely and helpfully. Only provide information directly relevant to their question. Do not volunteer unprompted information.

Key Information about Rent2Own:
1. **Concept**: Rent2Own allows students to pay rent, but a percentage of that rent (typically 3-7%) goes towards purchasing equity in the property. It's an investment in their future home.
2. **Location**: Currently operating exclusively in Munich, Germany.
3. **Target Audience**: Students and young professionals looking for long-term housing solutions.
4. **Process**:
   - Step 1: Users fill out a wizard (City, Duration, Roommates, Contact Details).
   - Step 2: Users view an interactive map of available properties.
   - Step 3: Users apply for a specific property.

Tone of Voice:
- Professional but warm and approachable.
- Encouraging and optimistic.
- Concise and helpful.

Common Questions:
- "Is this real?" -> Yes, we partner with major real estate developers in Munich.
- "How much equity do I get?" -> It varies by property, usually between 3% and 8% per year.
- "Can I leave early?" -> Yes, but equity vesting periods apply (usually 1 year minimum).

If you don't know the answer, kindly suggest they contact support at help@rent2own-munich.de.
`;

export const ChatWidget: React.FC = () => {
    const [isOpen, setIsOpen] = useState(false);
    const [messages, setMessages] = useState<Message[]>([
        {
            id: 'welcome',
            text: 'How can I help you?',
            sender: 'bot',
            timestamp: new Date()
        }
    ]);
    const [inputValue, setInputValue] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const messagesEndRef = useRef<HTMLDivElement>(null);

    // Auto-scroll to bottom
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages, isOpen]);

    const handleSendMessage = async (e?: React.FormEvent) => {
        e?.preventDefault();

        if (!inputValue.trim()) return;

        const userMessage: Message = {
            id: Date.now().toString(),
            text: inputValue.trim(),
            sender: 'user',
            timestamp: new Date()
        };

        setMessages(prev => [...prev, userMessage]);
        setInputValue('');
        setIsLoading(true);

        try {
            const response = await fetch('/api/chat', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    message: userMessage.text,
                    conversationHistory: messages,
                    systemInstruction: CHATBOT_SYSTEM_INSTRUCTION,
                }),
            });

            if (!response.ok) {
                throw new Error('Failed to get response');
            }

            const data = await response.json();

            const botMessage: Message = {
                id: (Date.now() + 1).toString(),
                text: data.reply || "I'm having trouble understanding that right now.",
                sender: 'bot',
                timestamp: new Date()
            };

            setMessages(prev => [...prev, botMessage]);
        } catch (error) {
            console.error("Error sending message:", error);
            const errorMessage: Message = {
                id: (Date.now() + 1).toString(),
                text: "I'm sorry, I'm having trouble connecting to the server right now. Please try again later.",
                sender: 'bot',
                timestamp: new Date()
            };
            setMessages(prev => [...prev, errorMessage]);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end">
            {/* Chat Window */}
            <div
                className={`bg-gray-900 rounded-2xl shadow-2xl border border-secondary/30 w-80 sm:w-96 mb-4 transition-all duration-300 transform origin-bottom-right overflow-hidden
          ${isOpen ? 'opacity-100 scale-100 translate-y-0' : 'opacity-0 scale-95 translate-y-4 pointer-events-none h-0'}`}
            >
                {/* Header */}
                <div className="bg-gradient-to-r from-primary to-secondary p-4 flex items-center justify-between">
                    <div className="flex items-center gap-2 text-white">
                        <div className="bg-white/20 p-1.5 rounded-lg">
                            <Bot size={20} />
                        </div>
                        <div>
                            <h3 className="font-bold text-sm">Bubu.Dev</h3>
                            <p className="text-xs text-white/80">AI Assistant</p>
                        </div>
                    </div>
                    <button
                        onClick={() => setIsOpen(false)}
                        className="text-white/80 hover:text-white transition-colors"
                    >
                        <X size={20} />
                    </button>
                </div>

                {/* Messages Area */}
                <div className="h-80 overflow-y-auto p-4 space-y-4 bg-gray-800/50">
                    {messages.map((msg) => (
                        <div
                            key={msg.id}
                            className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}
                        >
                            <div
                                className={`max-w-[85%] p-3 rounded-2xl text-sm leading-relaxed shadow-sm
                  ${msg.sender === 'user'
                                        ? 'bg-primary text-white rounded-tr-none'
                                        : 'bg-gray-700/80 text-gray-100 rounded-tl-none border border-secondary/20'
                                    }`}
                            >
                                <Markdown
                                    components={{
                                        ul: ({ ...props }) => <ul className="list-disc pl-4 mb-2 space-y-1" {...props} />,
                                        ol: ({ ...props }) => <ol className="list-decimal pl-4 mb-2 space-y-1" {...props} />,
                                        li: ({ ...props }) => <li className="" {...props} />,
                                        p: ({ ...props }) => <p className="mb-2 last:mb-0" {...props} />,
                                        a: ({ ...props }) => (
                                            <a
                                                className={`underline font-medium ${msg.sender === 'user' ? 'text-white' : 'text-primary hover:text-primary-hover'}`}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                {...props}
                                            />
                                        ),
                                        strong: ({ ...props }) => <strong className="font-bold" {...props} />,
                                        h1: ({ ...props }) => <h1 className="text-base font-bold mb-2 mt-1" {...props} />,
                                        h2: ({ ...props }) => <h2 className="text-sm font-bold mb-2 mt-1" {...props} />,
                                        h3: ({ ...props }) => <h3 className="text-sm font-bold mb-1 mt-1" {...props} />,
                                        blockquote: ({ ...props }) => (
                                            <blockquote
                                                className={`border-l-2 pl-2 italic my-2 ${msg.sender === 'user' ? 'border-white/50' : 'border-gray-300 dark:border-gray-600'}`}
                                                {...props}
                                            />
                                        ),
                                        code: ({ inline, ...props }: any) => (
                                            <code
                                                className={`px-1 py-0.5 rounded text-xs font-mono ${msg.sender === 'user' ? 'bg-white/20' : 'bg-gray-100 dark:bg-gray-700'}`}
                                                {...props}
                                            />
                                        )
                                    }}
                                >
                                    {msg.text}
                                </Markdown>
                            </div>
                        </div>
                    ))}
                    {isLoading && (
                        <div className="flex justify-start">
                            <div className="bg-gray-700/80 p-3 rounded-2xl rounded-tl-none border border-secondary/20 flex items-center gap-2">
                                <span className="w-2 h-2 bg-secondary rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></span>
                                <span className="w-2 h-2 bg-secondary rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></span>
                                <span className="w-2 h-2 bg-secondary rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></span>
                            </div>
                        </div>
                    )}
                    <div ref={messagesEndRef} />
                </div>

                {/* Input Area */}
                <form onSubmit={handleSendMessage} className="p-3 bg-gray-900/80 border-t border-secondary/20">
                    <div className="relative flex items-center">
                        <input
                            type="text"
                            value={inputValue}
                            onChange={(e) => setInputValue(e.target.value)}
                            placeholder="Type your question..."
                            className="w-full pl-4 pr-12 py-3 bg-gray-700 text-white rounded-xl text-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all"
                        />
                        <button
                            type="submit"
                            disabled={!inputValue.trim() || isLoading}
                            className="absolute right-2 p-1.5 bg-primary text-white rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-primary-hover transition-colors"
                        >
                            <Send size={16} />
                        </button>
                    </div>
                </form>
            </div>

            {/* Toggle Button */}
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="w-14 h-14 bg-primary hover:bg-primary-hover text-white rounded-full shadow-lg shadow-primary/30 flex items-center justify-center transition-all transform hover:scale-105 active:scale-95"
                aria-label="Open chat"
            >
                {isOpen ? <X size={28} /> : <MessageCircle size={28} />}
            </button>
        </div>
    );
};