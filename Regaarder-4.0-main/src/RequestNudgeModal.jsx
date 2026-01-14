import { X, TrendingUp } from 'lucide-react';
import { getTranslation } from './translations.js';

export default function RequestNudgeModal({ onClose, onBoostRequest, onInviteFriends, selectedLanguage }) {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-[9999] flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 relative">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-gray-600"
          aria-label="Close"
        >
          <X size={24} />
        </button>

        {/* Icon */}
        <div className="flex justify-center mb-4">
          <div className="bg-amber-100 p-3 rounded-full">
            <TrendingUp size={32} className="text-amber-600" />
          </div>
        </div>

        {/* Title */}
        <h2 className="text-xl font-semibold text-gray-900 text-center mb-3">
          {getTranslation('Your Request Needs a Nudge', selectedLanguage)}
        </h2>

        {/* Body Text */}
        <p className="text-gray-600 text-sm text-center mb-6 leading-relaxed">
          {getTranslation('It looks like your request hasn\'t reached a creator yet. Free requests can get buried as new requests come in. Boosting your request increases visibility and response speed. Inviting others to contribute can also make it more attractive to creators.', selectedLanguage)}
        </p>

        {/* Primary CTA - Boost for Visibility */}
        <button
          onClick={onBoostRequest}
          className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 rounded-lg mb-3 transition-colors"
        >
          {getTranslation('Boost for Visibility', selectedLanguage)}
        </button>

        {/* Secondary CTA - Invite Friends to Contribute */}
        <button
          onClick={onInviteFriends}
          className="w-full bg-gray-100 hover:bg-gray-200 text-gray-900 font-semibold py-3 rounded-lg transition-colors"
        >
          {getTranslation('Invite Friends to Contribute', selectedLanguage)}
        </button>
      </div>
    </div>
  );
}
