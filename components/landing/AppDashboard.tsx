import React, { useState } from 'react';
import { analyzeTransaction } from '../services/gemini';
import { Transaction, TransactionStatus } from '../types';
import { Loader2, ShieldAlert, FileCheck, DollarSign, X } from 'lucide-react';

interface AppDashboardProps {
  onBack: () => void;
}

const AppDashboard: React.FC<AppDashboardProps> = ({ onBack }) => {
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [loading, setLoading] = useState(false);
  const [role, setRole] = useState<'buyer' | 'seller'>('buyer');
  const [amount, setAmount] = useState<string>('');
  const [description, setDescription] = useState('');
  const [result, setResult] = useState<{terms: string[], riskScore: number, analysis: string} | null>(null);

  const handleAnalyze = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const data = await analyzeTransaction(description, parseFloat(amount), role);
    setResult(data);
    setStep(2);
    setLoading(false);
  };

  const reset = () => {
    setStep(1);
    setResult(null);
    setAmount('');
    setDescription('');
  };

  return (
    <div className="min-h-screen pt-28 pb-12 px-4 sm:px-6">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center justify-between mb-8 animate-in fade-in slide-in-from-top-4 duration-500">
            <h2 className="font-serif-display text-4xl text-gray-900 dark:text-white">New Transaction</h2>
            <button onClick={onBack} className="text-gray-500 dark:text-gray-300 hover:text-black dark:hover:text-white transition-colors p-2 hover:bg-black/5 dark:hover:bg-white/10 rounded-full">
                <X className="w-6 h-6" />
            </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Main Form/Result Area */}
            <div className="lg:col-span-2 space-y-6">
                {step === 1 && (
                    <form onSubmit={handleAnalyze} className="glass-card p-8 rounded-3xl space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500 shadow-xl dark:shadow-2xl">
                        <div className="space-y-4">
                            <label className="block text-sm font-semibold text-gray-600 dark:text-gray-300 uppercase tracking-wider">I am the...</label>
                            <div className="grid grid-cols-2 gap-4">
                                <button 
                                    type="button"
                                    onClick={() => setRole('buyer')}
                                    className={`p-5 rounded-2xl border-2 transition-all font-bold ${role === 'buyer' ? 'border-primary bg-primary/10 text-gray-900 dark:text-white' : 'border-gray-200 dark:border-white/10 text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-white/5 hover:text-gray-900 dark:hover:text-white'}`}
                                >
                                    Buyer
                                </button>
                                <button 
                                    type="button"
                                    onClick={() => setRole('seller')}
                                    className={`p-5 rounded-2xl border-2 transition-all font-bold ${role === 'seller' ? 'border-primary bg-primary/10 text-gray-900 dark:text-white' : 'border-gray-200 dark:border-white/10 text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-white/5 hover:text-gray-900 dark:hover:text-white'}`}
                                >
                                    Seller
                                </button>
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-semibold text-gray-600 dark:text-gray-300 mb-3 uppercase tracking-wider">Transaction Amount (USD)</label>
                            <div className="relative">
                                <DollarSign className="absolute left-4 top-1/2 -translate-y-1/2 w-6 h-6 text-gray-400" />
                                <input 
                                    type="number" 
                                    value={amount}
                                    onChange={(e) => setAmount(e.target.value)}
                                    className="w-full bg-gray-50 dark:bg-black/40 border border-gray-200 dark:border-white/20 rounded-2xl py-4 pl-12 pr-4 text-gray-900 dark:text-white text-lg focus:ring-2 focus:ring-primary/50 focus:border-primary outline-none transition-all placeholder:text-gray-400 dark:placeholder:text-gray-600"
                                    placeholder="0.00"
                                    required
                                />
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-semibold text-gray-600 dark:text-gray-300 mb-3 uppercase tracking-wider">Description of Deal</label>
                            <textarea 
                                value={description}
                                onChange={(e) => setDescription(e.target.value)}
                                className="w-full h-32 bg-gray-50 dark:bg-black/40 border border-gray-200 dark:border-white/20 rounded-2xl p-5 text-gray-900 dark:text-white text-lg focus:ring-2 focus:ring-primary/50 focus:border-primary outline-none transition-all resize-none placeholder:text-gray-400 dark:placeholder:text-gray-600"
                                placeholder="e.g. Buying a Macbook Pro 2021 M1..."
                                required
                            />
                        </div>

                        <button 
                            type="submit" 
                            disabled={loading}
                            className="w-full py-5 bg-primary text-black font-bold text-lg rounded-2xl hover:bg-primary-dim transition-all flex items-center justify-center gap-3 hover:scale-[1.02] active:scale-[0.98] shadow-lg shadow-primary/20"
                        >
                            {loading ? <Loader2 className="w-6 h-6 animate-spin" /> : <><FileCheck className="w-6 h-6" /> Analyze & Draft Contract</>}
                        </button>
                    </form>
                )}

                {step === 2 && result && (
                    <div className="space-y-6 animate-in fade-in zoom-in-95 duration-500">
                        {/* AI Analysis Card */}
                        <div className="glass-card p-8 rounded-3xl border-l-4 border-l-primary shadow-xl">
                            <div className="flex items-start justify-between mb-4">
                                <div>
                                    <h3 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                                        <BotIcon className="w-6 h-6 text-primary" /> 
                                        Krowba Analysis
                                    </h3>
                                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 uppercase tracking-wide">Powered by Gemini 2.5 Flash</p>
                                </div>
                                <div className={`px-4 py-2 rounded-full text-sm font-bold ${result.riskScore > 50 ? 'bg-red-500/20 text-red-600 dark:text-red-300 border border-red-500/30' : 'bg-primary/20 text-green-800 dark:text-primary border border-primary/30'}`}>
                                    Risk Score: {result.riskScore}/100
                                </div>
                            </div>
                            <p className="text-gray-700 dark:text-gray-200 text-base leading-relaxed mb-4">
                                {result.analysis}
                            </p>
                        </div>

                        {/* Contract Terms */}
                        <div className="glass-card p-8 rounded-3xl shadow-xl">
                            <h3 className="font-serif-display text-3xl text-gray-900 dark:text-white mb-6">Generated Terms</h3>
                            <ul className="space-y-5 mb-8">
                                {result.terms.map((term, i) => (
                                    <li key={i} className="flex items-start gap-4 text-gray-700 dark:text-gray-200">
                                        <div className="mt-1 w-6 h-6 rounded-full bg-primary/20 flex items-center justify-center shrink-0 border border-primary/30">
                                            <span className="text-xs font-bold text-green-800 dark:text-primary">{i + 1}</span>
                                        </div>
                                        <span className="text-lg leading-snug">{term}</span>
                                    </li>
                                ))}
                            </ul>

                            <div className="flex gap-4 flex-col sm:flex-row">
                                <button onClick={() => setStep(3)} className="flex-1 py-4 bg-gray-900 dark:bg-white text-white dark:text-black font-bold text-lg rounded-2xl hover:bg-gray-800 dark:hover:bg-gray-200 transition-colors shadow-lg">
                                    Accept & Create Link
                                </button>
                                <button onClick={reset} className="px-8 py-4 border border-gray-300 dark:border-white/20 rounded-2xl text-gray-700 dark:text-white font-medium hover:bg-gray-100 dark:hover:bg-white/10 transition-colors">
                                    Edit
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                {step === 3 && (
                    <div className="glass-card p-12 rounded-3xl text-center animate-in zoom-in-95 duration-500 flex flex-col items-center justify-center min-h-[500px] shadow-2xl">
                        <div className="w-24 h-24 bg-primary/20 rounded-full flex items-center justify-center text-primary mb-8 shadow-[0_0_40px_rgba(68,249,31,0.2)]">
                            <CheckCircleIcon className="w-12 h-12" />
                        </div>
                        <h3 className="font-serif-display text-4xl text-gray-900 dark:text-white mb-4">Escrow Link Created</h3>
                        <p className="text-gray-600 dark:text-gray-300 mb-10 max-w-md text-lg">Share this link with the {role === 'buyer' ? 'seller' : 'buyer'}. Once they join, funds can be deposited.</p>
                        
                        <div className="flex items-center gap-3 bg-gray-100 dark:bg-black/40 p-3 rounded-xl border border-gray-200 dark:border-white/20 w-full max-w-lg mb-10">
                            <span className="text-gray-600 dark:text-gray-300 text-lg px-3 truncate flex-1 text-left font-mono">krowba.com/e/tr_982374...</span>
                            <button className="px-6 py-3 bg-gray-200 dark:bg-white/10 hover:bg-gray-300 dark:hover:bg-white/20 text-gray-900 dark:text-white font-medium rounded-lg transition-colors">
                                Copy
                            </button>
                        </div>

                        <button onClick={reset} className="text-primary hover:text-green-600 dark:hover:text-white transition-colors font-medium border-b border-primary hover:border-green-600 dark:hover:border-white pb-1">
                            Start Another Transaction
                        </button>
                    </div>
                )}
            </div>

            {/* Sidebar Info */}
            <div className="space-y-6">
                 <div className="glass-card p-8 rounded-3xl animate-in fade-in slide-in-from-right duration-700 delay-100">
                    <h4 className="text-gray-900 dark:text-white font-bold text-lg mb-6 flex items-center gap-2">
                        <ShieldAlert className="w-5 h-5 text-primary" /> Safety Tips
                    </h4>
                    <ul className="text-gray-600 dark:text-gray-300 space-y-4">
                        <li className="flex gap-2">
                            <span className="text-primary">•</span> Never communicate outside the platform.
                        </li>
                        <li className="flex gap-2">
                            <span className="text-primary">•</span> Video record the unboxing process.
                        </li>
                        <li className="flex gap-2">
                            <span className="text-primary">•</span> Check serial numbers immediately.
                        </li>
                    </ul>
                 </div>

                 <div className="p-8 rounded-3xl border border-gray-200 dark:border-white/10 bg-white dark:bg-gradient-to-b dark:from-white/10 dark:to-transparent animate-in fade-in slide-in-from-right duration-700 delay-200 shadow-lg dark:shadow-none">
                    <h4 className="text-gray-900 dark:text-white font-bold text-lg mb-4">Fee Estimation</h4>
                    <div className="flex justify-between text-base mb-2">
                        <span className="text-gray-500 dark:text-gray-400">Escrow Fee (1.5%)</span>
                        <span className="text-gray-900 dark:text-white font-mono">${amount ? (parseFloat(amount) * 0.015).toFixed(2) : '0.00'}</span>
                    </div>
                    <div className="flex justify-between text-base">
                        <span className="text-gray-500 dark:text-gray-400">AI Analysis</span>
                        <span className="text-primary font-bold">Free</span>
                    </div>
                 </div>
            </div>
        </div>
      </div>
    </div>
  );
};

// Helper Icons
const BotIcon = (props: any) => (
    <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 8V4H8"/><rect width="16" height="12" x="4" y="8" rx="2"/><path d="M2 14h2"/><path d="M20 14h2"/><path d="M15 13v2"/><path d="M9 13v2"/></svg>
);
const CheckCircleIcon = (props: any) => (
    <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><path d="m9 11 3 3L22 4"/></svg>
);

export default AppDashboard;