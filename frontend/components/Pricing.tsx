import React, { useRef } from 'react';
import { motion, useInView } from 'framer-motion';
import { Check } from 'lucide-react';

const Pricing: React.FC = () => {
    const headerRef = useRef(null);
    const headerInView = useInView(headerRef, { once: true, margin: "-100px" });
    const cardRef = useRef(null);
    const cardInView = useInView(cardRef, { once: true, margin: "-100px" });

    const headerVariants = {
        hidden: { opacity: 0 },
        visible: {
            opacity: 1,
            transition: {
                staggerChildren: 0.15
            }
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

    const freeFeatures = [
        "No monthly fees",
        "No activation fees",
        "Free to generate links"
    ];

    return (
        <section id="pricing" className="py-28 bg-white">
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
                        <span className="text-sm font-medium text-primary">Pricing</span>
                    </motion.div>
                    <motion.h2
                        className="font-serif-display text-4xl md:text-5xl text-gray-900 leading-tight max-w-3xl mx-auto italic"
                        variants={itemVariants}
                    >
                        Krowba Pricing
                    </motion.h2>
                </motion.div>

                {/* Pricing Card */}
                <motion.div
                    ref={cardRef}
                    className="max-w-2xl mx-auto"
                    initial={{ opacity: 0, y: 40 }}
                    animate={cardInView ? { opacity: 1, y: 0 } : {}}
                    transition={{ duration: 0.7, ease: [0.25, 0.4, 0.25, 1] }}
                >
                    <div className="rounded-2xl border border-gray-200 bg-white overflow-hidden">
                        {/* Free to Sign Up Section */}
                        <div className="p-8 md:p-10">
                            <h3 className="text-2xl md:text-3xl font-serif-display text-gray-900 mb-6 italic">
                                Free to Sign Up
                            </h3>
                            <ul className="space-y-4 mb-8">
                                {freeFeatures.map((feature, idx) => (
                                    <motion.li
                                        key={idx}
                                        className="flex items-center gap-3"
                                        initial={{ opacity: 0, x: -20 }}
                                        animate={cardInView ? { opacity: 1, x: 0 } : {}}
                                        transition={{ duration: 0.5, delay: idx * 0.1 }}
                                    >
                                        <span className="w-5 h-5 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                                            <Check className="w-3 h-3 text-primary" />
                                        </span>
                                        <span className="text-gray-700">{feature}</span>
                                    </motion.li>
                                ))}
                            </ul>
                        </div>

                        {/* Transaction Fee Section */}
                        <div className="p-8 md:p-10 bg-gradient-to-br from-primary/5 to-primary/10 border-t border-gray-200">
                            <h3 className="text-xl md:text-2xl font-bold text-gray-900 mb-6">
                                Transaction Fee
                            </h3>

                            <div className="space-y-4 mb-6">
                                <motion.div
                                    className="flex items-baseline gap-2"
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={cardInView ? { opacity: 1, y: 0 } : {}}
                                    transition={{ duration: 0.5, delay: 0.3 }}
                                >
                                    <span className="text-5xl md:text-6xl font-bold text-gray-900">1%</span>
                                    <span className="text-gray-600">per successful delivery</span>
                                </motion.div>

                                <motion.p
                                    className="text-gray-600"
                                    initial={{ opacity: 0 }}
                                    animate={cardInView ? { opacity: 1 } : {}}
                                    transition={{ duration: 0.5, delay: 0.4 }}
                                >
                                    Capped at $5 per transaction
                                </motion.p>
                            </div>

                            <motion.div
                                className="pt-6 border-t border-gray-300/50"
                                initial={{ opacity: 0 }}
                                animate={cardInView ? { opacity: 1 } : {}}
                                transition={{ duration: 0.5, delay: 0.5 }}
                            >
                                <p className="text-sm text-gray-600 leading-relaxed">
                                    You only pay when delivery is successful — aligned incentives for both buyers and sellers.
                                </p>
                            </motion.div>
                        </div>
                    </div>
                </motion.div>
            </div>
        </section>
    );
};

export default Pricing;
