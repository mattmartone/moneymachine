import React, { useEffect, useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Send, Sparkles, Bot, User } from 'lucide-react';
import { mockRaces } from '../data';
interface Message {
  id: string;
  role: 'ai' | 'user';
  content: React.ReactNode;
}
export function BetBuilderOverlay({
  isOpen,
  onClose



}: {isOpen: boolean;onClose: () => void;}) {
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
  {
    id: '1',
    role: 'ai',
    content:
    <div className="space-y-3">
          <div className="flex items-center gap-2 mb-2">
            <span className="bg-primary/10 text-primary text-[10px] uppercase tracking-wider font-bold px-2 py-0.5 rounded-full">Coming Soon</span>
          </div>
          <p className="font-semibold">Your AI handicapping agent.</p>
          <p>
            Loaded with historical performance data and live race cards across North America. Execute your strategies across every race running on a given day — it finds where your angles hit with the highest conviction and builds a full wagering plan.
          </p>
          <p className="text-muted text-xs">
            Run your saved strategies across all qualifying races, describe a specific angle, or ask it to help you develop a new one.
          </p>
        </div>

  }]
  );
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({
      behavior: 'smooth'
    });
  };
  useEffect(() => {
    if (isOpen) {
      scrollToBottom();
    }
  }, [messages, isOpen, isTyping]);
  const handleSend = () => {
    if (!input.trim()) return;
    const userMsg = input.trim();
    setInput('');
    setMessages((prev) => [
    ...prev,
    {
      id: Date.now().toString(),
      role: 'user',
      content: <p>{userMsg}</p>
    }]
    );
    setIsTyping(true);
    // Simulate AI processing and generating a plan based on the day's races
    setTimeout(() => {
      setIsTyping(false);
      // Grab a couple of races to make the response contextual
      const race1 = mockRaces[0];
      const race2 = mockRaces[1];
      setMessages((prev) => [
      ...prev,
      {
        id: (Date.now() + 1).toString(),
        role: 'ai',
        content:
        <div className="space-y-4">
              <p>
                Got it. Based on your read and today's tracks, here is a
                structured wagering plan to maximize value while covering your
                angles.
              </p>

              <div className="bg-surface rounded-xl border border-border overflow-hidden">
                <div className="bg-app px-3 py-2 border-b border-border flex justify-between items-center">
                  <span className="text-xs font-bold uppercase tracking-wider text-gray-900">
                    Recommended Plan
                  </span>
                  <span className="text-xs font-semibold text-muted">
                    Est. Cost: $150
                  </span>
                </div>
                <div className="p-3 space-y-3">
                  <div className="space-y-1">
                    <div className="flex justify-between items-baseline">
                      <span className="text-sm font-bold text-gray-900">
                        {race1?.track} R{race1?.raceNumber}
                      </span>
                      <span className="text-xs font-semibold text-primary">
                        Exacta Box
                      </span>
                    </div>
                    <p className="text-xs text-muted leading-relaxed">
                      You liked the speed here. Let's box {race1?.winPick.name}{' '}
                      ({race1?.winPick.pp}) with the{' '}
                      {race1?.exoticBox.join(', ')} to protect against a late
                      closer.
                    </p>
                  </div>
                  <div className="h-px w-full bg-border" />
                  <div className="space-y-1">
                    <div className="flex justify-between items-baseline">
                      <span className="text-sm font-bold text-gray-900">
                        {race2?.track} R{race2?.raceNumber}
                      </span>
                      <span className="text-xs font-semibold text-primary">
                        Win (Double Bet)
                      </span>
                    </div>
                    <p className="text-xs text-muted leading-relaxed">
                      Fading the chalk as requested. {race2?.winPick.name} is
                      sitting at {race2?.winPick.ml} and offers massive value.
                      Hitting this hard.
                    </p>
                  </div>
                </div>
              </div>

              <p className="text-sm font-medium text-gray-900">
                Should we lock this in, or do you want to tweak the budget?
              </p>
            </div>

      }]
      );
    }, 1800);
  };
  return (
    <AnimatePresence>
      {isOpen &&
      <motion.div
        initial={{
          y: '100%'
        }}
        animate={{
          y: 0
        }}
        exit={{
          y: '100%'
        }}
        transition={{
          type: 'spring',
          damping: 28,
          stiffness: 250
        }}
        className="fixed inset-0 z-[100] bg-app flex flex-col md:inset-y-4 md:inset-x-auto md:right-4 md:w-[400px] md:rounded-2xl md:shadow-2xl md:border md:border-border md:overflow-hidden">
        
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 bg-surface border-b border-border shadow-sm">
            <div className="flex items-center gap-2">
              <div className="bg-primary/10 p-1.5 rounded-lg text-primary">
                <Sparkles size={18} />
              </div>
              <div>
                <h2 className="text-sm font-bold text-gray-900 leading-tight">
                  AI Bet Builder
                </h2>
                <p className="text-[10px] uppercase tracking-wider font-semibold text-muted leading-tight">
                  Powered by Fade the Chalk
                </p>
              </div>
            </div>
            <button
            onClick={onClose}
            className="p-2 -mr-2 text-muted hover:text-gray-900 transition-colors rounded-full hover:bg-surface-hover focus:outline-none">
            
              <X size={20} />
            </button>
          </div>

          {/* Chat Area */}
          <div className="flex-1 overflow-y-auto p-4 space-y-6 pb-6">
            {messages.map((msg) =>
          <motion.div
            key={msg.id}
            initial={{
              opacity: 0,
              y: 10
            }}
            animate={{
              opacity: 1,
              y: 0
            }}
            className={`flex gap-3 max-w-[90%] ${msg.role === 'user' ? 'ml-auto flex-row-reverse' : 'mr-auto'}`}>
            
                <div
              className={`shrink-0 w-8 h-8 rounded-full flex items-center justify-center shadow-sm ${msg.role === 'user' ? 'bg-black text-white' : 'bg-primary text-white'}`}>
              
                  {msg.role === 'user' ? <User size={16} /> : <Bot size={16} />}
                </div>
                <div
              className={`rounded-2xl px-4 py-3 text-sm shadow-sm ${msg.role === 'user' ? 'bg-primary text-white rounded-tr-none' : 'bg-surface border border-border text-gray-900 rounded-tl-none'}`}>
              
                  {msg.content}
                </div>
              </motion.div>
          )}

            {isTyping &&
          <motion.div
            initial={{
              opacity: 0,
              y: 10
            }}
            animate={{
              opacity: 1,
              y: 0
            }}
            className="flex gap-3 max-w-[85%] mr-auto">
            
                <div className="shrink-0 w-8 h-8 rounded-full bg-primary text-white flex items-center justify-center shadow-sm">
                  <Bot size={16} />
                </div>
                <div className="bg-surface border border-border rounded-2xl rounded-tl-none px-4 py-4 flex items-center gap-1 shadow-sm">
                  <motion.div
                animate={{
                  y: [0, -4, 0]
                }}
                transition={{
                  repeat: Infinity,
                  duration: 0.6,
                  delay: 0
                }}
                className="w-1.5 h-1.5 bg-muted rounded-full" />
              
                  <motion.div
                animate={{
                  y: [0, -4, 0]
                }}
                transition={{
                  repeat: Infinity,
                  duration: 0.6,
                  delay: 0.2
                }}
                className="w-1.5 h-1.5 bg-muted rounded-full" />
              
                  <motion.div
                animate={{
                  y: [0, -4, 0]
                }}
                transition={{
                  repeat: Infinity,
                  duration: 0.6,
                  delay: 0.4
                }}
                className="w-1.5 h-1.5 bg-muted rounded-full" />
              
                </div>
              </motion.div>
          }
            <div ref={messagesEndRef} />
          </div>

          {/* Input Area */}
          <div className="p-4 bg-surface border-t border-border pb-safe">
            <div className="max-w-md mx-auto relative flex items-center">
              <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSend()}
              placeholder="Describe your angle..."
              className="w-full bg-app border border-border rounded-full pl-4 pr-12 py-3 text-sm text-gray-900 placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-primary/50 transition-shadow" />
            
              <button
              onClick={handleSend}
              disabled={!input.trim() || isTyping}
              className="absolute right-1.5 p-2 bg-primary text-white rounded-full disabled:opacity-50 disabled:bg-muted transition-colors focus:outline-none">
              
                <Send size={16} className="ml-0.5" />
              </button>
            </div>
          </div>
        </motion.div>
      }
    </AnimatePresence>);

}