import { X, CheckCircle } from 'lucide-react';
import { getTranslation } from './translations.js';

export default function FreeRequestSubmittedModal({ onClose, onBoostRequest, onInviteContributors, selectedLanguage }) {
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
          <div className="bg-green-100 p-3 rounded-full">
            <CheckCircle size={32} className="text-green-600" />
          </div>
        </div>

        {/* Title */}
        <h2 className="text-xl font-semibold text-gray-900 text-center mb-3">
          {getTranslation('Free Request Submitted', selectedLanguage)}
        </h2>

        {/* Body Text */}
        <p className="text-gray-600 text-sm text-center mb-6 leading-relaxed">
          {getTranslation('Free requests may take longer to reach creators, as paid requests are prioritized. To increase visibility, you can boost your request at any time or invite others to contribute.', selectedLanguage)}
        </p>

        {/* Primary CTA - Boost Request */}
        <button
          onClick={onBoostRequest}
          className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 rounded-lg mb-3 transition-colors"
        >
          {getTranslation('Boost Request', selectedLanguage)}
        </button>

        {/* Secondary CTA - Invite Contributors */}
        <button
          onClick={onInviteContributors}
          className="w-full bg-gray-100 hover:bg-gray-200 text-gray-900 font-semibold py-3 rounded-lg transition-colors"
        >
          {getTranslation('Invite Contributors', selectedLanguage)}
        </button>
      </div>
    </div>
  );
}
