import React, { useState, useRef, useEffect } from 'react';
import { Message, Coordinates, PoiData } from './types';
import { sendMessageToGemini } from './services/geminiService';
import { ChatBubble } from './components/ChatBubble';
import { MapWidget } from './components/MapWidget';
import { Send, Image as ImageIcon, X, Loader2, Navigation, Map as MapIcon, MessageSquare } from 'lucide-react';

const INITIAL_MESSAGE: Message = {
  id: 'init',
  role: 'model',
  text: "Hello! I am your **Pakistan World Guide AI**. \n\nI can guide you about any city, market, street, or famous place in Pakistan. \n\nHow can I help you today?",
  timestamp: new Date()
};

const SplashScreen = ({ onFinish }: { onFinish: () => void }) => {
  const [mounted, setMounted] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setMounted(false);
      setTimeout(onFinish, 700); // Wait for fade out transition
    }, 2800);
    return () => clearTimeout(timer);
  }, [onFinish]);

  return (
    <div className={`fixed inset-0 z-50 bg-white flex flex-col items-center justify-center transition-opacity duration-700 ease-in-out ${mounted ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}>
      <div className="flex flex-col items-center">
        {/* Animated Logo */}
        <div className="w-24 h-24 bg-black rounded-2xl flex items-center justify-center shadow-2xl mb-8 animate-scale-in">
          <span className="text-white text-4xl font-bold tracking-widest">PK</span>
        </div>
        
        {/* Animated Text */}
        <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-2 tracking-tight animate-fade-in-up delay-100 opacity-0 text-center px-4">
          Pakistan World Guide
        </h1>
        <p className="text-gray-500 text-sm font-medium tracking-wide uppercase animate-fade-in-up delay-200 opacity-0">
          Powered by Gemini AI & Maps
        </p>

        {/* Loading Bar */}
        <div className="mt-12 w-48 h-1 bg-gray-100 rounded-full overflow-hidden animate-fade-in-up delay-300 opacity-0">
           <div className="h-full bg-black animate-[width_2.5s_ease-in-out_forwards]" style={{width: '0%'}}></div>
        </div>
      </div>
    </div>
  );
};

export default function App() {
  const [messages, setMessages] = useState<Message[]>([INITIAL_MESSAGE]);
  const [inputText, setInputText] = useState('');
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [showSplash, setShowSplash] = useState(true);
  
  // Location States
  const [userLocation, setUserLocation] = useState<Coordinates | undefined>(undefined);
  const [isLocating, setIsLocating] = useState(false);
  
  // Changed activePoi to activePois (Array)
  const [activePois, setActivePois] = useState<PoiData[]>([]);

  // UI States
  const [activeTab, setActiveTab] = useState<'chat' | 'map'>('chat'); // For mobile
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    if (activeTab === 'chat') {
        scrollToBottom();
    }
  }, [messages, activeTab]);

  // Handle Image Upload
  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setSelectedImage(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  // Get Geolocation
  const handleGeolocation = () => {
    if (!navigator.geolocation) {
      alert("Geolocation is not supported by your browser");
      return;
    }
    setIsLocating(true);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setUserLocation({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude
        });
        setIsLocating(false);
        // Switch to map view on mobile if enabled
        if (window.innerWidth < 768) {
           setActiveTab('map');
        }
      },
      () => {
        alert("Unable to retrieve your location");
        setIsLocating(false);
      }
    );
  };

  // Send Message
  const handleSend = async () => {
    if ((!inputText.trim() && !selectedImage) || isLoading) return;

    const userMsg: Message = {
      id: Date.now().toString(),
      role: 'user',
      text: inputText,
      image: selectedImage || undefined,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMsg]);
    setInputText('');
    setSelectedImage(null);
    setIsLoading(true);

    // Call API
    try {
      const response = await sendMessageToGemini(userMsg.text || "Describe this image", userMsg.image, userLocation);
      
      // Handle legacy single POI or new Array POIs
      let currentPois: PoiData[] = [];
      if (response.pois && response.pois.length > 0) {
        currentPois = response.pois;
      }

      const botMsg: Message = {
        id: (Date.now() + 1).toString(),
        role: 'model',
        text: response.text,
        groundingMetadata: response.groundingMetadata,
        // Store first POI for legacy support if needed, but we rely on state
        poi: currentPois[0], 
        timestamp: new Date()
      };
      
      setMessages(prev => [...prev, botMsg]);

      // If locations found, update map and switch view on mobile
      if (currentPois.length > 0) {
        setActivePois(currentPois);
        if (window.innerWidth < 768) {
            setActiveTab('map');
        }
      }

    } catch (error) {
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  // Calculate if map is visible for resize trigger
  const isMapVisible = activeTab === 'map' || (typeof window !== 'undefined' && window.innerWidth >= 768);

  return (
    <div className="flex flex-col h-screen bg-gray-50 relative overflow-hidden font-sans">
      
      {/* Splash Screen Overlay */}
      {showSplash && <SplashScreen onFinish={() => setShowSplash(false)} />}

      {/* Header - Black & White Theme */}
      <header className="bg-white border-b border-gray-200 px-4 py-3 shadow-sm z-30 flex items-center justify-between shrink-0 h-[64px]">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-black rounded-xl flex items-center justify-center shadow-lg text-white font-bold text-xl tracking-wider">
            PK
          </div>
          <div className="hidden sm:block">
            <h1 className="font-bold text-gray-900 text-lg leading-tight tracking-tight">Pakistan World Guide AI</h1>
            <p className="text-xs text-gray-500 font-medium">Powered by Gemini & Maps</p>
          </div>
        </div>

        {/* Mobile Tabs */}
        <div className="flex md:hidden bg-gray-100 rounded-lg p-1">
            <button 
                onClick={() => setActiveTab('chat')}
                className={`px-4 py-1.5 rounded-md text-xs font-bold flex items-center gap-1 transition-all ${activeTab === 'chat' ? 'bg-black text-white shadow-md' : 'text-gray-500'}`}
            >
                <MessageSquare size={14} /> Chat
            </button>
            <button 
                onClick={() => setActiveTab('map')}
                className={`px-4 py-1.5 rounded-md text-xs font-bold flex items-center gap-1 transition-all ${activeTab === 'map' ? 'bg-black text-white shadow-md' : 'text-gray-500'}`}
            >
                <MapIcon size={14} /> Map
            </button>
        </div>
        
        {/* Location Toggle Status */}
        <div 
            onClick={handleGeolocation}
            className={`cursor-pointer flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold transition-all border ${
            userLocation 
                ? 'bg-black text-white border-black' 
                : 'bg-white text-gray-600 border-gray-300 hover:bg-gray-50'
            }`}
        >
            {isLocating ? <Loader2 className="w-3 h-3 animate-spin" /> : <Navigation className="w-3 h-3" />}
            <span className="hidden sm:inline">{userLocation ? "GPS Active" : "Enable GPS"}</span>
        </div>
      </header>

      {/* Main Content Area */}
      <div className="flex-1 flex overflow-hidden relative">
        
        {/* Chat Panel */}
        <div className={`
            flex-col bg-gray-50
            w-full md:w-[45%] lg:w-[40%] md:border-r border-gray-200 transition-transform duration-300 absolute md:relative h-full z-10 md:z-auto
            ${activeTab === 'chat' ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}
            md:flex
        `}>
          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 md:p-6 scroll-smooth">
            <div className="pb-4">
                {messages.map((msg, idx) => (
                    <div key={idx}>
                        <ChatBubble message={msg} />
                    </div>
                ))}
                {isLoading && (
                    <div className="flex justify-start w-full mb-6">
                    <div className="flex items-center gap-3 bg-white px-5 py-3 rounded-2xl rounded-tl-none border border-gray-200 shadow-sm">
                        <Loader2 className="w-4 h-4 text-black animate-spin" />
                        <span className="text-gray-600 text-sm font-medium">Processing...</span>
                    </div>
                    </div>
                )}
                <div ref={messagesEndRef} />
            </div>
          </div>

          {/* Input Area */}
          <div className="bg-white border-t border-gray-200 p-4 shrink-0">
            {selectedImage && (
                <div className="mb-3 relative inline-block">
                <img src={selectedImage} alt="Preview" className="h-16 w-16 object-cover rounded-lg border border-gray-200 shadow-sm grayscale hover:grayscale-0 transition-all" />
                <button 
                    onClick={() => setSelectedImage(null)}
                    className="absolute -top-2 -right-2 bg-black text-white rounded-full p-1 shadow-sm hover:bg-gray-800 transition-colors"
                >
                    <X size={10} />
                </button>
                </div>
            )}

            <div className="flex items-end gap-2 bg-gray-100 p-2 rounded-2xl border border-gray-200 focus-within:border-black focus-within:ring-1 focus-within:ring-black transition-all shadow-sm">
                <input 
                type="file" 
                accept="image/*" 
                className="hidden" 
                ref={fileInputRef} 
                onChange={handleImageUpload} 
                />
                
                <button 
                onClick={() => fileInputRef.current?.click()}
                className="p-2.5 text-gray-500 hover:text-black hover:bg-gray-200 rounded-xl transition-colors"
                title="Upload Image"
                >
                <ImageIcon size={20} />
                </button>

                <textarea
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Ask about a location in Pakistan..."
                className="flex-1 bg-transparent border-none focus:ring-0 resize-none py-2.5 max-h-32 text-gray-800 placeholder-gray-400 urdu-text text-sm"
                rows={1}
                style={{ minHeight: '40px' }}
                />

                <button 
                onClick={handleSend}
                disabled={isLoading || (!inputText.trim() && !selectedImage)}
                className={`p-2.5 rounded-xl flex items-center justify-center transition-all duration-200 ${
                    isLoading || (!inputText.trim() && !selectedImage)
                    ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
                    : 'bg-black text-white shadow-md hover:bg-gray-800 hover:shadow-lg active:scale-95'
                }`}
                >
                <Send size={18} />
                </button>
            </div>
          </div>
        </div>

        {/* Map Panel */}
        <div className={`
            w-full md:w-[55%] lg:w-[60%] bg-gray-100 h-full absolute md:relative z-20 md:z-auto transition-transform duration-300
            ${activeTab === 'map' ? 'translate-x-0' : 'translate-x-full md:translate-x-0'}
        `}>
           <MapWidget 
              userLocation={userLocation} 
              targetPois={activePois} 
              isVisible={isMapVisible}
           />
        </div>

      </div>
    </div>
  );
}