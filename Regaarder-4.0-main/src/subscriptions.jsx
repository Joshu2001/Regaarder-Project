import React, { useState, useRef, useEffect } from 'react';
import { Home, FileText, Pencil, MoreHorizontal, Crown, Sparkles, ArrowRight, Check } from 'lucide-react';
import { getTranslation } from './translations.js';

const getCssVar = (name, fallback) => {
    try { 
        const v = getComputedStyle(document.documentElement).getPropertyValue(name); 
        return v ? v.trim() : fallback; 
    } catch (e) { 
        return fallback; 
    }
};

const ACCENT_COLOR = getCssVar('--color-accent', '#CA8A04');
const HIGHLIGHT_COLOR = getCssVar('--color-accent-soft', 'rgba(202, 138, 4, 0.12)');
const ICON_BACKGROUND = getCssVar('--color-gold-light-bg', 'rgba(202, 138, 4, 0.1)');

// Bottom navigation bar component
const BottomBar = () => {
    const [activeTab, setActiveTab] = useState(null);
    const navigatedRef = useRef(false);

    const tabs = [
        { name: 'Home', Icon: Home },
        { name: 'Requests', Icon: FileText },
        { name: 'Ideas', Icon: Pencil },
        { name: 'More', Icon: MoreHorizontal },
    ];

    const inactiveColor = 'rgb(107 114 128)';

    return (
        <div
            className="fixed bottom-0 left-0 right-0 border-t shadow-2xl z-10"
            style={{ 
                backgroundColor: 'rgba(255, 255, 255, 0.98)',
                borderTopColor: `rgba(var(--color-gold-rgb), 0.15)`,
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
                                    if (!navigatedRef.current) { 
                                        navigatedRef.current = true; 
                                        navigateToTab(tab.name); 
                                    }
                                }}
                                onTouchStart={() => {
                                    setActiveTab(tab.name);
                                    if (!navigatedRef.current) { 
                                        navigatedRef.current = true; 
                                        navigateToTab(tab.name); 
                                    }
                                }}
                                onClick={(e) => {
                                    if (navigatedRef.current) { 
                                        navigatedRef.current = false; 
                                        e.preventDefault(); 
                                        return; 
                                    }
                                    setActiveTab(tab.name);
                                    navigateToTab(tab.name);
                                }}
                            >
                                <div className="w-11 h-11 flex items-center justify-center">
                                    <tab.Icon className="w-5 h-5" strokeWidth={1.5} style={activeColorStyle} />
                                </div>
                                <span className={`text-[11px] md:text-xs mt-0 leading-none ${textWeight}`} style={activeColorStyle}>
                                    {tab.name}
                                </span>
                            </button>
                        </div>
                    );
                })}
            </div>
        </div>
    );
};

