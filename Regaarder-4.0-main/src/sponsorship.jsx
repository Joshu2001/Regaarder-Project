import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Home, FileText, Pencil, MoreHorizontal, Crown, ArrowLeft, ChevronRight, ChevronLeft, Shield, Lock, Gift, Star } from 'lucide-react';
import { getTranslation } from './translations.js';

// Reuse the same accent/color tokens from advertisewithus.jsx
const getCssVar = (name, fallback) => {
    try { const v = getComputedStyle(document.documentElement).getPropertyValue(name); return v ? v.trim() : fallback; } catch (e) { return fallback; }
};
const ACCENT_COLOR = getCssVar('--color-accent', '#CA8A04');
const HIGHLIGHT_COLOR = getCssVar('--color-accent-soft', 'rgba(202, 138, 4, 0.12)');
const ICON_BACKGROUND = getCssVar('--color-gold-light-bg', 'rgba(202, 138, 4, 0.1)');

// Safe price formatting helper
const formatPrice = (monthly, billingPeriod = 'monthly', discount = 0.17) => {
    if (typeof monthly !== 'number' || Number.isNaN(monthly)) return '—';
    if (billingPeriod === 'monthly') return `$${monthly.toFixed(2)}`;
    const annual = monthly * 12 * (1 - discount);
    return `$${annual.toFixed(2)}`;
};

// Ala carte items (from provided images)
const alaCarteItems = [
    {
        title: '30 Extra Requests',
        priceMonthly: 5.99,
        description: 'Add 30 video requests to your monthly quota',
    },
    {
        title: '100 Extra Requests',
        priceMonthly: 14.99,
        description: 'Power user pack - 100 requests per month',
    },
    {
        title: '50GB Extra Storage',
        priceMonthly: 3.99,
        description: 'Expand your storage capacity',
    },
    {
        title: 'Priority Support',
        priceMonthly: 9.99,
        description: '24/7 priority support with 2hr response time',
    },
    {
        title: 'Unlimited Products',
        priceMonthly: 7.99,
        description: 'List unlimited products in marketplace',
    }
];

// Footer component copied exactly from advertisewithus.jsx (BottomBar)
const BottomBar = () => {
    const [activeTab, setActiveTab] = useState('Home');
    const navigatedRef = useRef(false);
    const language = localStorage.getItem('regaarder_language') || 'English';
    const t = (key) => getTranslation(key, language);

    const tabs = [
        { name: 'Home', Icon: Home },
        { name: 'Requests', Icon: FileText },
        { name: 'Ideas', Icon: Pencil },
        { name: 'More', Icon: MoreHorizontal },
    ];

    const inactiveColor = 'rgb(107 114 128)';

    return (
        <div
            className="fixed bottom-0 left-0 right-0 bg-gray-50 border-t border-gray-200 shadow-2xl z-10"
            style={{
                paddingTop: '10px',
                paddingBottom: 'calc(44px + env(safe-area-inset-bottom))'
            }}
        >
            <div className="flex justify-around max-w-md mx-auto">
                {tabs.map((tab) => {
                    const isSelected = tab.name === activeTab;

                    const activeColorStyle = isSelected
                        ? { color: 'var(--color-accent)' }
                        : { color: inactiveColor };

                    const textWeight = isSelected ? 'font-semibold' : 'font-normal';

                    let wrapperStyle = {};
                    if (isSelected) {
                        wrapperStyle.textShadow = `0 0 8px var(--color-accent-soft)`;
                    }

                                    const navigateToTab = (tabName) => {
                                        try {
                                            if (tabName === 'Home') {
                                                // Navigate dynamically to home page instead of forcing a reload
                                                window.location.href = '/home.jsx';
                                                return;
                                            }
                                            if (tabName === 'Requests') {
                                                window.location.href = '/requests.jsx';
                                                return;
                                            }
                                            if (tabName === 'Ideas') {
                                                window.location.href = '/ideas.jsx';
                                                return;
                                            }
                                            if (tabName === 'More') {
                                                window.location.href = '/more.jsx';
                                                return;
                                            }
                                        } catch (e) {
                                            console.warn('Navigation failed', e);
                                        }
                                    };

                    return (
                        <div
                            key={tab.name}
                            className={`relative flex flex-col items-center w-1/4 focus:outline-none`}
                            style={wrapperStyle}
                        >
                            <button
                                className="flex flex-col items-center w-full"
                                onMouseDown={() => {
                                    setActiveTab(tab.name);
                                    if (!navigatedRef.current) { navigatedRef.current = true; navigateToTab(tab.name); }
                                }}
                                onTouchStart={() => {
                                    setActiveTab(tab.name);
                                    if (!navigatedRef.current) { navigatedRef.current = true; navigateToTab(tab.name); }
                                }}
                                onClick={(e) => {
                                    if (navigatedRef.current) { navigatedRef.current = false; e.preventDefault(); return; }
                                    setActiveTab(tab.name);
                                    navigateToTab(tab.name);
                                }}
                            >
                                <div className="w-11 h-11 flex items-center justify-center">
                                    <tab.Icon className="w-5 h-5" strokeWidth={1.5} style={activeColorStyle} />
                                </div>
                                <span className={`text-[11px] md:text-xs mt-0 leading-none ${textWeight}`} style={activeColorStyle}>
                                    {t(tab.name)}
                                </span>
                            </button>
                        </div>
                    );
                })}
            </div>
        </div>
    );
};

