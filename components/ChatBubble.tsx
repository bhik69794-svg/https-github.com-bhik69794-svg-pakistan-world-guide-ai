import React, { useState, useEffect } from 'react';
import ReactMarkdown from 'react-markdown';
import { Message } from '../types';
import { Bot, User, Volume2, Square } from 'lucide-react';
import { GroundingChips } from './GroundingChips';

interface ChatBubbleProps {
  message: Message;
}

export const ChatBubble: React.FC<ChatBubbleProps> = ({ message }) => {
  const isBot = message.role === 'model';
  const [isSpeaking, setIsSpeaking] = useState(false);

  useEffect(() => {
    // Stop speaking if component unmounts or text changes
    return () => {
        window.speechSynthesis.cancel();
    };
  }, []);

  const handleSpeak = () => {
    if (isSpeaking) {
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
      return;
    }

    // Cancel any existing speech
    window.speechSynthesis.cancel();

    // Create utterance
    // Strip Markdown for better speech
    const cleanText = message.text.replace(/[*_#\[\]]/g, '');
    const utterance = new SpeechSynthesisUtterance(cleanText);
    
    // Try to find a voice that supports Urdu or default to English
    const voices = window.speechSynthesis.getVoices();
    // Prefer a generic English voice or local device voice
    // Note: Browser support for specific Urdu voices is limited, usually falls back to system default
    
    utterance.rate = 1.0;
    utterance.pitch = 1.0;
    
    utterance.onend = () => setIsSpeaking(false);
    utterance.onerror = () => setIsSpeaking(false);

    window.speechSynthesis.speak(utterance);
    setIsSpeaking(true);
  };

  return (
    <div className={`flex w-full mb-6 ${isBot ? 'justify-start' : 'justify-end'}`}>
      <div className={`flex max-w-[85%] md:max-w-[75%] gap-3 ${isBot ? 'flex-row' : 'flex-row-reverse'}`}>
        
        {/* Avatar */}
        <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center border ${isBot ? 'bg-white text-black border-gray-300' : 'bg-black text-white border-black'}`}>
          {isBot ? <Bot size={18} /> : <User size={18} />}
        </div>

        {/* Content Bubble */}
        <div className={`flex flex-col ${isBot ? 'items-start' : 'items-end'}`}>
          <div className={`
            px-5 py-3.5 rounded-2xl shadow-sm text-sm md:text-base leading-relaxed overflow-hidden relative group
            ${isBot 
              ? 'bg-white text-gray-900 border border-gray-200 rounded-tl-none' 
              : 'bg-black text-white rounded-tr-none'
            }
          `}>
            {message.image && (
              <div className="mb-3 rounded-lg overflow-hidden border border-white/20">
                <img src={message.image} alt="Uploaded" className="max-w-full h-auto max-h-64 object-cover" />
              </div>
            )}
            
            <div className={`prose prose-sm max-w-none ${isBot ? 'prose-headings:text-black prose-a:text-blue-600' : 'prose-invert'} ${message.text.match(/[\u0600-\u06FF]/) ? 'urdu-text text-right' : ''}`}>
              <ReactMarkdown>{message.text}</ReactMarkdown>
            </div>

            {/* AI Voice Button (Only for Bot) */}
            {isBot && (
                <button 
                    onClick={handleSpeak}
                    className="absolute top-2 right-2 p-1.5 rounded-full bg-gray-100 text-gray-600 hover:bg-gray-200 transition-colors opacity-0 group-hover:opacity-100 focus:opacity-100"
                    title={isSpeaking ? "Stop Speaking" : "Read Aloud"}
                >
                    {isSpeaking ? <Square size={12} className="fill-current" /> : <Volume2 size={14} />}
                </button>
            )}
          </div>
          
          {/* Grounding Sources (Only for Bot) */}
          {isBot && message.groundingMetadata && (
            <GroundingChips metadata={message.groundingMetadata} />
          )}

          {/* Timestamp */}
          <span className="text-[10px] text-gray-400 mt-1 px-1">
            {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </span>
        </div>
      </div>
    </div>
  );
};