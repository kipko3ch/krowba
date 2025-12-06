import React, { useRef } from 'react';
import { motion, useInView } from 'framer-motion';
import { Check } from 'lucide-react';

const sellerBenefits = [
    {
        title: "No More Ghost Buyer Losses",
        desc: "Delivery costs are covered upfront through the buyer’s bond."
    },
    {
        title: "Guaranteed Outcomes",
        desc: "Each transaction follows clear rules from start to finish."
    },
    {
        title: "Instant Trust",
        desc: "Your verified seller page helps buyers feel confident immediately."
    },
    {
        title: "Automatic Settlements",
        desc: "Funds release instantly after confirmed delivery."
    },
    {
        title: "Fair Dispute Rules",
        desc: "If an item is returned or arrives damaged, buyer is refunded and seller gets item back. No biased decisions."
    }
];

const buyerBenefits = [
    {
        title: "Safe Payments",
        desc: "Your money stays protected until the item arrives."
    },
    {
        title: "No Blind Pre-Payments",
        desc: "Only pay the balance when your order is delivered."
    },
    {
        title: "Automatic Refunds",
        desc: "If delivery fails or the item arrives damaged, you get your money back immediately."
    },
    {
        title: "Verified Products",
        desc: "See real photos uploaded by the seller — no surprises."
    },
    {
        title: "Shop Anywhere Safely",
        desc: "Krowba works across any platform or channel you use."
    }
];

const BenefitItem: React.FC<{ item: { title: string; desc: string }; idx: number; isGreen?: boolean }> = ({ item, idx, isGreen }) => {
    return (
        <motion.li
            className="flex items-start gap-4"
            initial={{ opacity: 0, x: isGreen ? 20 : -20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true, margin: "-50px" }}
            transition={{ duration: 0.5, delay: idx * 0.1 }}
        >
            {isGreen ? (
                <motion.span
                    className="w-5 h-5 rounded-full bg-primary flex items-center justify-center flex-shrink-0 mt-0.5"
                    whileHover={{ scale: 1.2 }}
                >
                    <Check className="w-3 h-3 text-gray-900" />
                </motion.span>
            ) : (
                <Check className="w-5 h-5 text-gray-400 mt-0.5 flex-shrink-0" />
            )}
            <div>
                <p className="font-semibold text-gray-900 mb-1">{item.title}</p>
                <p className="text-gray-600 text-sm leading-relaxed">{item.desc}</p>
            </div>
        </motion.li>
    );
};

const ComparisonSection: React.FC = () => {
    const headerRef = useRef(null);
    const headerInView = useInView(headerRef, { once: true, margin: "-100px" });
    const cardsRef = useRef(null);
    const cardsInView = useInView(cardsRef, { once: true, margin: "-100px" });

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

    const cardVariants = {
        hidden: { opacity: 0, y: 60, filter: "blur(10px)" },
        visible: (i: number) => ({
            opacity: 1,
            y: 0,
            filter: "blur(0px)",
            transition: {
                duration: 0.7,
                delay: i * 0.2,
                ease: [0.25, 0.4, 0.25, 1]
            }
        })
    };

    return (
        <section className="py-28 bg-[#f8faf9]">
            <div className="max-w-7xl mx-auto px-6 md:px-12">
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
                        <span className="text-sm font-medium text-primary">Why choose Krowba</span>
                    </motion.div>
                    <motion.h2
                        className="font-serif-display text-4xl md:text-5xl text-gray-900 leading-tight max-w-3xl mx-auto italic"
                        variants={itemVariants}
                    >
                        Designed to protect both sides fairly and transparently
                    </motion.h2>
                </motion.div>

                {/* Cards Container with Main Border */}
                <motion.div
                    ref={cardsRef}
                    className="max-w-5xl mx-auto rounded-2xl border border-gray-200 bg-white overflow-hidden"
                    variants={cardVariants}
                    initial="hidden"
                    animate={cardsInView ? "visible" : "hidden"}
                    custom={0}
                >
                    <div className="grid md:grid-cols-2">
                        {/* Sellers Card - Borderless */}
                        <motion.div
                            className="bg-white p-8"
                            variants={cardVariants}
                            initial="hidden"
                            animate={cardsInView ? "visible" : "hidden"}
                            custom={0}
                            whileHover={{ y: -2, transition: { duration: 0.2 } }}
                        >
                            <h3 className="text-lg font-bold text-gray-900 mb-8">Why Sellers Love Krowba</h3>
                            <ul className="space-y-6">
                                {sellerBenefits.map((item, idx) => (
                                    <BenefitItem key={idx} item={item} idx={idx} />
                                ))}
                            </ul>
                        </motion.div>

                        {/* Buyers Card - With Full Gradient */}
                        <motion.div
                            className="relative p-8 border-l border-gray-200 md:border-l md:border-t-0 border-t overflow-hidden"
                            style={{
                                background: 'linear-gradient(135deg, rgba(139, 92, 246, 0.08) 0%, rgba(68, 249, 31, 0.12) 100%)'
                            }}
                            variants={cardVariants}
                            initial="hidden"
                            animate={cardsInView ? "visible" : "hidden"}
                            custom={1}
                            whileHover={{ y: -2, transition: { duration: 0.2 } }}
                        >
                            <h3 className="text-lg font-bold text-gray-900 mb-8 relative z-10">Why Buyers Love Krowba</h3>
                            <ul className="space-y-6 relative z-10">
                                {buyerBenefits.map((item, idx) => (
                                    <BenefitItem key={idx} item={item} idx={idx} isGreen />
                                ))}
                            </ul>
                        </motion.div>
                    </div>
                </motion.div>
            </div>
        </section>
    );
};

export default ComparisonSection;
