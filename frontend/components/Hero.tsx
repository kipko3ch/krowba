import React, { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowRight } from 'lucide-react';

const rotatingWords = [
  "No more risky pre-payments.",
  "No more ghost buyers.",
  "No more delivery losses."
];

const Hero: React.FC = () => {
  const heroRef = useRef<HTMLElement>(null);
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % rotatingWords.length);
    }, 3000); // Change word every 3 seconds

    return () => clearInterval(interval);
  }, []);

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.12,
        delayChildren: 0.2
      }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 25 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.6,
        ease: [0.25, 0.4, 0.25, 1]
      }
    }
  };

  return (
    <section
      ref={heroRef}
      className="relative min-h-screen flex items-center justify-center pt-24 pb-12 overflow-hidden"
      style={{
        background: 'linear-gradient(135deg, rgba(139, 92, 246, 0.08) 0%, rgba(68, 249, 31, 0.12) 100%)'
      }}
    >
      {/* Aurora & Grid Background */}
      {/* Simple Static Background */}
      {/* Premium Static Background */}
      <div
        className="absolute inset-0 pointer-events-none overflow-hidden"
        style={{
          background: 'linear-gradient(135deg, #f9fafb 0%, #f3f4f6 40%, #f5f3ff 80%, #f0fdf4 100%)'
        }}
      >
        {/* Subtle Grid */}
        <div
          className="absolute inset-0 opacity-[0.03]"
          style={{
            backgroundImage: `linear-gradient(#000 1px, transparent 1px), linear-gradient(90deg, #000 1px, transparent 1px)`,
            backgroundSize: '40px 40px'
          }}
        />

        {/* Soft Gradient Orbs (Static) */}
        <div
          className="absolute top-0 left-0 w-[800px] h-[800px] rounded-full opacity-40 blur-[100px]"
          style={{
            background: 'radial-gradient(circle, rgba(68, 249, 31, 0.08) 0%, transparent 70%)',
            transform: 'translate(-20%, -20%)'
          }}
        />
        <div
          className="absolute bottom-0 right-0 w-[800px] h-[800px] rounded-full opacity-40 blur-[100px]"
          style={{
            background: 'radial-gradient(circle, rgba(139, 92, 246, 0.1) 0%, transparent 70%)',
            transform: 'translate(20%, 20%)'
          }}
        />
        <div
          className="absolute top-1/2 left-1/2 w-[600px] h-[600px] rounded-full opacity-30 blur-[120px]"
          style={{
            background: 'radial-gradient(circle, rgba(139, 92, 246, 0.05) 0%, transparent 70%)',
            transform: 'translate(-50%, -50%)'
          }}
        />
      </div>

      <motion.div
        className="max-w-7xl mx-auto px-6 md:px-12 relative z-10 text-center"
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
        {/* Badge with Liquid Glassy Style */}
        <motion.div
          className="inline-flex items-center gap-2 px-5 py-2.5 mb-10 rounded-full backdrop-blur-xl bg-white/60 border border-white/50 shadow-lg"
          style={{
            background: 'linear-gradient(135deg, rgba(255,255,255,0.6) 0%, rgba(255,255,255,0.4) 100%)',
            boxShadow: '0 8px 32px 0 rgba(0, 0, 0, 0.08), inset 0 1px 0 0 rgba(255, 255, 255, 0.6)'
          }}
          variants={itemVariants}
        >
          <span className="w-1.5 h-1.5 rounded-full bg-primary"></span>
          <span className="text-sm font-medium text-gray-700 tracking-wide">Secure Social Commerce</span>
        </motion.div>

        {/* Main Headline */}
        <motion.h1
          className="font-serif-display text-4xl md:text-5xl lg:text-6xl leading-tight mb-12 text-gray-900 tracking-tight max-w-4xl mx-auto italic"
          variants={itemVariants}
        >
          A Safer Way to Buy and Sell From Anyone, Anywhere
        </motion.h1>

        {/* Animated Statement - Slide Effect */}
        <div className="mb-8 h-12 md:h-16 relative flex justify-center items-center">
          <AnimatePresence mode="wait">
            <motion.div
              key={currentIndex}
              initial={{ opacity: 0, y: 20, filter: 'blur(10px)', scale: 0.9 }}
              animate={{ opacity: 1, y: 0, filter: 'blur(0px)', scale: 1 }}
              exit={{ opacity: 0, y: -20, filter: 'blur(10px)', scale: 1.1 }}
              transition={{ duration: 0.5, ease: "easeOut" }}
              className="absolute w-full text-2xl md:text-3xl lg:text-4xl font-serif-display max-w-3xl leading-snug text-center bg-clip-text text-transparent bg-gradient-to-r from-primary via-green-600 to-emerald-600 drop-shadow-sm"
            >
              {rotatingWords[currentIndex]}
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Secondary Description - Smaller */}
        <motion.p
          className="text-sm md:text-base text-gray-600 max-w-2xl mx-auto mb-4 leading-relaxed"
          variants={itemVariants}
        >
          Krowba protects both sides by holding funds safely until delivery is confirmed in good condition.
        </motion.p>

        {/* Tertiary - Target Audience - Smaller */}
        <motion.p
          className="text-xs md:text-sm text-gray-500 max-w-xl mx-auto mb-12"
          variants={itemVariants}
        >
          Built for sellers and buyers who want simple, trustworthy transactions — anywhere.
        </motion.p>

        {/* CTA Button with Flow Animation */}
        <motion.div
          className="flex flex-col sm:flex-row items-center justify-center gap-4"
          variants={itemVariants}
        >
          <motion.a
            href="#founding-100"
            className="relative px-6 py-3 bg-primary text-gray-900 font-semibold rounded-full overflow-hidden group"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.98 }}
            style={{
              boxShadow: '0 0 20px rgba(68, 249, 31, 0.4), 0 0 40px rgba(68, 249, 31, 0.2)'
            }}
          >
            {/* Flow Animation Background */}
            <motion.div
              className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent"
              animate={{
                x: ['-100%', '200%'],
              }}
              transition={{
                duration: 2,
                repeat: Infinity,
                ease: "linear"
              }}
            />
            <span className="relative flex items-center gap-2 text-sm">
              Join the Waitlist <ArrowRight className="w-4 h-4" />
            </span>
          </motion.a>
        </motion.div>
      </motion.div>
    </section>
  );
};

export default Hero;
