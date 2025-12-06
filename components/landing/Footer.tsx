import React, { useEffect, useRef, useState } from 'react';
import { motion, useInView, useScroll, useTransform } from 'framer-motion';

const Footer: React.FC = () => {
  const footerRef = useRef<HTMLElement>(null);
  const titleRef = useRef<HTMLHeadingElement>(null);
  const linksRef = useRef(null);
  const linksInView = useInView(linksRef, { once: true, margin: "-50px" });

  // Scroll-based animation for title
  const { scrollYProgress } = useScroll({
    target: footerRef,
    offset: ["start 0.8", "end 0.2"]
  });

  // Transform scroll progress to scale (zoom in when scrolling down, shrink when scrolling up)
  const scale = useTransform(scrollYProgress, [0, 0.3, 0.7, 1], [0.5, 0.8, 1, 1.1]);
  const opacity = useTransform(scrollYProgress, [0, 0.2, 0.6, 1], [0.15, 0.25, 0.35, 0.4]);
  const y = useTransform(scrollYProgress, [0, 1], [150, 0]);

  useEffect(() => {
    const gsap = (window as any).gsap;
    const ScrollTrigger = (window as any).ScrollTrigger;
    if (!gsap || !ScrollTrigger) return;

    gsap.registerPlugin(ScrollTrigger);
  }, []);

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
        delayChildren: 0.1
      }
    }
  };

  const columnVariants = {
    hidden: { opacity: 0, y: 30 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.6, ease: [0.25, 0.4, 0.25, 1] }
    }
  };

  const linkVariants = {
    hidden: { opacity: 0, x: -10 },
    visible: {
      opacity: 1,
      x: 0,
      transition: { duration: 0.4 }
    }
  };

  return (
    <footer ref={footerRef} className="relative pt-20 pb-0 border-t border-gray-200 bg-white overflow-hidden">
      <div className="max-w-7xl mx-auto px-6 md:px-12 relative z-10">
        <motion.div
          ref={linksRef}
          className="flex flex-col md:flex-row justify-between items-start gap-12 mb-24"
          variants={containerVariants}
          initial="hidden"
          animate={linksInView ? "visible" : "hidden"}
        >
          <motion.div variants={columnVariants}>
            <h3 className="text-sm font-semibold text-gray-900 uppercase tracking-wider mb-4">Navigation</h3>
            <motion.div
              className="flex flex-col space-y-3 text-gray-600"
              variants={containerVariants}
            >
              {['How it works', 'Pricing', 'FAQ'].map((link, idx) => (
                <motion.a
                  key={idx}
                  href={link === 'How it works' ? '#how-it-works' : link === 'Pricing' ? '#pricing' : `#${link.toLowerCase()}`}
                  className="hover:text-gray-900 transition-colors"
                  variants={linkVariants}
                  whileHover={{ x: 5, transition: { duration: 0.2 } }}
                >
                  {link}
                </motion.a>
              ))}
            </motion.div>
          </motion.div>

          <motion.div variants={columnVariants}>
            <h3 className="text-sm font-semibold text-gray-900 uppercase tracking-wider mb-4">Join</h3>
            <motion.div
              className="flex flex-col space-y-3 text-gray-600"
              variants={containerVariants}
            >
              <motion.a
                href="#founding-100"
                className="hover:text-gray-900 transition-colors"
                variants={linkVariants}
                whileHover={{ x: 5, transition: { duration: 0.2 } }}
              >
                Join Waitlist
              </motion.a>
            </motion.div>
          </motion.div>

          <motion.div className="md:text-right" variants={columnVariants}>
            <h3 className="text-sm font-semibold text-gray-900 uppercase tracking-wider mb-4">Contact</h3>
            <p className="text-gray-600">support@krowba.com</p>
            <p className="text-gray-600 mt-2">Nairobi, Kenya</p>
            <p className="text-xs text-gray-500 mt-8">© {new Date().getFullYear()} Krowba Inc. All rights reserved.</p>
          </motion.div>
        </motion.div>

        {/* Gigantic Text with Scroll-based Zoom Animation */}
        <div className="relative w-full overflow-hidden flex flex-col justify-center items-center">
          <motion.h1
            ref={titleRef}
            className="font-serif-display text-[20vw] leading-[0.75] text-gray-900 tracking-tighter select-none pointer-events-none relative z-10 pb-32 md:pb-10"
            style={{
              scale,
              opacity,
              y
            }}
          >
            krowba
          </motion.h1>

        </div>
      </div>
    </footer>
  );
};

export default Footer;