const PlanCard = ({ title, priceMonthly, oldPriceMonthly, features = [], cta, themeColor = ACCENT_COLOR, badge = null, savingLabel = null, billingPeriod = 'monthly', annualDiscount = 0.17, onCtaClick = null }) => {
    const displayPrice = (monthly) => formatPrice(monthly, billingPeriod, annualDiscount);

    const periodLabel = billingPeriod === 'monthly' ? '/mo' : '/yr';

    return (
        <div className="rounded-3xl border p-8 bg-white shadow-lg hover:shadow-xl transition-shadow duration-300 relative overflow-hidden">
            {/* Accent highlight on top */}
            <div className="absolute top-0 left-0 right-0 h-1" style={{ backgroundColor: themeColor }} />
            
            {badge && (
                <div className="absolute top-6 right-6">
                    <div className="text-xs font-bold px-3 py-1.5 rounded-full text-white" style={{ backgroundColor: themeColor }}>
                        {badge.label}
                    </div>
                </div>
            )}

            <div className="mb-6">
                <h2 className="text-2xl font-bold text-gray-900 mb-4">{title}</h2>
                <div className="flex items-baseline space-x-2">
                    {oldPriceMonthly && (
                        <div className="text-lg text-gray-400 line-through">
                            {formatPrice(oldPriceMonthly, billingPeriod, annualDiscount)}
                        </div>
                    )}
                    <div className="text-4xl font-bold" style={{ color: themeColor }}>
                        {displayPrice(priceMonthly)}
                    </div>
                    <div className="text-gray-600 font-medium">{periodLabel}</div>
                </div>
                {savingLabel && (
                    <div className="mt-3 text-sm font-semibold" style={{ color: themeColor }}>
                        {savingLabel}
                    </div>
                )}
            </div>

            {/* Features list */}
            <ul className="space-y-3 mb-8 pb-8 border-b border-gray-200">
                {features.map((f, i) => (
                    <li key={i} className="flex items-start space-x-3">
                        <div className="flex-shrink-0 pt-1">
                            <svg className="w-5 h-5" style={{ color: themeColor }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                            </svg>
                        </div>
                        <span className="text-gray-700 leading-relaxed">{f}</span>
                    </li>
                ))}
            </ul>

            {/* CTA Button */}
            <button 
                onClick={() => onCtaClick && onCtaClick()} 
                className="w-full py-3 px-4 rounded-xl text-white font-semibold transition-all duration-200 hover:opacity-90 active:scale-95"
                style={{ backgroundColor: themeColor }}
            >
                {cta}
            </button>
        </div>
    );
};


const Sponsorships = () => {
    const navigate = useNavigate();
    // refs for scroll reveal
    const containerRef = useRef(null);
    const cardRefs = useRef([]);
    const [visibleIdx, setVisibleIdx] = useState(() => ({}));
    const [showAlaCarte, setShowAlaCarte] = useState(false);
    const [billingPeriod, setBillingPeriod] = useState('monthly');
    const [selectedAlaCarte, setSelectedAlaCarte] = useState([]);
    const [showAddModal, setShowAddModal] = useState(false);
    const [selectedPlan, setSelectedPlan] = useState(null);
    const [showCheckoutModal, setShowCheckoutModal] = useState(false);
    const [selectedPaymentMethod, setSelectedPaymentMethod] = useState('card');
    const [processingPayment, setProcessingPayment] = useState(false);
    const [language, setLanguage] = useState(localStorage.getItem('regaarder_language') || 'English');
    const t = (key) => getTranslation(key, language);

    useEffect(() => {
        const handleLanguageChange = () => {
            setLanguage(localStorage.getItem('regaarder_language') || 'English');
        };
        window.addEventListener('storage', handleLanguageChange);
        return () => window.removeEventListener('storage', handleLanguageChange);
    }, []);

    const toggleAlaCarteSelection = (title) => {
        setSelectedAlaCarte(prev => {
            if (prev.includes(title)) return prev.filter(t => t !== title);
            return [...prev, title];
        });
    };

    const handleSelectPlan = (plan) => {
        setSelectedPlan(plan);
        setSelectedPaymentMethod('card');
        setShowCheckoutModal(true);
    };

    useEffect(() => {
        // rebuild refs array and (re)observe whenever the set of visible cards may change
        cardRefs.current = cardRefs.current.slice(0);
        if (!('IntersectionObserver' in window)) return;
        const obs = new IntersectionObserver((entries) => {
            entries.forEach((entry) => {
                const i = Number(entry.target.getAttribute('data-idx'));
                if (entry.isIntersecting) {
                    setVisibleIdx(prev => ({ ...prev, [i]: true }));
                }
            });
        }, { root: null, rootMargin: '0px 0px -10% 0px', threshold: 0.1 });

        cardRefs.current.forEach(el => { if (el) obs.observe(el); });
        return () => obs.disconnect();
    }, [showAlaCarte, billingPeriod]);

    // Close modal on Escape
    useEffect(() => {
        if (!showAddModal) return;
        const onKey = (e) => { if (e.key === 'Escape') setShowAddModal(false); };
        window.addEventListener('keydown', onKey);
        return () => window.removeEventListener('keydown', onKey);
    }, [showAddModal]);

    // Close checkout modal on Escape
    useEffect(() => {
        if (!showCheckoutModal) return;
        const onKey = (e) => { if (e.key === 'Escape') setShowCheckoutModal(false); };
        window.addEventListener('keydown', onKey);
        return () => window.removeEventListener('keydown', onKey);
    }, [showCheckoutModal]);

    const ANNUAL_DISCOUNT = 0.17;

    const plans = [
        {
            title: 'Starter',
            priceMonthly: 5.99,
            features: [
                '5 video requests per week',
                '5 marketplace product listings',
                'All tone & length options',
                'Private & unlisted requests',
                'HD video quality (1080p)',
                'Priority email support',
                'Request templates',
                'Video notes & timestamps',
                'Basic analytics dashboard',
                '10 folders',
                '5GB storage',
                'Remove watermarks'
            ],
            cta: 'Get Starter',
            themeColor: ACCENT_COLOR,
        },
        {
            // Pro uses a red accent per provided images
            title: 'Pro',
            priceMonthly: 8.24,
            oldPriceMonthly: 14.99,
            savingLabel: `Save $${(14.99 - 8.24).toFixed(2)}`,
            features: [
                '15 video requests per week',
                '20 marketplace product listings',
                'Everything in Starter, plus:',
                '4K Ultra HD video quality',
                'Unlimited private requests',
                'Advanced file uploads (up to 500MB)',
                'Priority creator matching',
                'Video editor access (basic)',
                'Audio extraction & downloads',
                'Collaborative folders (3 collaborators)',
                'Advanced analytics & insights',
                'Custom request templates',
                'Disappearing videos (24hr-7 days)',
                'Product placement in videos',
                'Brand campaign tools (basic)',
                '50 folders',
                '25GB storage',
                'Priority support (24hr response)'
            ],
            cta: 'Grab Flash Deal',
            themeColor: '#EF4444', // red
            badge: { label: 'FLASH DEAL -45% OFF', color: '#FF7A7A' }
        },
        {
            title: 'Creator',
            priceMonthly: 29.99,
            features: [
                'UNLIMITED video requests',
                'UNLIMITED marketplace products',
                'Everything in Pro, plus:',
                'Creator dashboard & monetization',
                'Full video editor suite (advanced)',
                'AI-powered smart editor',
                'Auto-transcription & captions',
                'Multi-language subtitles',
                'Verified creator badge',
                'Sponsored content tools',
                'Advanced sponsorship deals',
                'Custom brand campaigns (unlimited)',
                'Unlimited collaborators',
                'White-label options',
                'API access',
                'Priority marketplace placement',
                'Featured in creator spotlight',
                '0% platform fee (first 6 months)',
                'Reduced platform fee (5% after)',
                'Unlimited folders',
                '100GB storage',
                'Dedicated account manager',
                'Premium support (2hr response)',
                'Custom analytics reports',
                'Advanced audience insights'
            ],
            cta: 'Get Creator',
            themeColor: ACCENT_COLOR,
            badge: { label: 'Best Value', color: '#10B981' }
        }
    ];

    // Additional sections to show after plan cards
    const sections = [
        {
            type: 'brand',
            title: 'Brand',
            oldPriceMonthly: 99.99,
            priceMonthly: 89.99,
            savingLabel: 'Save $10.00 today',
            features: [
                'Everything in Creator, plus:',
                'UNLIMITED everything',
                'Multi-user team accounts (10 seats)',
                'Advanced brand analytics',
                'Sponsored creator network access',
                'Campaign performance tracking',
                'ROI & conversion analytics',
                'Custom integrations',
                'Bulk video requests',
                'Dedicated brand manager',
                'Custom contracts & agreements',
                'Priority creator partnerships',
                'Exclusive brand features',
                'White-label platform options',
                '500GB team storage',
                'SLA guarantee (1hr response)',
                'Quarterly business reviews',
                'Custom feature development'
            ],
            cta: 'Get Special Offer',
            themeColor: '#F97316' // orange
        },
        {
            type: 'featuresRow'
        },
        {
            type: 'testimonial'
        }
    ];

    return (
        <div className="min-h-screen bg-white text-gray-900">
            <div className="max-w-md mx-auto px-4 pt-6 pb-24" ref={containerRef}>
                {/* header */}
                <div className="flex items-center space-x-4 mb-4">
                    <ChevronLeft
                        className="w-6 h-6 text-gray-700 cursor-pointer transition hover:text-gray-900"
                        onClick={() => navigate('/home')}
                    />
                </div>
                <div className="text-center mb-6 pt-2">
                    <div className="inline-flex items-center justify-center p-3 rounded-full mb-3" style={{ backgroundColor: HIGHLIGHT_COLOR }}>
                        <Crown className="w-6 h-6" style={{ color: ACCENT_COLOR }} />
                    </div>
                    <h1 className="text-2xl font-bold mb-1">Upgrade Your Premium Experience</h1>
                    <p className="text-gray-500 text-sm">Choose the perfect plan for your needs</p>
                </div>

                {/* Billing toggle (Monthly / Annual) */}
                <div className="flex justify-center mb-8">
                    <div 
                        className="inline-flex items-center gap-1 p-1 rounded-full"
                        style={{ backgroundColor: '#F3F4F6' }}
                        onClick={() => { setBillingPeriod(prev => prev === 'monthly' ? 'annual' : 'monthly'); setVisibleIdx({}); }}
                    >
                        <button 
                            className={`px-5 py-2 rounded-full text-xs font-semibold transition-all duration-200 ${
                                billingPeriod === 'monthly' 
                                    ? 'text-white' 
                                    : 'text-gray-600'
                            }`}
                            style={billingPeriod === 'monthly' ? { backgroundColor: ACCENT_COLOR } : {}}
                        >
                            Monthly
                        </button>
                        <button 
                            className={`px-5 py-2 rounded-full text-xs font-semibold transition-all duration-200 ${
                                billingPeriod === 'annual' 
                                    ? 'text-white' 
                                    : 'text-gray-600'
                            }`}
                            style={billingPeriod === 'annual' ? { backgroundColor: ACCENT_COLOR } : {}}
                        >
                            Yearly
                        </button>
                    </div>
                </div>

                {/* Toggle between Full Plans and À La Carte */}
                <div className="flex justify-center mb-10">
                    <div className="inline-flex gap-1 p-1 rounded-full" style={{ backgroundColor: HIGHLIGHT_COLOR }}>
                        <button 
                            onClick={() => { setShowAlaCarte(false); setVisibleIdx({}); }} 
                            className={`px-5 py-2 rounded-full text-sm font-semibold transition-all duration-200 ${
                                !showAlaCarte 
                                    ? 'text-white shadow-md' 
                                    : 'text-gray-600'
                            }`}
                            style={!showAlaCarte ? { backgroundColor: ACCENT_COLOR } : {}}
                        >
                            Full Plans
                        </button>
                        <button 
                            onClick={() => { setShowAlaCarte(true); setVisibleIdx({}); }} 
                            className={`px-5 py-2 rounded-full text-sm font-semibold transition-all duration-200 ${
                                showAlaCarte 
                                    ? 'text-white shadow-md' 
                                    : 'text-gray-600'
                            }`}
                            style={showAlaCarte ? { backgroundColor: ACCENT_COLOR } : {}}
                        >
                            À La Carte
                        </button>
                    </div>
                </div>

                {/* Plan cards — revealed on-scroll */}
                <div className="space-y-6">
                    {!showAlaCarte ? (
                        <>
                            <div className="text-center mb-8">
                                <div className="h-1 w-16 mx-auto mb-4" style={{ backgroundColor: ACCENT_COLOR }} />
                                <h2 className="text-2xl font-bold text-gray-900" style={{ color: ACCENT_COLOR }}>Our Plans</h2>
                                <p className="text-gray-500 text-sm mt-2">Choose a plan that fits your needs</p>
                            </div>
                            {plans.map((p, idx) => (
                                <div
                                    key={p.title}
                                    ref={el => cardRefs.current[idx] = el}
                                    data-idx={idx}
                                    className={`transform transition duration-700 ease-out ${visibleIdx[idx] ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-6'}`}
                                >
                                    <PlanCard {...p} badge={p.badge} billingPeriod={billingPeriod} annualDiscount={ANNUAL_DISCOUNT} onCtaClick={() => handleSelectPlan(p)} />
                                </div>
                            ))}
                        </>
                    ) : (
                        <>
                            <div className="text-center mt-2 mb-4">
                                <div className="h-1 w-16 mx-auto mb-3" style={{ backgroundColor: ACCENT_COLOR }} />
                                <h2 className="text-2xl font-bold" style={{ color: ACCENT_COLOR }}>{t('Build Your Own Plan')}</h2>
                                <p className="text-sm text-gray-500">{t('Pick only the features you need without committing to a full plan')}</p>
                            </div>
                            {alaCarteItems.map((a, aIdx) => {
                                const idx = aIdx; // separate index space for ala carte
                                const displayPrice = formatPrice(a.priceMonthly, billingPeriod, ANNUAL_DISCOUNT);
                                const periodLabel = billingPeriod === 'monthly' ? '/month' : '/year';
                                const isSelected = selectedAlaCarte.includes(a.title);
                                return (
                                    <div key={a.title} ref={el => cardRefs.current[idx] = el} data-idx={idx} className={`transform transition duration-700 ease-out ${visibleIdx[idx] ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-6'}`}>
                                        <div
                                            onClick={() => toggleAlaCarteSelection(a.title)}
                                            role="button"
                                            tabIndex={0}
                                            onKeyDown={(e) => { if (e.key === 'Enter') toggleAlaCarteSelection(a.title); }}
                                            className="rounded-2xl border p-6 bg-white"
                                            style={{ borderColor: isSelected ? ACCENT_COLOR : '#E5E7EB', borderWidth: isSelected ? 2 : 1, cursor: 'pointer' }}
                                            aria-pressed={isSelected}
                                        >
                                            <div className="flex items-center justify-between">
                                                <div className="flex items-center space-x-4">
                                                    <div className="w-12 h-12 rounded-xl flex items-center justify-center" style={{ backgroundColor: HIGHLIGHT_COLOR }}>
                                                        <div className="w-6 h-6 rounded" style={{ backgroundColor: ACCENT_COLOR, opacity: 0.3 }} />
                                                    </div>
                                                    <div>
                                                        <div className="font-semibold text-lg">{a.title}</div>
                                                        <div className="text-sm text-gray-500">{a.description}</div>
                                                    </div>
                                                </div>
                                                <div className="text-right flex flex-col items-end">
                                                    <div className="text-2xl font-bold" style={{ color: ACCENT_COLOR }}>{displayPrice}</div>
                                                    <div className="text-xs text-gray-500">{periodLabel}</div>
                                                    <div className="mt-2">
                                                        <div className={`w-6 h-6 rounded-full flex items-center justify-center text-white`} style={isSelected ? { backgroundColor: ACCENT_COLOR } : { border: `2px solid ${ACCENT_COLOR}`, backgroundColor: '#fff' }}>{isSelected ? '✓' : ''}</div>
                                                    </div>
                                                </div>
                                            </div>

                                            <div className="mt-4 text-sm text-gray-500 flex items-center">
                                                <div className="w-5 h-5 rounded-full border border-gray-300 mr-3" />
                                                <div>{isSelected ? 'Selected' : 'Tap to select'}</div>
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}

                            {selectedAlaCarte.length > 0 && (
                            <div className="mt-6 p-6 rounded-3xl bg-white border-2 shadow-lg" style={{ borderColor: ACCENT_COLOR }}>
                                <div className="flex items-center justify-between">
                                    <div>
                                        <div className="text-sm text-gray-600">{selectedAlaCarte.length} selected</div>
                                        <div className="text-2xl font-bold" style={{ color: ACCENT_COLOR }}>Total: {formatPrice(selectedAlaCarte.reduce((sum, t) => {
                                            const item = alaCarteItems.find(it => it.title === t);
                                            return sum + (item ? item.priceMonthly : 0);
                                        }, 0), billingPeriod, ANNUAL_DISCOUNT)}</div>
                                    </div>
                                    <div>
                                        <button onClick={() => setShowAddModal(true)} className="text-white px-6 py-2 rounded-xl font-semibold transition-all hover:opacity-90 active:scale-95" style={{ backgroundColor: ACCENT_COLOR }}>Add selected</button>
                                    </div>
                                </div>
                            </div>
                            )}
                        </>
                    )}
                </div>

            </div>

            {/* Add-selected Modal */}
            {showAddModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center">
                    <div className="absolute inset-0 bg-black opacity-40" onClick={() => setShowAddModal(false)} />
                    <div role="dialog" aria-modal="true" className="relative w-full mx-4 bg-white rounded-2xl shadow-xl p-4" style={{ maxWidth: '28rem', maxHeight: '76vh', overflowY: 'auto' }}>
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="text-lg font-semibold">{t('Add selected')} À La Carte {t('items')}</h3>
                            <button onClick={() => setShowAddModal(false)} className="text-gray-500">{t('Close')}</button>
                        </div>
                        <div className="space-y-3 max-h-64 overflow-auto">
                            {selectedAlaCarte.map((t) => {
                                const item = alaCarteItems.find(i => i.title === t);
                                if (!item) return null;
                                return (
                                    <div key={t} className="flex items-center justify-between p-2 border-b border-gray-100">
                                        <div>
                                            <div className="font-medium">{item.title}</div>
                                            <div className="text-xs text-gray-500">{item.description}</div>
                                        </div>
                                        <div className="text-right">
                                            <div className="font-semibold">{formatPrice(item.priceMonthly, billingPeriod, ANNUAL_DISCOUNT)}</div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                        <div className="mt-4 flex items-center justify-between">
                            <div>
                                <div className="text-sm text-gray-600">{t('Items')}: {selectedAlaCarte.length}</div>
                                <div className="text-lg font-semibold">{t('Total')}: {formatPrice(selectedAlaCarte.reduce((sum, t) => {
                                    const item = alaCarteItems.find(it => it.title === t);
                                    return sum + (item ? item.priceMonthly : 0);
                                }, 0), billingPeriod, ANNUAL_DISCOUNT)}</div>
                            </div>
                            <div className="flex items-center space-x-3">
                                <button onClick={() => setShowAddModal(false)} className="px-4 py-2 rounded-xl border">{t('Cancel')}</button>
                                <button onClick={() => { setShowAddModal(false); setSelectedAlaCarte([]); }} className="px-4 py-2 rounded-xl bg-[var(--color-accent)] text-white">{t('Confirm Add')}</button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
            {/* Checkout Modal for Plans */}
            {showCheckoutModal && selectedPlan && (
                <div className="fixed inset-0 z-60 flex items-center justify-center">
                    <div className="absolute inset-0 bg-black opacity-40" onClick={() => setShowCheckoutModal(false)} />
                    <div role="dialog" aria-modal="true" className="relative w-full mx-4 bg-white rounded-2xl shadow-xl p-4" style={{ maxWidth: '40rem', maxHeight: '80vh', overflowY: 'auto' }}>
                        <div className="flex items-start justify-between mb-4">
                            <div>
                                <h3 className="text-lg font-semibold">Checkout — {selectedPlan.title}</h3>
                                <div className="text-sm text-gray-500">{t('Secure checkout — choose payment method')}</div>
                            </div>
                            <button onClick={() => setShowCheckoutModal(false)} className="text-gray-500">{t('Close')}</button>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div>
                                <div className="mb-3 font-medium">{t('Payment method')}</div>
                                <div className="space-y-2">
                                    <label className={`flex items-center p-3 rounded-lg border ${selectedPaymentMethod === 'card' ? 'border-[var(--color-accent)]' : 'border-gray-100'}`} style={selectedPaymentMethod === 'card' ? { backgroundColor: 'var(--color-accent-soft)' } : {}}>
                                        <input type="radio" name="pm" checked={selectedPaymentMethod === 'card'} onChange={() => setSelectedPaymentMethod('card')} className="mr-3" />
                                        <div>
                                            <div className="font-medium">{t('Credit / Debit Card')}</div>
                                            <div className="text-xs text-gray-500">{t('Visa, Mastercard, Amex')}</div>
                                        </div>
                                    </label>
                                    <label className={`flex items-center p-3 rounded-lg border ${selectedPaymentMethod === 'paypal' ? 'border-[var(--color-accent)]' : 'border-gray-100'}`} style={selectedPaymentMethod === 'paypal' ? { backgroundColor: 'var(--color-accent-soft)' } : {}}>
                                        <input type="radio" name="pm" checked={selectedPaymentMethod === 'paypal'} onChange={() => setSelectedPaymentMethod('paypal')} className="mr-3" />
                                        <div>
                                            <div className="font-medium">PayPal</div>
                                            <div className="text-xs text-gray-500">{t('Pay with your PayPal account')}</div>
                                        </div>
                                    </label>
                                    <label className={`flex items-center p-3 rounded-lg border ${selectedPaymentMethod === 'apple' ? 'border-[var(--color-accent)]' : 'border-gray-100'}`} style={selectedPaymentMethod === 'apple' ? { backgroundColor: 'var(--color-accent-soft)' } : {}}>
                                        <input type="radio" name="pm" checked={selectedPaymentMethod === 'apple'} onChange={() => setSelectedPaymentMethod('apple')} className="mr-3" />
                                        <div>
                                            <div className="font-medium">Apple Pay</div>
                                            <div className="text-xs text-gray-500">{t('Pay with Apple Pay')}</div>
                                        </div>
                                    </label>
                                    <label className={`flex items-center p-3 rounded-lg border ${selectedPaymentMethod === 'gpay' ? 'border-[var(--color-accent)]' : 'border-gray-100'}`} style={selectedPaymentMethod === 'gpay' ? { backgroundColor: 'var(--color-accent-soft)' } : {}}>
                                        <input type="radio" name="pm" checked={selectedPaymentMethod === 'gpay'} onChange={() => setSelectedPaymentMethod('gpay')} className="mr-3" />
                                        <div>
                                            <div className="font-medium">Google Pay</div>
                                            <div className="text-xs text-gray-500">{t('Pay with Google Pay')}</div>
                                        </div>
                                    </label>
                                </div>

                                {selectedPaymentMethod === 'card' && (
                                    <div className="mt-4 space-y-2">
                                        <div className="text-sm font-medium">{t('Card details (simulation)')}</div>
                                        <input className="w-full border border-gray-200 rounded p-2" placeholder={t('Card number')} />
                                        <div className="flex space-x-2">
                                            <input className="flex-1 border border-gray-200 rounded p-2" placeholder="MM/YY" />
                                            <input className="w-24 border border-gray-200 rounded p-2" placeholder="CVC" />
                                        </div>
                                        <input className="w-full border border-gray-200 rounded p-2" placeholder={t('Name on card')} />
                                    </div>
                                )}
                            </div>

                            <div>
                                <div className="mb-3 font-medium">{t('Order summary')}</div>
                                <div className="p-4 rounded-lg border border-gray-100 bg-gray-50">
                                    <div className="flex items-center justify-between mb-2">
                                        <div className="text-sm text-gray-700">{selectedPlan.title} ({billingPeriod === 'monthly' ? t('Monthly') : t('Annual')})</div>
                                        <div className="font-semibold">{billingPeriod === 'monthly' ? formatPrice(selectedPlan.priceMonthly) : formatPrice(selectedPlan.priceMonthly, 'annual', ANNUAL_DISCOUNT)}</div>
                                    </div>
                                    <div className="flex items-center justify-between text-sm text-gray-600">
                                        <div>{t('Subtotal')}</div>
                                        <div>{(() => {
                                            const subtotal = billingPeriod === 'monthly' ? selectedPlan.priceMonthly : selectedPlan.priceMonthly * 12;
                                            return `$${subtotal.toFixed(2)}`;
                                        })()}</div>
                                    </div>
                                    {billingPeriod === 'annual' && (
                                        <div className="flex items-center justify-between text-sm text-gray-600">
                                            <div>{t('Annual discount')}</div>
                                            <div>-{`$${(selectedPlan.priceMonthly * 12 * ANNUAL_DISCOUNT).toFixed(2)}`}</div>
                                        </div>
                                    )}
                                    <div className="flex items-center justify-between text-sm text-gray-600 mt-2">
                                        <div>{t('Tax')}</div>
                                        <div>{`$${( (billingPeriod === 'monthly' ? selectedPlan.priceMonthly : selectedPlan.priceMonthly * 12) * 0.07 ).toFixed(2)}`}</div>
                                    </div>
                                    <div className="border-t border-gray-200 mt-3 pt-3 flex items-center justify-between">
                                        <div className="font-medium">{t('Total')}</div>
                                        <div className="font-semibold text-lg">{(() => {
                                            const subtotal = billingPeriod === 'monthly' ? selectedPlan.priceMonthly : selectedPlan.priceMonthly * 12;
                                            const discount = billingPeriod === 'annual' ? selectedPlan.priceMonthly * 12 * ANNUAL_DISCOUNT : 0;
                                            const tax = (subtotal - discount) * 0.07;
                                            return `$${(subtotal - discount + tax).toFixed(2)}`;
                                        })()}</div>
                                    </div>
                                </div>

                                <div className="mt-4">
                                <button disabled={processingPayment} onClick={() => {
                                        setProcessingPayment(true);
                                        // simulate network/payment processing
                                        setTimeout(() => {
                                            setProcessingPayment(false);
                                            setShowCheckoutModal(false);
                                            setSelectedPlan(null);
                                            // show a simple success — for now use window.alert to simulate confirmation
                                            try { window.alert('Payment simulated — thank you!'); } catch (e) {}
                                        }, 1400);
                                    }} className="w-full bg-[var(--color-accent)] text-white py-3 rounded-xl font-semibold">{processingPayment ? t('Processing...') : t('Pay now')}</button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}
            {/* Bottom footer */}
            <BottomBar />
        </div>
    );
};

export default Sponsorships;
