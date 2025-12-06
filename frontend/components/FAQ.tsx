import React, { useRef, useState } from 'react';
import { motion, useInView, AnimatePresence } from 'framer-motion';
import { ChevronDown } from 'lucide-react';

const faqData = [
  {
    question: "How does Krowba protect my money?",
    answer: "Krowba holds payments securely until delivery is confirmed."
  },
  {
    question: "What happens if my order doesn't arrive?",
    answer: "Your money is refunded automatically."
  },
  {
    question: "What if the item arrives damaged?",
    answer: "If the item arrives damaged, our AI-assisted damage check validates the issue and you get a refund."
  },
  {
    question: "How do I get paid as a seller?",
    answer: "Funds are released to your bank or mobile money account after successful delivery."
  },
  {
    question: "Does Krowba work with all delivery services?",
    answer: "We integrate with selected partners and support manual verification."
  },
  {
    question: "What platforms does Krowba support?",
    answer: "WhatsApp, Instagram, TikTok, and any social-commerce channel."
  },
  {
    question: "Is there a fee to use Krowba?",
    answer: "We take a small transaction fee. No monthly subscription during Alpha."
  },
  {
    question: "How do I join the pilot program?",
    answer: "Sign up with your phone number or Instagram handle."
  },
  {
    question: "Can buyers use Krowba without the seller?",
    answer: "No. The seller must generate the link."
  }
];

const FAQItem: React.FC<{ item: typeof faqData[0]; idx: number }> = ({ item, idx }) => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <motion.div
      className="border-b border-gray-200 last:border-b-0"
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-50px" }}
      transition={{ duration: 0.5, delay: idx * 0.1 }}
    >
      <button
        className="w-full py-6 flex items-center justify-between text-left group"
        onClick={() => setIsOpen(!isOpen)}
      >
        <h3 className="text-lg md:text-xl font-semibold text-gray-900 pr-8 group-hover:text-primary transition-colors">
          {item.question}
        </h3>
        <motion.div
          animate={{ rotate: isOpen ? 180 : 0 }}
          transition={{ duration: 0.3 }}
          className="flex-shrink-0"
        >
          <ChevronDown className="w-5 h-5 text-gray-400 group-hover:text-primary transition-colors" />
        </motion.div>
      </button>
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3, ease: [0.4, 0, 0.2, 1] }}
            className="overflow-hidden"
          >
            <p className="pb-6 text-gray-600 leading-relaxed">
              {item.answer}
            </p>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

const FAQ: React.FC = () => {
  const headerRef = useRef(null);
  const headerInView = useInView(headerRef, { once: true, margin: "-100px" });

  const headerVariants = {
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

  return (
    <section id="faq" className="py-28 bg-white">
      <div className="max-w-4xl mx-auto px-6 md:px-12">
        {/* Section Header */}
        <motion.div
          ref={headerRef}
          className="text-center mb-16"
          variants={headerVariants}
          initial="hidden"
          animate={headerInView ? "visible" : "hidden"}
        >
          <motion.div
            className="inline-flex items-center gap-2 px-4 py-2 mb-6"
            variants={itemVariants}
          >
            <span className="w-2 h-2 rounded-full bg-primary"></span>
            <span className="text-sm font-medium text-primary">Frequently Asked Questions</span>
          </motion.div>
          <motion.h2
            className="font-serif-display text-4xl md:text-5xl text-gray-900 leading-tight max-w-3xl mx-auto italic"
            variants={itemVariants}
          >
            Everything you need to know
          </motion.h2>
        </motion.div>

        {/* FAQ Items */}
        <div className="space-y-0">
          {faqData.map((item, idx) => (
            <FAQItem key={idx} item={item} idx={idx} />
          ))}
        </div>
      </div>
    </section>
  );
};

export default FAQ;

