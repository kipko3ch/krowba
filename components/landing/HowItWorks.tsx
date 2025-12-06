import React, { useEffect, useRef } from 'react';
import { motion, useInView } from 'framer-motion';

const steps = [
  {
    num: "01",
    title: "Generate a Krowba Link",
    desc: "Create a secure payment link in seconds. Share it instead of a bank account. The buyer sees the item, cost, and delivery details clearly."
  },
  {
    num: "02",
    title: "Buyer Pays a Delivery Bond",
    desc: "The buyer pays a small delivery bond instead of full payment. Funds go into secure escrow — protected for both sides."
  },
  {
    num: "03",
    title: "Package Is Dispatched & Tracked",
    desc: "Once funds lock, the seller ships the item. Krowba syncs with supported couriers so both parties can follow delivery progress."
  },
  {
    num: "04",
    title: "Delivery Verified, Funds Released",
    desc: "Money moves to the seller only when the item is delivered and confirmed in good condition. If delivery fails or the item is returned, the buyer is refunded automatically."
  }
];

const StepItem: React.FC<{ step: typeof steps[0]; idx: number; isEven: boolean }> = ({ step, idx, isEven }) => {
  const ref = useRef(null);
  const isInView = useInView(ref, {
    margin: "-40% 0px -40% 0px",
    once: false
  });

  return (
    <motion.div
      ref={ref}
      className="step-item mb-24 last:mb-0"
      initial={{ opacity: 0.2, filter: "blur(4px)", y: 30 }}
      animate={{
        opacity: isInView ? 1 : 0.2,
        filter: isInView ? "blur(0px)" : "blur(4px)",
        y: isInView ? 0 : 30
      }}
      transition={{
        duration: 0.6,
        ease: [0.25, 0.4, 0.25, 1]
      }}
    >
      <div className={`flex flex-col ${isEven ? 'md:items-start md:text-left md:pr-[55%]' : 'md:items-end md:text-right md:pl-[55%]'}`}>
        {/* Step Badge - Simple text style, no borders or rounded corners */}
        <motion.div
          className="inline-flex items-center gap-2 text-xs md:text-sm font-semibold mb-4 text-primary"
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{
            opacity: isInView ? 1 : 0.3,
            scale: isInView ? 1 : 0.9
          }}
          transition={{ duration: 0.4, delay: 0.1 }}
        >
          <span>Step {step.num}</span>
        </motion.div>

        {/* Title - Better Font */}
        <motion.h3
          className="text-2xl md:text-3xl lg:text-4xl xl:text-5xl font-serif-display text-gray-900 mb-4 leading-tight tracking-tight"
          initial={{ opacity: 0 }}
          animate={{ opacity: isInView ? 1 : 0.3 }}
          transition={{ duration: 0.4, delay: 0.15 }}
        >
          {step.title}
        </motion.h3>

        {/* Description */}
        <motion.p
          className="text-sm md:text-base lg:text-lg text-gray-600 leading-relaxed max-w-md"
          initial={{ opacity: 0 }}
          animate={{ opacity: isInView ? 1 : 0.2 }}
          transition={{ duration: 0.4, delay: 0.2 }}
        >
          {step.desc}
        </motion.p>
      </div>
    </motion.div>
  );
};

const HowItWorks: React.FC = () => {
  const sectionRef = useRef<HTMLElement>(null);
  const headerRef = useRef(null);
  const headerInView = useInView(headerRef, { once: true, margin: "-100px" });

  useEffect(() => {
    const gsap = (window as any).gsap;
    const ScrollTrigger = (window as any).ScrollTrigger;
    if (!gsap || !ScrollTrigger) return;

    gsap.registerPlugin(ScrollTrigger);

    // Animate the timeline line
    gsap.fromTo(".timeline-line",
      { scaleY: 0 },
      {
        scaleY: 1,
        ease: "none",
        scrollTrigger: {
          trigger: sectionRef.current,
          start: "top 60%",
          end: "bottom 40%",
          scrub: 1
        }
      }
    );
  }, []);

  const headerVariants = {
    hidden: { opacity: 0, y: 40 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.8,
        ease: [0.25, 0.4, 0.25, 1],
        staggerChildren: 0.15
      }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20, filter: "blur(8px)" },
    visible: {
      opacity: 1,
      y: 0,
      filter: "blur(0px)",
      transition: { duration: 0.6 }
    }
  };

  return (
    <section ref={sectionRef} id="how-it-works" className="py-28 bg-[#f8faf9] relative overflow-hidden">
      <div className="max-w-7xl mx-auto px-6 md:px-12">
        {/* Header */}
        <motion.div
          ref={headerRef}
          className="text-center mb-20"
          variants={headerVariants}
          initial="hidden"
          animate={headerInView ? "visible" : "hidden"}
        >
          <motion.div
            className="inline-flex items-center gap-2 px-4 py-2 mb-6"
            variants={itemVariants}
          >
            <span className="w-2 h-2 rounded-full bg-primary"></span>
            <span className="text-sm font-medium text-primary">How it works</span>
          </motion.div>
          <motion.h2
            className="font-serif-display text-4xl md:text-5xl text-gray-900 leading-tight max-w-2xl mx-auto italic"
            variants={itemVariants}
          >
            A simple, safe process for every transaction
          </motion.h2>
        </motion.div>

        {/* Timeline Steps */}
        <div className="max-w-4xl mx-auto relative">
          {/* Vertical Timeline Line */}
          <div
            className="timeline-line absolute left-1/2 top-0 bottom-0 w-px bg-primary/30 hidden md:block origin-top"
            style={{ transform: 'translateX(-50%)' }}
          />

          {steps.map((step, idx) => (
            <StepItem
              key={idx}
              step={step}
              idx={idx}
              isEven={idx % 2 === 0}
            />
          ))}
        </div>
      </div>
    </section>
  );
};

export default HowItWorks;
