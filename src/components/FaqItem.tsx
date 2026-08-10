import React, { useState } from 'react';
import { ChevronDown, ChevronUp } from 'lucide-react';

export function FaqItem({ question, answer }: { question: string; answer: string }) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="bg-card rounded-xl border border-border-main overflow-hidden transition-colors">
      <button 
        className="w-full flex items-center justify-between p-4 text-left hover:bg-black/5 dark:hover:bg-white/5 transition-colors"
        onClick={() => setIsOpen(!isOpen)}
      >
        <span className="font-medium text-sm text-text-main">{question}</span>
        {isOpen ? (
          <ChevronUp className="w-5 h-5 text-text-secondary" />
        ) : (
          <ChevronDown className="w-5 h-5 text-text-secondary" />
        )}
      </button>
      {isOpen && (
        <div className="px-4 pb-4 text-sm text-text-secondary">
          {answer}
        </div>
      )}
    </div>
  );
}