const Subscriptions = () => {
    const [currentPlan, setCurrentPlan] = useState(null);
    const [planDetails, setPlanDetails] = useState(null);
    const [loading, setLoading] = useState(true);
    const [userPlan, setUserPlan] = useState(null);
    const [selectedLanguage, setSelectedLanguage] = useState(() => (typeof window !== 'undefined' ? localStorage.getItem('regaarder_language') : 'English') || 'English');

    useEffect(() => {
        const handleLanguageChange = () => {
            setSelectedLanguage(localStorage.getItem('regaarder_language') || 'English');
        };
        window.addEventListener('storage', handleLanguageChange);
        return () => window.removeEventListener('storage', handleLanguageChange);
    }, []);

    const t = (key) => getTranslation(key, selectedLanguage);

    useEffect(() => {
        // Fetch current user plan from backend
        const fetchUserPlan = async () => {
            try {
                const token = localStorage.getItem('regaarder_token');
                if (!token) {
                    setLoading(false);
                    return;
                }

                const response = await fetch('http://localhost:4000/users/me', {
                    headers: { 'Authorization': `Bearer ${token}` }
                });
                
                if (response.ok) {
                    const data = await response.json();
                    setUserPlan(data.user);
                    // Check if user has a subscription
                    if (data.user.userPlan) {
                        setCurrentPlan(data.user.userPlan);
                    }
                }
            } catch (err) {
                console.error('Error fetching user plan:', err);
            } finally {
                setLoading(false);
            }
        };

        fetchUserPlan();
    }, []);

    const handleUpgrade = () => {
        try {
            window.location.href = '/sponsorship.jsx';
        } catch (e) {
            console.warn('Navigation failed', e);
        }
    };

    // Define plan details for display
    const planDetailsMap = {
        'starter': {
            name: t('Starter (Free)'),
            price: '$0/month',
            color: '#6B7280',
            features: [
                t('1 active free request at a time'),
                t('Max 3 paid requests active at a time'),
                t('Max $150 total value for paid requests'),
                t('Invite contributors (viral growth)'),
                t('Maximum video quality: 360p')
            ]
        },
        'pro': {
            name: t('Pro'),
            price: '$8.24/month',
            color: ACCENT_COLOR,
            badge: t('FLASH DEAL -45% OFF'),
            features: [
                t('Unlimited free requests (with decay)'),
                t('Up to 5 active paid requests'),
                t('No hard cap on request value'),
                t('Target specific creators'),
                t('Boosting available'),
                t('Contributor pooling enabled'),
                t('Priority visibility (slower decay)'),
                t('Repost faster after no response'),
                t('Priority creator matching'),
                t('No ads'),
                t('Faster request response')
            ]
        },
        'starterCreator': {
            name: t('Starter Creator'),
            price: '$0/month',
            color: '#10B981',
            features: [
                t('Max 3 paid requests per day'),
                t('Daily paid value cap: $150–$200'),
                t('Unlimited free requests (optional)'),
                t('Standard visibility in feed'),
                t('Standard response window'),
                t('Creator dashboard & monetization')
            ]
        },
        'proCreator': {
            name: t('Pro Creator'),
            price: '$14.99/month',
            color: ACCENT_COLOR,
            badge: t('BEST VALUE'),
            features: [
                t('All in Starter Creator'),
                t('Up to 15 paid requests per day'),
                t('No daily value cap'),
                t('High-value requests unlocked'),
                t('Targeted requests with priority access'),
                t('Boosted requests with priority'),
                t('Queue management (accept/defer)'),
                t('Higher algorithmic trust weight'),
                t('Add Merch links & other links in video'),
                t('Direct access to sponsors'),
                t('Priority support'),
                t('Up to 80% revenue share')
            ]
        }
    };

    return (
        <div className="min-h-screen text-gray-900" style={{ background: 'linear-gradient(135deg, rgba(var(--color-gold-rgb), 0.03) 0%, white 50%)' }}>
            <div className="max-w-md mx-auto px-4 pt-6 pb-28">

                {loading ? (
                    <div className="flex flex-col items-center justify-start text-center space-y-6 pt-8">
                        <div className="text-gray-500">Loading...</div>
                    </div>
                ) : currentPlan && planDetailsMap[currentPlan] ? (
                    // Display Current Plan
                    <div className="flex flex-col items-stretch text-center space-y-6 pt-8">
                        {(() => {
                            const plan = planDetailsMap[currentPlan];
                            return (
                                <>
                                    {/* Plan Card */}
                                    <div 
                                        className="rounded-2xl border-2 p-6 bg-white shadow-lg"
                                        style={{ borderColor: plan.color }}
                                    >
                                        {/* Badge */}
                                        {plan.badge && (
                                            <div 
                                                className="inline-block text-xs font-bold px-3 py-1.5 rounded-full text-white mb-4"
                                                style={{ backgroundColor: plan.color }}
                                            >
                                                {plan.badge}
                                            </div>
                                        )}

                                        {/* Plan Name */}
                                        <h2 className="text-2xl font-bold mb-2" style={{ color: plan.color }}>
                                            {plan.name}
                                        </h2>

                                        {/* Price */}
                                        <div className="text-3xl font-bold mb-6" style={{ color: plan.color }}>
                                            {plan.price}
                                        </div>

                                        {/* Features List */}
                                        <div className="text-left space-y-2 mb-6">
                                            {plan.features.map((feature, idx) => (
                                                <div key={idx} className="flex items-start space-x-3">
                                                    <Check className="w-5 h-5 flex-shrink-0 mt-0.5" style={{ color: plan.color }} />
                                                    <span className="text-sm text-gray-700">{feature}</span>
                                                </div>
                                            ))}
                                        </div>

                                        {/* Manage Subscription CTA */}
                                        <button 
                                            onClick={handleUpgrade}
                                            className="w-full py-3 rounded-xl text-white font-semibold transition-all hover:opacity-90"
                                            style={{ backgroundColor: plan.color }}
                                        >
                                            {t('Manage Subscription')}
                                        </button>
                                    </div>

                                    {/* Upgrade/Downgrade Info */}
                                    <div 
                                        className="p-4 rounded-xl text-sm"
                                        style={{ backgroundColor: HIGHLIGHT_COLOR }}
                                    >
                                        <p className="text-gray-700">
                                            {t('Want to upgrade or change your plan? Visit the upgrade page to explore all available plans.')}
                                        </p>
                                    </div>
                                </>
                            );
                        })()}
                    </div>
                ) : (
                    // Empty State
                    <div className="flex flex-col items-center text-center space-y-6 pt-8">
                        
                        {/* Icon with gradient background */}
                        <div 
                            className="w-24 h-24 rounded-2xl flex items-center justify-center"
                            style={{
                                background: `linear-gradient(135deg, ${HIGHLIGHT_COLOR} 0%, rgba(255,255,255,0.3) 100%)`,
                                boxShadow: '0 4px 12px rgba(203,138,0,0.1)'
                            }}
                        >
                            <Crown className="w-12 h-12" style={{ color: ACCENT_COLOR }} />
                        </div>
                        
                        {/* Main Empty State Text */}
                        <div className="space-y-2">
                            <h2 className="text-xl font-bold text-gray-800">
                                {t('No Active Subscription')}
                            </h2>
                            <p className="text-sm text-gray-500 max-w-xs mx-auto leading-relaxed">
                                {t('You haven\'t upgraded your plan yet. Unlock premium features and exclusive benefits!')}
                            </p>
                        </div>

                        {/* Benefits Preview */}
                        <div className="w-full max-w-sm space-y-3 pt-4">
                            <div className="flex items-start space-x-3 p-3 rounded-xl" style={{ backgroundColor: HIGHLIGHT_COLOR }}>
                                <div 
                                    className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
                                    style={{ backgroundColor: ICON_BACKGROUND }}
                                >
                                    <Sparkles className="w-4 h-4" style={{ color: ACCENT_COLOR }} />
                                </div>
                                <div className="text-left">
                                    <p className="text-sm font-semibold text-gray-800">{t('Premium Content')}</p>
                                    <p className="text-xs text-gray-500">{t('Access exclusive videos and features')}</p>
                                </div>
                            </div>

                            <div className="flex items-start space-x-3 p-3 rounded-xl" style={{ backgroundColor: HIGHLIGHT_COLOR }}>
                                <div 
                                    className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
                                    style={{ backgroundColor: ICON_BACKGROUND }}
                                >
                                    <Crown className="w-4 h-4" style={{ color: ACCENT_COLOR }} />
                                </div>
                                <div className="text-left">
                                    <p className="text-sm font-semibold text-gray-800">{t('Priority Support')}</p>
                                    <p className="text-xs text-gray-500">{t('Get help faster with 24/7 priority support')}</p>
                                </div>
                            </div>

                            <div className="flex items-start space-x-3 p-3 rounded-xl" style={{ backgroundColor: HIGHLIGHT_COLOR }}>
                                <div 
                                    className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
                                    style={{ backgroundColor: ICON_BACKGROUND }}
                                >
                                    <FileText className="w-4 h-4" style={{ color: ACCENT_COLOR }} />
                                </div>
                                <div className="text-left">
                                    <p className="text-sm font-semibold text-gray-800">{t('Unlimited Requests')}</p>
                                    <p className="text-xs text-gray-500">{t('Request as many videos as you want')}</p>
                                </div>
                            </div>
                        </div>

                        {/* CTA Button */}
                        <div className="pt-6 w-full max-w-sm">
                            <button 
                                onClick={handleUpgrade}
                                className="w-full py-4 rounded-xl text-white font-semibold text-base transition-all hover:opacity-90 shadow-lg flex items-center justify-center space-x-2"
                                style={{ 
                                    backgroundColor: ACCENT_COLOR,
                                    boxShadow: `0 4px 12px rgba(203, 138, 0, 0.3)`
                                }}
                            >
                                <Crown className="w-5 h-5" />
                                <span>{t('Upgrade Your Plan')}</span>
                            </button>
                            
                            <p className="text-xs text-gray-400 mt-3">
                                {t('Start your premium journey today')}
                            </p>
                        </div>
                    </div>
                )}
            </div>

            {/* Bottom Navigation Bar */}
            <BottomBar />
        </div>
    );
};

export default Subscriptions;
