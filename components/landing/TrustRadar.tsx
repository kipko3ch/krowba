import React, { useRef } from 'react';
import { motion, useInView } from 'framer-motion';
import { Brain, Camera, Lock, Zap, CreditCard, Shield } from 'lucide-react';

const features = [
    {
        icon: Shield,
        title: "Smart Escrow",
        desc: "Funds stay protected in escrow until delivery is completed successfully."
    },
    {
        icon: Zap,
        title: "Split-Risk Payments",
        desc: "Buyers pay a small bond or shipping fee; sellers ship with guaranteed commitment."
    },
    {
        icon: Lock,
        title: "Delivery Triggers",
        desc: "Courier delivery updates automatically determine when funds unlock."
    },
    {
        icon: CreditCard,
        title: "Direct Bank Transfers",
        desc: "Each Krowba link generates a unique virtual account so buyers can pay easily via transfer, USSD, or mobile money."
    },
    {
        icon: Brain,
        title: "Clear, Automated Resolutions",
        desc: "If delivery fails, is rejected, or returned, refunds happen instantly — no arguments."
    },
    {
        icon: Shield,
        title: "Delivery Condition Guarantee",
        desc: "Money is released only if the item arrives in good condition. If damaged or wrong, buyer is refunded and item returned."
    },
    {
        icon: Camera,
        title: "Photo Verification (AI Assisted)",
        desc: "Sellers upload a real product photo. Krowba checks against common scam patterns like stock images."
    },
    {
        icon: Brain,
        title: "Damage Check (AI Assisted)",
        desc: "If a buyer reports damage, Krowba uses simple image checks to validate issues for fair resolutions."
    }
];

const FeatureCard: React.FC<{ feature: typeof features[0]; idx: number }> = ({ feature, idx }) => {
    const ref = useRef(null);
    const isInView = useInView(ref, { once: true, margin: "-50px" });
    const Icon = feature.icon;

    return (
        <motion.div
            ref={ref}
            className="text-center"
            initial={{ opacity: 0, y: 40, filter: "blur(10px)" }}
            animate={isInView ? {
                opacity: 1,
                y: 0,
                filter: "blur(0px)"
            } : {}}
            transition={{
                duration: 0.6,
                delay: idx * 0.1,
                ease: [0.25, 0.4, 0.25, 1]
            }}
        >
            {/* Neon Green Icon */}
            <motion.div
                className="inline-flex items-center justify-center w-16 h-16 rounded-2xl mb-6 relative"
                style={{
                    background: 'linear-gradient(135deg, rgba(68, 249, 31, 0.1) 0%, rgba(68, 249, 31, 0.05) 100%)',
                    border: '1px solid rgba(68, 249, 31, 0.3)'
                }}
                whileHover={{ scale: 1.1, rotate: 5 }}
                transition={{ type: "spring", stiffness: 400 }}
            >
                <Icon
                    className="w-7 h-7"
                    style={{
                        color: '#44F91F',
                        filter: 'drop-shadow(0 0 8px rgba(68, 249, 31, 0.6))'
                    }}
                />
            </motion.div>

            {/* Title */}
            <h3 className="text-lg font-bold text-gray-900 mb-3">{feature.title}</h3>

            {/* Description */}
            <p className="text-gray-600 text-sm leading-relaxed">
                {feature.desc}
            </p>
        </motion.div>
    );
};

const TrustRadar: React.FC = () => {
    const headerRef = useRef(null);
    const headerInView = useInView(headerRef, { once: true, margin: "-100px" });

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

    return (
        <section className="py-28 bg-white">
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
                        <span className="text-sm font-medium text-primary">Features</span>
                    </motion.div>
                    <motion.h2
                        className="font-serif-display text-4xl md:text-5xl text-gray-900 leading-tight max-w-3xl mx-auto italic"
                        variants={itemVariants}
                    >
                        The essentials that make social commerce safer
                    </motion.h2>
                </motion.div>

                {/* Features Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-x-8 gap-y-12 max-w-7xl mx-auto">
                    {features.map((feature, idx) => (
                        <div key={idx}>
                            <FeatureCard feature={feature} idx={idx} />
                        </div>
                    ))}
                </div>
            </div>
        </section>
    );
};

export default TrustRadar;
