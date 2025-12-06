import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Smartphone, Shirt, Sparkles, ChevronLeft, ChevronRight, MoreHorizontal } from 'lucide-react';

const categories = [
    { icon: <Smartphone className="w-12 h-12" />, label: 'Gadget Sellers' },
    { icon: <Shirt className="w-12 h-12" />, label: 'Fashion Vendors' },
    { icon: <Sparkles className="w-12 h-12" />, label: 'Hair & Beauty' },
    { icon: <MoreHorizontal className="w-12 h-12" />, label: 'and More' }
];

const UseCases: React.FC = () => {
    const [activeIndex, setActiveIndex] = useState(0);

    const nextCard = () => {
        setActiveIndex((prev) => (prev + 1) % categories.length);
    };

    const prevCard = () => {
        setActiveIndex((prev) => (prev - 1 + categories.length) % categories.length);
    };

    const getCardStyle = (index: number) => {
        const diff = (index - activeIndex + categories.length) % categories.length;

        if (diff === 0) {
            // Front card - fully visible and centered
            return {
                scale: 1,
                x: 0,
                y: 0,
                opacity: 1,
                filter: 'blur(0px)',
                zIndex: 3,
                rotateY: 0,
                rotateZ: 0
            };
        } else if (diff === 1) {
            // Right back card - tilted
            return {
                scale: 0.90,
                x: 75,
                y: 10,
                opacity: 0.65,
                filter: 'blur(1px)',
                zIndex: 2,
                rotateY: -3,
                rotateZ: -4
            };
        } else {
            // Left back card - tilted opposite direction
            return {
                scale: 0.90,
                x: -50,
                y: 10,
                opacity: 0.4,
                filter: 'blur(1.5px)',
                zIndex: 1,
                rotateY: 3,
                rotateZ: 4
            };
        }
    };

    return (
        <section className="py-20 bg-white border-t border-gray-100 overflow-hidden">
            <div className="max-w-5xl mx-auto px-6">
                {/* Title Section */}
                <div className="text-center mb-16">
                    <motion.div
                        className="inline-flex items-center gap-2 mb-4"
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.5 }}
                    >
                        <span className="w-2 h-2 rounded-full bg-primary"></span>
                        <span className="text-sm font-medium text-primary">Who We Help</span>
                    </motion.div>
                    <motion.h2
                        className="font-serif-display text-3xl md:text-4xl lg:text-5xl mb-4 text-gray-900 italic"
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.5, delay: 0.1 }}
                    >
                        Made for real social commerce sellers
                    </motion.h2>
                    <motion.p
                        className="text-gray-600 text-lg max-w-2xl mx-auto"
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.5, delay: 0.2 }}
                    >
                        Whether you sell fashion, gadgets, home goods, accessories, or beauty products — Krowba protects every transaction.
                    </motion.p>
                </div>

                <div className="relative h-[550px] flex items-center justify-center">
                    {/* Navigation Arrows - Immediately next to cards */}
                    <motion.button
                        onClick={prevCard}
                        className="w-11 h-11 bg-white/90 backdrop-blur-sm rounded-xl shadow-md border border-gray-200/70 flex items-center justify-center text-gray-600 hover:text-gray-900 hover:bg-white hover:border-gray-300 transition-all z-10 mr-3"
                        whileHover={{ scale: 1.08 }}
                        whileTap={{ scale: 0.96 }}
                    >
                        <ChevronLeft className="w-5 h-5" />
                    </motion.button>

                    {/* Cards Stack */}
                    <div className="relative w-[280px] sm:w-[340px] h-full flex items-center justify-center" style={{ perspective: '1400px' }}>
                        <AnimatePresence initial={false}>
                            {categories.map((cat, idx) => {
                                const style = getCardStyle(idx);
                                return (
                                    <motion.div
                                        key={idx}
                                        className="absolute w-[240px] sm:w-[280px] h-[320px] sm:h-[360px] rounded-3xl shadow-2xl flex flex-col items-center justify-center gap-6 cursor-pointer overflow-hidden"
                                        style={{
                                            background: idx === activeIndex
                                                ? 'linear-gradient(135deg, rgba(255, 255, 255, 1) 0%, rgba(248, 250, 249, 1) 100%)'
                                                : 'linear-gradient(135deg, rgba(255, 255, 255, 0.95) 0%, rgba(243, 244, 246, 0.95) 100%)',
                                            border: idx === activeIndex
                                                ? '1px solid rgba(68, 249, 31, 0.2)'
                                                : '1px solid rgba(229, 231, 235, 1)',
                                            boxShadow: idx === activeIndex
                                                ? '0 20px 60px rgba(68, 249, 31, 0.15), 0 0 0 1px rgba(68, 249, 31, 0.1)'
                                                : '0 10px 40px rgba(0, 0, 0, 0.08)',
                                            transformStyle: 'preserve-3d'
                                        }}
                                        initial={false}
                                        animate={{
                                            scale: style.scale,
                                            x: style.x,
                                            y: style.y,
                                            opacity: style.opacity,
                                            filter: style.filter,
                                            zIndex: style.zIndex,
                                            rotateY: style.rotateY,
                                            rotateZ: style.rotateZ
                                        }}
                                        transition={{
                                            duration: 0.5,
                                            ease: [0.25, 0.46, 0.45, 0.94]
                                        }}
                                        onClick={() => {
                                            if (idx !== activeIndex) {
                                                setActiveIndex(idx);
                                            }
                                        }}
                                        whileHover={idx === activeIndex ? { scale: style.scale * 1.02 } : {}}
                                    >
                                        {/* Subtle gradient overlay for active card */}
                                        {idx === activeIndex && (
                                            <div
                                                className="absolute inset-0 opacity-20 pointer-events-none"
                                                style={{
                                                    background: 'radial-gradient(circle at 50% 0%, rgba(68, 249, 31, 0.12) 0%, transparent 70%)'
                                                }}
                                            />
                                        )}

                                        <motion.div
                                            className="p-4 relative z-10"
                                            animate={{
                                                scale: idx === activeIndex ? 1 : 0.92
                                            }}
                                            transition={{ duration: 0.3 }}
                                        >
                                            {cat.icon}
                                        </motion.div>
                                        <h3 className="font-semibold text-lg sm:text-xl text-gray-900 px-6 text-center relative z-10">
                                            {cat.label}
                                        </h3>
                                    </motion.div>
                                );
                            })}
                        </AnimatePresence>

                        {/* Dots Indicator */}
                        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex gap-2 z-10">
                            {categories.map((_, idx) => (
                                <motion.button
                                    key={idx}
                                    onClick={() => setActiveIndex(idx)}
                                    className="w-2 h-2 rounded-full transition-all"
                                    animate={{
                                        backgroundColor: idx === activeIndex ? '#44F91F' : '#D1D5DB',
                                        scale: idx === activeIndex ? 1.15 : 1
                                    }}
                                    whileHover={{ scale: 1.25 }}
                                />
                            ))}
                        </div>
                    </div>

                    <motion.button
                        onClick={nextCard}
                        className="w-11 h-11 bg-white/90 backdrop-blur-sm rounded-xl shadow-md border border-gray-200/70 flex items-center justify-center text-gray-600 hover:text-gray-900 hover:bg-white hover:border-gray-300 transition-all z-10 ml-3"
                        whileHover={{ scale: 1.08 }}
                        whileTap={{ scale: 0.96 }}
                    >
                        <ChevronRight className="w-5 h-5" />
                    </motion.button>
                </div>
            </div>
        </section>
    );
};

export default UseCases;
