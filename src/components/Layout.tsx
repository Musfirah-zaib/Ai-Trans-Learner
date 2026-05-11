import React, { useEffect, useState } from 'react';
import { User, onAuthStateChanged } from 'firebase/auth';
import { auth, loginWithGoogle, logout } from '../lib/firebase';
import { LogIn, LogOut, GraduationCap, User as UserIcon } from 'lucide-react';
import { motion } from 'motion/react';

interface LayoutProps {
  children: React.ReactNode;
}

export default function Layout({ children }: LayoutProps) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    return onAuthStateChanged(auth, (u) => {
      setUser(u);
      setLoading(false);
    });
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#F5F5F0] flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#5A5A40]"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F5F5F0] text-[#141414] font-sans">
      <header className="fixed top-0 w-full bg-white z-50 border-b border-black/5 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="bg-[#5A5A40] p-1.5 rounded-lg">
              <GraduationCap className="text-white w-6 h-6" />
            </div>
            <h1 className="text-xl font-bold tracking-tight">Trans-Learner</h1>
          </div>

          <div className="flex items-center gap-4">
            {user ? (
              <div className="flex items-center gap-3">
                <div className="hidden sm:block text-right">
                  <p className="text-sm font-medium">{user.displayName}</p>
                  <button 
                    onClick={logout}
                    className="text-xs text-red-600 hover:underline"
                  >
                    Logout
                  </button>
                </div>
                {user.photoURL ? (
                  <img src={user.photoURL} className="w-9 h-9 rounded-full ring-2 ring-[#5A5A40]" alt="Avatar" />
                ) : (
                  <div className="w-9 h-9 rounded-full bg-[#5A5A40] flex items-center justify-center">
                    <UserIcon className="text-white w-5 h-5" />
                  </div>
                )}
              </div>
            ) : (
              <button
                onClick={loginWithGoogle}
                className="flex items-center gap-2 bg-[#5A5A40] text-white px-4 py-2 rounded-full hover:bg-opacity-90 transition-all font-medium text-sm"
              >
                <LogIn className="w-4 h-4" />
                Student Login
              </button>
            )}
          </div>
        </div>
      </header>

      <main className="pt-24 pb-12 max-w-4xl mx-auto px-4">
        {user ? children : <WelcomeSection />}
      </main>
    </div>
  );
}

function WelcomeSection() {
  return (
    <div className="flex flex-col items-center justify-center text-center py-20 space-y-8">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="space-y-4"
      >
        <h2 className="text-5xl font-bold tracking-tight text-[#141414]">
          Break the <span className="text-[#5A5A40]">English Barrier.</span>
        </h2>
        <p className="text-lg text-gray-600 max-w-xl mx-auto">
          Academic text can be tough. We simplify it into Roman Urdu with analogies from Pakistani life—Cricket, Rickshaws, and more.
        </p>
      </motion.div>

      <motion.button
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={loginWithGoogle}
        className="bg-[#5A5A40] text-white px-8 py-4 rounded-full text-lg font-bold shadow-lg hover:shadow-xl transition-all flex items-center gap-3"
      >
        <LogIn className="w-5 h-5" />
        Get Started for Free
      </motion.button>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-8 w-full max-w-3xl mt-12">
        <FeatureCard 
          icon={<GraduationCap className="w-6 h-6" />}
          title="Level 1: Summaries"
          desc="1-sentence Roman Urdu hooks for quick grasp."
        />
        <FeatureCard 
          icon={<UserIcon className="w-6 h-6" />}
          title="Level 2: Analogies"
          desc="Concepts explained via Pakistani cultural touchstones."
        />
        <FeatureCard 
          icon={<GraduationCap className="w-6 h-6" />}
          title="Level 3: Audio"
          desc="Listen to explanations in a natural Hinglish mix."
        />
      </div>
    </div>
  );
}

function FeatureCard({ icon, title, desc }: { icon: React.ReactNode, title: string, desc: string }) {
  return (
    <div className="bg-white p-6 rounded-3xl shadow-sm border border-black/5 flex flex-col items-center text-center">
      <div className="bg-[#5A5A40]/10 p-3 rounded-2xl text-[#5A5A40] mb-4">
        {icon}
      </div>
      <h3 className="font-bold text-lg mb-2">{title}</h3>
      <p className="text-sm text-gray-500 line-clamp-2">{desc}</p>
    </div>
  );
}
