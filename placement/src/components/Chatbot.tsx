import React, { useState, useRef, useEffect } from 'react';
import { MessageSquare, X, Send, GraduationCap, Sparkles, User, Loader2, Award } from 'lucide-react';
import { ChatMessage } from '../types';
import { sendMessageToChatbot } from '../api/chatbot';

interface ChatbotProps {
  role: 'Faculty' | 'Placement Faculty' | 'Student';
}

export default function Chatbot({ role }: ChatbotProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'welcome',
      sender: 'bot',
      text: `Hello there! I am your Placement Mentor. As a **${role}**, you can ask me anything about resume formatting, technical skill enhancement, target company requirements, or academic indices!`,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    }
  ]);
  const [inputValue, setInputValue] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Suggested questions based on role
  const suggestedPrompts = {
    Faculty: [
      'Student performance summary?',
      'How to analyze dataset errors?',
      'Identify critical skill gaps'
    ],
    'Placement Faculty': [
      'Google placement criteria?',
      'Skills demand trends?',
      'How to upload company requirements'
    ],
    Student: [
      'How to improve placement score?',
      'Best resume suggestions?',
      'What core skills to learn?'
    ]
  };

  const activePrompts = suggestedPrompts[role] || suggestedPrompts.Student;

  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isTyping]);

  const handleSendMessage = async (text: string) => {
    if (!text.trim()) return;

    const userMsg: ChatMessage = {
      id: `user_${Date.now()}`,
      sender: 'user',
      text,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    setMessages(prev => [...prev, userMsg]);
    setInputValue('');
    setIsTyping(true);

    try {
      const replyText = await sendMessageToChatbot(text, messages, role);
      
      const botMsg: ChatMessage = {
        id: `bot_${Date.now()}`,
        sender: 'bot',
        text: replyText,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };
      setMessages(prev => [...prev, botMsg]);
    } catch (error) {
      const errorMsg: ChatMessage = {
        id: `bot_err_${Date.now()}`,
        sender: 'bot',
        text: "I am having trouble connecting to the live backend chat node, but placement readiness can always be enhanced! Ensure your skills are current and your resume highlights measurable metrics.",
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };
      setMessages(prev => [...prev, errorMsg]);
    } finally {
      setIsTyping(false);
    }
  };

  return (
    <div className="fixed bottom-6 right-6 z-50">
      {/* Floating Career Mentor Bubble Icon */}
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className="p-4 bg-blue-600 hover:bg-blue-700 text-white rounded-full shadow-2xl flex items-center justify-center transition-all duration-300 hover:scale-110 animate-bounce relative group cursor-pointer"
        >
          <div className="relative">
            <GraduationCap size={24} />
            <Sparkles size={10} className="absolute -top-1 -right-1 text-yellow-300 animate-pulse" />
          </div>
          <span className="absolute right-15 top-3 px-3 py-1.5 bg-slate-900 text-white text-[10px] rounded-xl opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap font-extrabold tracking-wide">
            Ask Career Mentor
          </span>
          <span className="absolute -top-1 -right-1 flex h-4 w-4">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-4 w-4 bg-blue-500"></span>
          </span>
        </button>
      )}

      {/* Floating Chat Interface */}
      {isOpen && (
        <div className="w-80 sm:w-96 h-[500px] bg-white border border-slate-100 rounded-3xl shadow-2xl flex flex-col overflow-hidden z-50 animate-fade-in">
          {/* Chat Header */}
          <div className="p-4 bg-blue-600 text-white flex items-center justify-between">
            <div className="flex items-center space-x-2.5">
              <span className="p-2 bg-white/10 rounded-xl text-white">
                <GraduationCap size={18} />
              </span>
              <div>
                <h4 className="text-xs font-bold tracking-wide">Career Mentor</h4>
                <p className="text-[10px] text-blue-100 flex items-center font-semibold">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 mr-1 animate-pulse"></span>
                  Active Advisor
                </p>
              </div>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              className="p-1 hover:bg-white/15 rounded-lg text-white transition-colors cursor-pointer"
            >
              <X size={18} />
            </button>
          </div>

          {/* Chat Message Stream */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-50/50">
            {messages.map((msg) => {
              const isBot = msg.sender === 'bot';
              return (
                <div key={msg.id} className={`flex items-start space-x-2.5 ${isBot ? '' : 'flex-row-reverse space-x-reverse'}`}>
                  {/* Icon */}
                  <div className={`p-1.5 rounded-xl flex-shrink-0 mt-0.5 ${isBot ? 'bg-blue-50 text-blue-600' : 'bg-slate-100 text-slate-600'}`}>
                    {isBot ? <GraduationCap size={14} /> : <User size={14} />}
                  </div>

                  {/* Body Bubble */}
                  <div className="max-w-[75%]">
                    <div className={`p-3 rounded-2xl text-xs leading-relaxed shadow-sm border ${
                      isBot 
                        ? 'bg-white text-slate-700 border-slate-100' 
                        : 'bg-blue-600 text-white border-blue-600'
                    }`}>
                      {msg.text.split('\n').map((line, lidx) => {
                        const boldPattern = /\*\*(.*?)\*\*/g;
                        const parts = [];
                        let lastIndex = 0;
                        let match;
                        while ((match = boldPattern.exec(line)) !== null) {
                          if (match.index > lastIndex) {
                            parts.push(line.substring(lastIndex, match.index));
                          }
                          parts.push(<strong key={match.index} className="font-bold text-slate-900">{match[1]}</strong>);
                          lastIndex = boldPattern.lastIndex;
                        }
                        if (lastIndex < line.length) {
                          parts.push(line.substring(lastIndex));
                        }

                        return (
                          <p key={lidx} className={lidx > 0 ? 'mt-1' : ''}>
                            {parts.length > 0 ? parts : line}
                          </p>
                        );
                      })}
                    </div>
                    <span className="text-[9px] text-slate-400 mt-1 block px-1 font-semibold">
                      {msg.timestamp}
                    </span>
                  </div>
                </div>
              );
            })}

            {/* Typing Indicator */}
            {isTyping && (
              <div className="flex items-start space-x-2.5">
                <div className="p-1.5 rounded-xl bg-blue-50 text-blue-600 flex-shrink-0">
                  <GraduationCap size={14} />
                </div>
                <div className="p-3 bg-white text-slate-500 rounded-2xl text-xs border border-slate-100 shadow-sm flex items-center space-x-1">
                  <Loader2 size={12} className="animate-spin text-blue-500" />
                  <span className="font-medium">Mentor is analyzing...</span>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Recommended Prompt Pills */}
          {messages.length === 1 && (
            <div className="px-4 py-2 border-t border-slate-100 flex flex-wrap gap-1.5 bg-slate-50/50">
              {activePrompts.map((p, idx) => (
                <button
                  key={idx}
                  onClick={() => handleSendMessage(p)}
                  className="text-[10px] font-bold text-blue-600 bg-blue-50 hover:bg-blue-100 border border-blue-100/30 px-2.5 py-1 rounded-full text-left transition-colors cursor-pointer"
                >
                  {p}
                </button>
              ))}
            </div>
          )}

          {/* Message Form Input */}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSendMessage(inputValue);
            }}
            className="p-3 border-t border-slate-100 flex items-center space-x-2 bg-white"
          >
            <input
              type="text"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              placeholder="Ask me something..."
              className="flex-1 px-3 py-2 text-xs bg-slate-50 border border-slate-100 rounded-xl text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
            <button
              type="submit"
              disabled={!inputValue.trim()}
              className="p-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl disabled:bg-slate-100 disabled:text-slate-400 transition-colors flex-shrink-0 cursor-pointer"
            >
              <Send size={14} />
            </button>
          </form>
        </div>
      )}
    </div>
  );
}
