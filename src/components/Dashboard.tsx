import React, { useEffect, useState } from 'react';
import { db, auth } from '../lib/firebase';
import { collection, query, where, orderBy, getDocs, deleteDoc, doc, onSnapshot } from 'firebase/firestore';
import { Trash2, BookOpen, Clock, ChevronRight } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { handleFirestoreError, OperationType } from '../lib/firestoreErrorHandler';

interface Flashcard {
  id: string;
  concept: string;
  simplifiedText: string;
  analogy: string;
  createdAt: any;
}

interface HistoryItem {
  id: string;
  originalText: string;
  simplifiedText: string;
  createdAt: any;
}

export default function Dashboard() {
  const [flashcards, setFlashcards] = useState<Flashcard[]>([]);
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [activeTab, setActiveTab] = useState<'cards' | 'history'>('cards');
  const [loading, setLoading] = useState(true);

  const fetchData = async () => {
    if (!auth.currentUser) return;
    setLoading(true);
    
    const qCards = query(
      collection(db, 'flashcards'), 
      where('userId', '==', auth.currentUser.uid),
      orderBy('createdAt', 'desc')
    );
    const qHistory = query(
      collection(db, 'history'), 
      where('userId', '==', auth.currentUser.uid),
      orderBy('createdAt', 'desc')
    );

    const unsubCards = onSnapshot(qCards, (snap) => {
      setFlashcards(snap.docs.map(d => ({ id: d.id, ...d.data() } as Flashcard)));
      setLoading(false);
    }, (err) => handleFirestoreError(err, OperationType.LIST, 'flashcards'));

    const unsubHistory = onSnapshot(qHistory, (snap) => {
      setHistory(snap.docs.map(d => ({ id: d.id, ...d.data() } as HistoryItem)));
    }, (err) => handleFirestoreError(err, OperationType.LIST, 'history'));

    return { unsubCards, unsubHistory };
  };

  useEffect(() => {
    let unsubs: { unsubCards: () => void, unsubHistory: () => void } | undefined;
    fetchData().then(res => unsubs = res);
    return () => {
      unsubs?.unsubCards();
      unsubs?.unsubHistory();
    };
  }, []);

  const deleteItem = async (type: 'flashcards' | 'history', id: string) => {
    try {
      await deleteDoc(doc(db, type, id));
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, type);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex gap-4 border-b border-black/5 pb-1">
        <button 
          onClick={() => setActiveTab('cards')}
          className={`pb-3 px-2 text-sm font-bold uppercase tracking-wider transition-all border-b-2 ${activeTab === 'cards' ? 'border-[#5A5A40] text-[#5A5A40]' : 'border-transparent text-gray-400'}`}
        >
          Study Deck ({flashcards.length})
        </button>
        <button 
          onClick={() => setActiveTab('history')}
          className={`pb-3 px-2 text-sm font-bold uppercase tracking-wider transition-all border-b-2 ${activeTab === 'history' ? 'border-[#5A5A40] text-[#5A5A40]' : 'border-transparent text-gray-400'}`}
        >
          History
        </button>
      </div>

      <AnimatePresence mode="wait">
        {loading ? (
          <motion.div 
            key="loading"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="flex justify-center py-12"
          >
            <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-[#5A5A40]"></div>
          </motion.div>
        ) : activeTab === 'cards' ? (
          <motion.div 
            key="cards"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
            className="grid grid-cols-1 gap-4"
          >
            {flashcards.length === 0 ? (
              <EmptyState title="Deck is Empty" desc="Save simplified concepts to review them later." />
            ) : (
              flashcards.map((card) => (
                <div key={card.id} className="bg-white p-6 rounded-[32px] border border-black/5 shadow-sm space-y-4">
                  <div className="flex justify-between items-start">
                    <h3 className="text-xl font-bold text-[#5A5A40]">{card.concept}</h3>
                    <button 
                      onClick={() => deleteItem('flashcards', card.id)}
                      className="p-2 text-gray-400 hover:text-red-500 transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                  <p className="text-lg font-medium leading-tight border-l-4 border-[#5A5A40]/20 pl-4 py-1">
                    {card.simplifiedText}
                  </p>
                  <div className="bg-[#F5F5F0] p-4 rounded-2xl">
                    <p className="text-xs font-bold text-gray-400 uppercase mb-2">The Analogy</p>
                    <p className="text-sm text-gray-600 italic leading-relaxed">{card.analogy}</p>
                  </div>
                </div>
              ))
            )}
          </motion.div>
        ) : (
          <motion.div 
            key="history"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
            className="space-y-3"
          >
            {history.length === 0 ? (
              <EmptyState title="No History Yet" desc="Start simplifying academic text to see your log here." />
            ) : (
              history.map((item) => (
                <div key={item.id} className="bg-white p-4 rounded-2xl border border-black/5 flex items-center justify-between group">
                  <div className="flex items-center gap-4 min-w-0">
                    <div className="bg-gray-100 p-2 rounded-lg text-gray-500">
                      <Clock className="w-4 h-4" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-gray-900 truncate max-w-md">{item.originalText}</p>
                      <p className="text-xs text-gray-400 flex items-center gap-1">
                        Simplified to: <span className="text-[#5A5A40] font-medium truncate">{item.simplifiedText}</span>
                      </p>
                    </div>
                  </div>
                  <button 
                    onClick={() => deleteItem('history', item.id)}
                    className="p-2 text-transparent group-hover:text-red-500 transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function EmptyState({ title, desc }: { title: string, desc: string }) {
  return (
    <div className="text-center py-20 bg-white rounded-[32px] border border-dashed border-gray-200">
      <h3 className="text-lg font-bold text-gray-400 mb-2">{title}</h3>
      <p className="text-sm text-gray-500">{desc}</p>
    </div>
  );
}
