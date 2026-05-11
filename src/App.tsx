import React, { useState } from 'react';
import Layout from './components/Layout';
import Simplifier from './components/Simplifier';
import Dashboard from './components/Dashboard';
import { BookOpen, Sparkles } from 'lucide-react';

export default function App() {
  const [view, setView] = useState<'simplify' | 'dashboard'>('simplify');

  return (
    <Layout>
      <div className="flex flex-col gap-8">
        {/* Navigation Tabs */}
        <div className="flex items-center gap-2 bg-white p-1 rounded-2xl w-fit shadow-sm border border-black/5 self-center">
          <button
            onClick={() => setView('simplify')}
            className={`flex items-center gap-2 px-6 py-2.5 rounded-xl text-sm font-bold transition-all ${
              view === 'simplify' 
              ? 'bg-[#5A5A40] text-white shadow-md' 
              : 'text-gray-500 hover:bg-gray-50'
            }`}
          >
            <Sparkles className="w-4 h-4" />
            Simplifier
          </button>
          <button
            onClick={() => setView('dashboard')}
            className={`flex items-center gap-2 px-6 py-2.5 rounded-xl text-sm font-bold transition-all ${
              view === 'dashboard' 
              ? 'bg-[#5A5A40] text-white shadow-md' 
              : 'text-gray-500 hover:bg-gray-50'
            }`}
          >
            <BookOpen className="w-4 h-4" />
            My Deck
          </button>
        </div>

        {/* Dynamic View */}
        <div className="min-h-[500px]">
          {view === 'simplify' ? <Simplifier /> : <Dashboard />}
        </div>
      </div>
    </Layout>
  );
}
