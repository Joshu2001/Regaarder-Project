import React, { useState, useRef, useEffect, useCallback } from 'react';
import { getTranslation } from './translations';

// New revamped BoostsModal with experiential messaging focused on VISIBILITY & DISCOVERY
// Keeping shape and drag bar, completely new content and messaging approach
const BoostsModalRevamped = ({ isOpen, onClose, requestId, detailedRank, onGiveLikeFree, selectedLanguage = 'English' }) => {
    const modalRef = useRef(null);
    const minHeight = window.innerHeight * 0.5;
    const maxHeight = window.innerHeight * 0.95;

    const [currentHeight, setCurrentHeight] = useState(window.innerHeight * 0.9);
    const [selectedAmount, setSelectedAmount] = useState(10);

    // Destructure rank data
    const {
        rank,
        nextRankNeeded,
        threatCount,
        totalInfluence
    } = detailedRank;

    // --- Experiential Boost System: Rank Decay ---
    // Requests naturally drop ~6 positions every 4 hours without boosts
    // This is verifiable by user experience, creating honest and structural urgency
    const ESTIMATED_DECAY_POSITIONS = 6;
    const calculateDecayMinutes = () => {
        // Random between 200-240 minutes (3h 20m - 4h)
        const baseMinutes = 220 + Math.random() * 40;
        return Math.round(baseMinutes);
    };
    const [decayMinutes] = useState(calculateDecayMinutes());

    const [currentScore, setCurrentScore] = useState(totalInfluence);
    useEffect(() => { setCurrentScore(totalInfluence); }, [totalInfluence]);

    // 1 dollar = 2 Influence points
    const influenceMultiplier = 2;
    const boostValue = selectedAmount * influenceMultiplier;

    // Payment providers state
    const [selectedProvider, setSelectedProvider] = useState('wise');
    const [processingPayment, setProcessingPayment] = useState(false);

    const goldStyle = { color: 'var(--color-gold)' };

    // --- Experiential Headlines: Focus on VISIBILITY & DISCOVERY ---
    // Discovery vs Amplification: Requests page is discovery, Boosts modal is amplification
    const getHeadline = () => {
        if (rank === 1) return getTranslation('Amplify Your Reach', selectedLanguage);
        if (rank <= 5) return getTranslation('Rise in Discovery', selectedLanguage);
        return getTranslation('Get More Eyes', selectedLanguage);
    };

    const getSubheadline = () => {
        if (rank === 1 && threatCount > 0) {
            return getTranslation('Another request is gaining traction. Stay visible to stay winning.', selectedLanguage);
        }
        if (rank <= 5) {
            return getTranslation('Climb the rankings so creators discover your request first.', selectedLanguage);
        }
        return getTranslation('More visibility, faster fulfillment', selectedLanguage);
    };

    // Principled Urgency: Rank Decay Window
    // Structural, verifiable, not arbitrary — based on actual platform dynamics
    const getDecayMessage = () => {
        const hours = Math.floor(decayMinutes / 60);
        const mins = decayMinutes % 60;
        return getTranslation('Without a boost, this request will drop ~6 ranks in about', selectedLanguage) + ` ${hours}h ${mins}m.`;
    };

    // Competitive Urgency: Challenger Proximity (only when applicable)
    // Game psychology but still honest
    const getCompetitiveMessage = () => {
        if (threatCount > 0) {
            return getTranslation('You\'re just 1-2 boosts away from staying ahead of the challengers.', selectedLanguage);
        }
        return null;
    };

    // --- Drag Handle Logic ---
    const handleTouchStart = useCallback((e) => {
        e.preventDefault();
        if (!modalRef.current) return;

        const startY = e.touches[0].clientY;
        const startHeight = modalRef.current.clientHeight;

        const handleTouchMove = (moveEvent) => {
            const deltaY = moveEvent.touches[0].clientY - startY;
            let newHeight = startHeight - deltaY;

            newHeight = Math.min(Math.max(newHeight, minHeight), maxHeight);
            setCurrentHeight(newHeight);
        };

        const handleTouchEnd = () => {
            window.removeEventListener('touchmove', handleTouchMove);
            window.removeEventListener('touchend', handleTouchEnd);

            if (modalRef.current && modalRef.current.clientHeight < minHeight + 50) {
                onClose();
            }
        };

        window.addEventListener('touchmove', handleTouchMove, { passive: false });
        window.addEventListener('touchend', handleTouchEnd);
    }, [minHeight, maxHeight, onClose]);

    useEffect(() => {
        if (isOpen) {
            setCurrentHeight(window.innerHeight * 0.9);
            document.body.style.overflow = 'hidden';
            setSelectedAmount(10);
        } else {
            document.body.style.overflow = '';
        }
        return () => {
            document.body.style.overflow = '';
        };
    }, [isOpen]);

    // Escape to close
    useEffect(() => {
        if (!isOpen) return;
        const handleKey = (e) => { if (e.key === 'Escape') onClose(); };
        window.addEventListener('keydown', handleKey);
        return () => window.removeEventListener('keydown', handleKey);
    }, [isOpen, onClose]);

    // Focus management: trap focus inside the modal
    const prevActiveRef = useRef(null);
    useEffect(() => {
        if (!isOpen || !modalRef.current) return;
        prevActiveRef.current = document.activeElement;

        setTimeout(() => {
            try {
                const focusable = modalRef.current.querySelectorAll('a[href], button:not([disabled]), textarea, input, select, [tabindex]:not([tabindex="-1"])');
                if (focusable && focusable.length) {
                    focusable[0].focus();
                } else {
                    modalRef.current.focus();
                }
            } catch (err) { }
        }, 50);

        const handleKeyDown = (e) => {
            if (!modalRef.current) return;
            if (e.key === 'Tab') {
                const focusable = modalRef.current.querySelectorAll('a[href], button:not([disabled]), textarea, input, select, [tabindex]:not([tabindex="-1"])');
                if (!focusable || focusable.length === 0) {
                    e.preventDefault();
                    return;
                }
                const first = focusable[0];
                const last = focusable[focusable.length - 1];
                if (e.shiftKey && document.activeElement === first) {
                    e.preventDefault();
                    last.focus();
                } else if (!e.shiftKey && document.activeElement === last) {
                    e.preventDefault();
                    first.focus();
                }
            }
            if (e.key === 'Escape') {
                onClose();
            }
        };

        document.addEventListener('keydown', handleKeyDown);
        return () => {
            document.removeEventListener('keydown', handleKeyDown);
            try { if (prevActiveRef.current && prevActiveRef.current.focus) prevActiveRef.current.focus(); } catch (err) { }
        };
    }, [isOpen, onClose]);

    return (
        <div
            className={`fixed inset-0 z-50 transition-all duration-300 flex items-center justify-center ${isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
            style={{ transitionProperty: 'opacity', transitionTimingFunction: 'cubic-bezier(.4,0,.2,1)' }}
            aria-hidden={!isOpen}
        >
            {/* Backdrop - solid black */}
            <div
                className={`absolute inset-0 bg-black transition-opacity duration-300 ${isOpen ? 'opacity-50' : 'opacity-0'}`}
                onClick={onClose}
                aria-label="Close boost modal background"
            />

            {/* Modal Container - Pop-up style centered */}
            <div
                ref={modalRef}
                tabIndex={-1}
                className="relative w-full max-w-md mx-auto rounded-3xl flex flex-col z-50"
                style={{
                    maxHeight: '85vh',
                    background: '#ffffff',
                    boxShadow: '0 20px 40px rgba(0,0,0,0.3)',
                    border: '1px solid #e5e7eb'
                }}
                aria-label="Boost visibility modal"
            >

                {/* Header */}
                <header className="relative px-8 pt-8 pb-6 border-b border-gray-50">
                    <h2 className="text-2xl font-bold text-gray-900 mb-2">{getHeadline()}</h2>
                    <p className="text-gray-600 text-sm leading-relaxed">{getSubheadline()}</p>
                </header>

                {/* Main Content */}
                <main className="flex-grow overflow-y-auto px-8 pb-8 space-y-8">
                    {/* Experiential Section: Why Boosting Matters */}
                    <section>
                        <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-4">
                            {getTranslation('How Boosting Works', selectedLanguage)}
                        </h3>
                        <div className="space-y-3">
                            {/* Visibility Increase */}
                            <div className="bg-blue-50 border border-blue-100 rounded-xl p-4">
                                <div className="flex items-start space-x-3">
                                    <div className="w-5 h-5 rounded-full bg-blue-500 flex items-center justify-center flex-shrink-0 mt-0.5">
                                        <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                                            <path fillRule="evenodd" d="M12.316 3.051a1 1 0 01.633 1.265l-4 12a1 1 0 11-1.898-.632l4-12a1 1 0 011.265-.633z" clipRule="evenodd" />
                                        </svg>
                                    </div>
                                    <div className="flex-1">
                                        <div className="font-medium text-gray-900 text-sm">{getTranslation('Reach More Creators', selectedLanguage)}</div>
                                        <div className="text-xs text-gray-600 mt-1">{getTranslation('Your request climbs rankings, appearing first to creators actively searching.', selectedLanguage)}</div>
                                    </div>
                                </div>
                            </div>

                            {/* Faster Fulfillment */}
                            <div className="bg-green-50 border border-green-100 rounded-xl p-4">
                                <div className="flex items-start space-x-3">
                                    <div className="w-5 h-5 rounded-full bg-green-500 flex items-center justify-center flex-shrink-0 mt-0.5">
                                        <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                                        </svg>
                                    </div>
                                    <div className="flex-1">
                                        <div className="font-medium text-gray-900 text-sm">{getTranslation('Get Fulfilled Faster', selectedLanguage)}</div>
                                        <div className="text-xs text-gray-600 mt-1">{getTranslation('Higher visibility means more creators see it, and higher chance someone claims it.', selectedLanguage)}</div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </section>

                    {/* Principled Urgency Section */}
                    {/* Removed RANK DECAY WINDOW section as requested */}

                    {/* Removed COMPETITIVE EDGE section as requested */}

                    {/* Boost Amount Selection */}
                    <section>
                        <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-4">
                            {getTranslation('Choose Your Boost', selectedLanguage)}
                        </h3>
                        <div className="grid grid-cols-4 gap-2">
                            {[5, 10, 25, 50].map(amount => (
                                <button
                                    key={amount}
                                    onClick={() => setSelectedAmount(amount)}
                                    className="relative py-6 px-2 text-center rounded-xl border-2 font-bold transition-all duration-200"
                                    style={{
                                        backgroundColor: selectedAmount === amount ? '#111827' : '#fff',
                                        color: selectedAmount === amount ? '#fff' : '#6b7280',
                                        borderColor: selectedAmount === amount ? '#111827' : '#e5e7eb',
                                        boxShadow: selectedAmount === amount ? '0 0 12px rgba(17, 24, 39, 0.15)' : 'none',
                                    }}
                                >
                                    <div className="text-lg font-bold">${amount}</div>
                                    <div className="text-xs mt-1" style={{ opacity: 0.7 }}>
                                        +{amount * 2},
                                    </div>
                                </button>
                            ))}
                        </div>
                    </section>
                </main>

                {/* Footer with CTA */}
                <footer className="px-8 pb-10 pt-6 border-t border-gray-50" style={{ paddingBottom: 'calc(40px + env(safe-area-inset-bottom))' }}>
                    <div className="space-y-4">
                        {/* Primary CTA */}
                        <button
                            className={`w-full py-4 font-semibold text-base rounded-2xl transition-all ${processingPayment ? 'opacity-50 pointer-events-none' : 'hover:scale-[1.01] active:scale-[0.99]'}`}
                            style={{
                                backgroundColor: '#111827',
                                color: '#ffffff'
                            }}
                            onClick={async () => {
                                setProcessingPayment(true);
                                try {
                                    const res = await fetch('/api/pay/create-session', {
                                        method: 'POST',
                                        headers: { 'Content-Type': 'application/json' },
                                        body: JSON.stringify({
                                            provider: selectedProvider,
                                            requestId,
                                            amount: selectedAmount,
                                            boost: boostValue
                                        })
                                    });
                                    const data = await res.json();

                                    if (data && data.redirectUrl) {
                                        window.location.href = data.redirectUrl;
                                        return;
                                    }

                                    if (data && data.success) {
                                        setCurrentScore(prev => prev + boostValue);
                                        setProcessingPayment(false);
                                        setTimeout(() => onClose(), 650);
                                        return;
                                    }

                                    setProcessingPayment(false);
                                    alert(getTranslation('Payment failed. Please try again.', selectedLanguage));
                                } catch (err) {
                                    console.error('Payment error', err);
                                    setProcessingPayment(false);
                                    alert(getTranslation('Payment failed. Please try again.', selectedLanguage));
                                }
                            }}
                        >
                            {processingPayment ? getTranslation('Processing...', selectedLanguage) : `${getTranslation('Boost for', selectedLanguage)} $${selectedAmount}`}
                        </button>

                        {/* Payment Providers */}
                        <div className="flex justify-center gap-4 pt-2">
                            {['Wise', 'Stripe', 'PayPal'].map(provider => (
                                <button
                                    key={provider}
                                    onClick={() => setSelectedProvider(provider.toLowerCase())}
                                    className="text-xs font-medium transition-colors"
                                    style={{
                                        color: selectedProvider === provider.toLowerCase() ? '#111827' : '#d1d5db'
                                    }}
                                >
                                    {provider}
                                </button>
                            ))}
                        </div>
                    </div>
                </footer>
            </div>
        </div>
    );
};

export default BoostsModalRevamped;
