import React, { useState, useRef } from 'react';
import { Camera, FileText, Send, Sparkles, Play, Pause, Save, Loader2, ArrowRight } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { simplifyText, getTTS, extractTextFromImage, SimplificationResult } from '../services/geminiService';
import { db, auth } from '../lib/firebase';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { handleFirestoreError, OperationType } from '../lib/firestoreErrorHandler';

export default function Simplifier() {
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<SimplificationResult | null>(null);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [saving, setSaving] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleSimplify = async () => {
    if (!input.trim() || loading) return;
    setLoading(true);
    try {
      const res = await simplifyText(input);
      setResult(res);
      // Log to history
      if (auth.currentUser) {
        try {
          await addDoc(collection(db, 'history'), {
            userId: auth.currentUser.uid,
            originalText: input,
            simplifiedText: res.level1,
            createdAt: serverTimestamp()
          });
        } catch (err) {
          handleFirestoreError(err, OperationType.CREATE, 'history');
        }
      }
    } catch (error) {
      console.error(error);
      alert('Kuch masla hua. Phir se try karen.');
    } finally {
      setLoading(false);
    }
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setLoading(true);
    try {
      const reader = new FileReader();
      reader.onload = async () => {
        const base64 = (reader.result as string).split(',')[1];
        const extracted = await extractTextFromImage(base64);
        setInput(extracted);
        setLoading(false);
      };
      reader.readAsDataURL(file);
    } catch (error) {
      console.error(error);
      alert('OCR failed. Please try again.');
      setLoading(false);
    }
  };

  const handlePlayAudio = async () => {
    if (!result) return;
    if (audioUrl) {
      if (isPlaying) {
        audioRef.current?.pause();
      } else {
        audioRef.current?.play();
      }
      return;
    }

    try {
      setIsPlaying(true);
      const url = await getTTS(result.level3);
      setAudioUrl(url);
    } catch (error) {
      console.error(error);
      setIsPlaying(false);
    }
  };

  const handleSaveToDeck = async () => {
    if (!result || !auth.currentUser || saving) return;
    setSaving(true);
    try {
      await addDoc(collection(db, 'flashcards'), {
        userId: auth.currentUser.uid,
        concept: result.concept,
        originalText: input,
        simplifiedText: result.level1,
        analogy: result.level2,
        createdAt: serverTimestamp()
      });
      alert('Saved to your study deck!');
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, 'flashcards');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-8">
      {/* Input Section */}
      <section className="bg-white rounded-[32px] p-6 shadow-sm border border-black/5">
        <div className="flex items-center gap-2 mb-4 text-[#5A5A40]">
          <FileText className="w-5 h-5" />
          <h3 className="font-bold">Paste from Textbook</h3>
        </div>
        
        <textarea
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Paste difficult academic text here (e.g., from Physics, Biology, or Economics)..."
          className="w-full h-40 bg-[#F5F5F0] rounded-2xl p-4 focus:ring-2 focus:ring-[#5A5A40] outline-none transition-all resize-none text-[#141414]"
        />

        <div className="flex items-center justify-between mt-4">
          <button 
            onClick={() => fileInputRef.current?.click()}
            className="flex items-center gap-2 text-sm font-medium text-gray-500 hover:text-[#5A5A40] transition-colors"
          >
            <Camera className="w-4 h-4" />
            Snap a Page
          </button>
          <input 
            type="file" 
            ref={fileInputRef} 
            onChange={handleImageUpload} 
            className="hidden" 
            accept="image/*" 
          />

          <button
            onClick={handleSimplify}
            disabled={!input.trim() || loading}
            className="bg-[#5A5A40] text-white px-6 py-3 rounded-full flex items-center gap-2 font-bold hover:scale-105 active:scale-95 transition-all disabled:opacity-50 disabled:scale-100"
          >
            {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Sparkles className="w-5 h-5" />}
            Simplify Now
          </button>
        </div>
      </section>

      {/* Result Section */}
      <AnimatePresence>
        {result && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-6"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="bg-[#5A5A40]/10 px-3 py-1 rounded-full text-[#5A5A40] text-sm font-bold uppercase tracking-wider">
                  {result.concept}
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button 
                  onClick={handlePlayAudio}
                  className="bg-white border p-3 rounded-full hover:bg-gray-50 transition-colors shadow-sm"
                  title="Listen to Explanation"
                >
                  {isPlaying ? <Pause className="w-5 h-5 text-[#5A5A40]" /> : <Play className="w-5 h-5 text-[#5A5A40]" />}
                </button>
                <button 
                  onClick={handleSaveToDeck}
                  disabled={saving}
                  className="bg-white border p-3 rounded-full hover:bg-gray-50 transition-colors shadow-sm"
                  title="Save to Flashcards"
                >
                  <Save className={`w-5 h-5 ${saving ? 'animate-pulse' : 'text-[#5A5A40]'}`} />
                </button>
              </div>
            </div>

            {audioUrl && (
              <audio 
                ref={audioRef} 
                src={audioUrl} 
                onPlay={() => setIsPlaying(true)} 
                onPause={() => setIsPlaying(false)} 
                onEnded={() => setIsPlaying(false)}
                className="hidden" 
              />
            )}

            {/* Level 1: The Hook */}
            <div className="bg-[#5A5A40] text-white p-6 rounded-[32px] shadow-lg">
              <p className="text-xs uppercase font-bold opacity-70 mb-2">Level 1: The Hook (Short Summary)</p>
              <h2 className="text-2xl font-medium leading-tight">
                {result.level1}
              </h2>
            </div>

            {/* Level 2: The Analogy */}
            <div className="bg-white rounded-[32px] p-8 shadow-sm border border-black/5 relative overflow-hidden">
               <div className="absolute top-0 right-0 p-8 opacity-5">
                 <Sparkles className="w-32 h-32" />
               </div>
               <p className="text-xs uppercase font-bold text-gray-400 mb-4 tracking-widest">Level 2: The Local Analogy</p>
               <div className="prose max-w-none text-lg text-gray-700 leading-relaxed italic">
                 {result.level2.split('\n').map((para, i) => (
                   <p key={i} className="mb-4">{para}</p>
                 ))}
               </div>
            </div>

            {/* Level 3 Info */}
            <div className="bg-gray-100 rounded-3xl p-4 flex items-center justify-between text-sm text-gray-500">
               <div className="flex items-center gap-2">
                 <Play className="w-4 h-4" />
                 <span>Click the play button to hear this in conversational Urdu/English mix.</span>
               </div>
               <button 
                 onClick={() => setResult(null)}
                 className="text-xs font-bold uppercase hover:text-[#5A5A40]"
               >
                 Clear
               </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
