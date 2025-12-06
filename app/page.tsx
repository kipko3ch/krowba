"use client"

import React, { useState, useEffect, useRef } from 'react';
import { motion, useInView, AnimatePresence } from 'framer-motion';
import Hero from '@/components/landing/Hero';
import HowItWorks from '@/components/landing/HowItWorks';
import ComparisonSection from '@/components/landing/ComparisonSection';
import TrustRadar from '@/components/landing/TrustRadar';
import UseCases from '@/components/landing/UseCases';
import Pricing from '@/components/landing/Pricing';
import FAQ from '@/components/landing/FAQ';
import Footer from '@/components/landing/Footer';
import { Menu, X } from 'lucide-react';

export default function HomePage() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);

  // Refs for sections
  const foundingRef = useRef<HTMLElement>(null);
  const formRef = useRef<HTMLFormElement>(null);
  const ctaRef = useRef(null);
  const ctaInView = useInView(ctaRef, { once: true, margin: "-100px" });
  const pilotRef = useRef(null);
  const pilotInView = useInView(pilotRef, { once: true, margin: "-100px" });

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll);

    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const navVariants = {
    hidden: { y: -100, opacity: 0 },
    visible: {
      y: 0,
      opacity: 1,
      transition: { duration: 0.6, ease: [0.25, 0.4, 0.25, 1] }
    }
  };

  const mobileMenuVariants = {
    hidden: { opacity: 0, scale: 0.95 },
    visible: {
      opacity: 1,
      scale: 1,
      transition: {
        duration: 0.3,
        staggerChildren: 0.1,
        delayChildren: 0.1
      }
    },
    exit: {
      opacity: 0,
      scale: 0.95,
      transition: { duration: 0.2 }
    }
  };

  const mobileItemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0 }
  };

  const sectionVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.15 }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 30, filter: "blur(8px)" },
    visible: {
      opacity: 1,
      y: 0,
      filter: "blur(0px)",
      transition: { duration: 0.6, ease: [0.25, 0.4, 0.25, 1] }
    }
  };

  const buttonVariants = {
    hover: { scale: 1.05, transition: { duration: 0.2 } },
    tap: { scale: 0.98 }
  };

  return (
    <div className="min-h-screen bg-white text-gray-900 selection:bg-primary selection:text-black font-display overflow-x-hidden">

      {/* Navigation */}
      <motion.nav
        className={`fixed top-0 left-0 w-full z-50 transition-all duration-300 ${scrolled ? 'bg-white/90 backdrop-blur-md border-b border-gray-200 py-4 shadow-sm' : 'bg-transparent py-6'}`}
        variants={navVariants}
        initial="hidden"
        animate="visible"
      >
        <div className="max-w-7xl mx-auto px-6 md:px-12 flex items-center justify-between">
          <motion.div
            className="cursor-pointer font-serif-display text-3xl tracking-wide text-gray-900 hover:text-primary transition-colors duration-300"
            whileHover={{ scale: 1.02 }}
          >
            krowba
          </motion.div>

          <div className="hidden md:flex items-center space-x-8">
            {['How it works', 'Pricing', 'FAQ'].map((item, idx) => (
              <motion.a
                key={idx}
                href={item === 'How it works' ? '#how-it-works' : `#${item.toLowerCase()}`}
                className="text-sm font-medium text-gray-600 hover:text-black transition-colors"
                whileHover={{ y: -2 }}
                transition={{ duration: 0.2 }}
              >
                {item}
              </motion.a>
            ))}
            <motion.a
              href="/dashboard"
              className="px-5 py-2.5 bg-gray-900 text-white text-sm font-medium rounded-full hover:bg-gray-800 transition-colors"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              Login
            </motion.a>
          </div>

          {/* Mobile Menu Toggle */}
          <div className="flex items-center gap-4 md:hidden">
            <motion.button
              className="text-gray-900 hover:text-primary transition-colors"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              whileTap={{ scale: 0.9 }}
            >
              {mobileMenuOpen ? <X /> : <Menu />}
            </motion.button>
          </div>
        </div>
      </motion.nav>

      {/* Mobile Menu Overlay */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <motion.div
            className="fixed inset-0 z-40 bg-white flex flex-col items-center justify-center space-y-8 md:hidden"
            variants={mobileMenuVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
          >
            {[
              { label: 'How It Works', href: '#how-it-works' },
              { label: 'Pricing', href: '#pricing' },
              { label: 'Join Waitlist', href: '#founding-100' },
              { label: 'Login', href: '/login' }
            ].map((item, idx) => (
              <motion.a
                key={idx}
                onClick={() => setMobileMenuOpen(false)}
                href={item.href}
                className={`font-serif-display text-gray-900 ${item.label === 'Login' ? 'w-full max-w-[200px] bg-black text-white py-3 rounded-full text-xl font-bold mt-4 flex items-center justify-center' : 'text-3xl'}`}
                variants={mobileItemVariants}
                whileHover={{ scale: 1.05, color: "#44F91F" }}
              >
                {item.label}
              </motion.a>
            ))}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main Content */}
      <main>
        <Hero />
        <HowItWorks />
        <TrustRadar />
        <ComparisonSection />
        <Pricing />
        <UseCases />
        <FAQ />

        {/* Pilot Launch Section */}
        <section id="founding-100" ref={foundingRef} className="py-28 relative overflow-hidden bg-white">
          <motion.div
            ref={pilotRef}
            className="max-w-7xl mx-auto px-6 md:px-12 relative z-10 text-center"
            variants={sectionVariants}
            initial="hidden"
            animate={pilotInView ? "visible" : "hidden"}
          >
            {/* Header */}
            <motion.div
              className="inline-flex items-center gap-2 px-4 py-2 mb-6"
              variants={itemVariants}
            >
              <motion.span
                className="w-2 h-2 rounded-full bg-primary"
                animate={{ scale: [1, 1.2, 1] }}
                transition={{ duration: 2, repeat: Infinity }}
              />
              <span className="text-sm font-medium text-primary">Pilot Launch</span>
            </motion.div>
            <motion.h2
              className="font-serif-display text-4xl md:text-5xl mb-6 text-gray-900 italic"
              variants={itemVariants}
            >
              Join our Alpha program
            </motion.h2>
            <motion.p
              className="text-gray-600 text-lg mb-4 max-w-2xl mx-auto leading-relaxed"
              variants={itemVariants}
            >
              We’re onboarding our first 100 vendors in Lagos and Nairobi.
            </motion.p>
            <motion.p
              className="text-gray-600 mb-12 max-w-lg mx-auto"
              variants={itemVariants}
            >
              Get early access, priority support, and exclusive rewards.
            </motion.p>

            {/* Success Message */}
            <AnimatePresence>
              {showSuccess && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="max-w-md mx-auto mb-4 px-6 py-4 bg-primary/10 border border-primary/30 rounded-2xl"
                >
                  <p className="text-gray-900 text-center font-medium">
                    Successfully joined the waitlist. We'll be in touch soon.
                  </p>
                </motion.div>
              )}
            </AnimatePresence>

            <motion.form
              ref={formRef}
              className="max-w-md mx-auto space-y-4"
              onSubmit={async (e) => {
                e.preventDefault();
                setIsSubmitting(true);

                const formData = new FormData(e.currentTarget);
                const data = {
                  name: formData.get('name'),
                  whatsapp: formData.get('whatsapp'),
                  instagram: formData.get('instagram') || ''
                };

                try {
                  // Capture form for reset
                  const form = e.currentTarget;

                  // Send request in background (fire and forget)
                  // Wrap in setTimeout to ensure it doesn't block UI thread at all
                  setTimeout(() => {
                    fetch('https://script.google.com/macros/s/AKfycbwor5JJ8sEOQUdZ7uk9KXp06F_O8XbEUiYmu1SLncTvuv38nMfUUmoUTYuvUGFomsSc/exec', {
                      method: 'POST',
                      mode: 'no-cors',
                      headers: {
                        'Content-Type': 'application/json',
                      },
                      body: JSON.stringify(data)
                    }).catch(err => console.error('Background fetch error:', err));
                  }, 0);

                  // Show success IMMEDIATELY
                  setShowSuccess(true);
                  form.reset();
                  setIsSubmitting(false);

                  // Hide success message after 5 seconds
                  setTimeout(() => setShowSuccess(false), 5000);
                } catch (error) {
                  console.error('Error:', error);
                  setIsSubmitting(false);
                }
              }}
              variants={itemVariants}
            >
              <motion.input
                name="name"
                type="text"
                placeholder="Name"
                required
                disabled={isSubmitting}
                className="w-full bg-gray-50 border border-gray-200 rounded-full px-6 py-4 text-gray-900 placeholder:text-gray-500 focus:outline-none focus:border-primary focus:bg-white transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                whileFocus={{ scale: 1.02, borderColor: "#44F91F" }}
              />
              <motion.input
                name="whatsapp"
                type="tel"
                placeholder="WhatsApp Number"
                required
                disabled={isSubmitting}
                className="w-full bg-gray-50 border border-gray-200 rounded-full px-6 py-4 text-gray-900 placeholder:text-gray-500 focus:outline-none focus:border-primary focus:bg-white transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                whileFocus={{ scale: 1.02, borderColor: "#44F91F" }}
              />
              <motion.input
                name="instagram"
                type="text"
                placeholder="Instagram Handle (optional)"
                disabled={isSubmitting}
                className="w-full bg-gray-50 border border-gray-200 rounded-full px-6 py-4 text-gray-900 placeholder:text-gray-500 focus:outline-none focus:border-primary focus:bg-white transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                whileFocus={{ scale: 1.02, borderColor: "#44F91F" }}
              />
              <motion.button
                type="submit"
                disabled={isSubmitting}
                className="w-full px-8 py-4 bg-gray-900 text-white font-semibold rounded-full disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                variants={buttonVariants}
                whileHover={isSubmitting ? {} : "hover"}
                whileTap={isSubmitting ? {} : "tap"}
              >
                {isSubmitting ? (
                  <>
                    <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                    Submitting...
                  </>
                ) : (
                  'Join the Waitlist'
                )}
              </motion.button>
            </motion.form>
          </motion.div>

          {/* Decorative BG */}
          <motion.div
            className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[400px] bg-primary/5 rounded-full blur-[120px] pointer-events-none"
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 1.5 }}
          />
        </section>

        {/* Final CTA Section */}
        <section className="py-28 relative overflow-hidden bg-[#f8faf9]">
          <motion.div
            ref={ctaRef}
            className="max-w-7xl mx-auto px-6 md:px-12 relative z-10 text-center"
            variants={sectionVariants}
            initial="hidden"
            animate={ctaInView ? "visible" : "hidden"}
          >
            <motion.h2
              className="font-serif-display text-4xl md:text-5xl mb-8 text-gray-900 leading-tight italic"
              variants={itemVariants}
            >
              Trust shouldn't be optional - it should be built-in.
            </motion.h2>
            <motion.p
              className="text-gray-600 text-lg mb-12 max-w-2xl mx-auto"
              variants={itemVariants}
            >
              Be one of the first to use Africa's new operating system for social commerce.
            </motion.p>

            <motion.div
              className="flex flex-col sm:flex-row items-center justify-center gap-4"
              variants={itemVariants}
            >
              <motion.a
                href="#founding-100"
                className="px-8 py-4 bg-gray-900 text-white font-semibold rounded-full"
                variants={buttonVariants}
                whileHover="hover"
                whileTap="tap"
              >
                Join the Waitlist
              </motion.a>
              <motion.a
                href="#founding-100"
                className="px-8 py-4 bg-white text-gray-900 font-semibold rounded-full border border-gray-200"
                variants={buttonVariants}
                whileHover="hover"
                whileTap="tap"
              >
                Become a Pilot Vendor
              </motion.a>
            </motion.div>
          </motion.div>

          {/* Decorative BG */}
          <motion.div
            className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[400px] bg-primary/5 rounded-full blur-[120px] pointer-events-none"
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 1 }}
          />
        </section>
      </main>

      <Footer />
    </div>
  );
};
