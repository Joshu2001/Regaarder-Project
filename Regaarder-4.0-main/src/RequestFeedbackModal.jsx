import React, { useState } from 'react';
import { Star, X, Send } from 'lucide-react';

const RequestFeedbackModal = ({ 
  isOpen, 
  onClose, 
  requestId, 
  requestTitle, 
  userRole = 'requester',
  onSubmitSuccess 
}) => {
  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [feedbackText, setFeedbackText] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  const roleLabel = userRole === 'creator' ? 'Creator' : 'Requester';
  const roleColor = userRole === 'creator' ? '#3b82f6' : '#10b981';

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (rating === 0) {
      setError('Please select a rating');
      return;
    }

    setIsSubmitting(true);
    setError('');

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`http://localhost:4000/requests/${requestId}/feedback`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          rating,
          feedbackText: feedbackText.trim(),
          feedbackType: 'general'
        })
      });

      if (!response.ok) {
        throw new Error('Failed to submit feedback');
      }

      onSubmitSuccess && onSubmitSuccess();
      setRating(0);
      setFeedbackText('');
      onClose();
    } catch (err) {
      setError(err.message || 'Failed to submit feedback');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  const ratingEmojis = ['😞', '😞', '😐', '😊', '😍'];
  const ratingLabels = ['Poor', 'Fair', 'Good', 'Great', 'Excellent'];

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(0,0,0,0.5)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 1000
    }}>
      <div style={{
        backgroundColor: 'white',
        borderRadius: '12px',
        padding: '24px',
        maxWidth: '500px',
        width: '90%',
        boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1)',
        animation: 'slideUp 0.3s ease-out'
      }}>
        {/* Header */}
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '20px'
        }}>
          <div>
            <h2 style={{
              margin: '0 0 4px 0',
              fontSize: '18px',
              fontWeight: '600',
              color: '#1f2937'
            }}>
              Share Your Experience
            </h2>
            <p style={{
              margin: 0,
              fontSize: '13px',
              color: '#6b7280'
            }}>
              Help us improve by sharing feedback about "{requestTitle}"
            </p>
          </div>
          <button
            onClick={onClose}
            style={{
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              padding: '4px'
            }}
          >
            <X size={20} color="#9ca3af" />
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          {/* Role Badge */}
          <div style={{
            display: 'inline-block',
            padding: '6px 12px',
            backgroundColor: roleColor + '20',
            borderRadius: '6px',
            marginBottom: '16px'
          }}>
            <span style={{
              fontSize: '12px',
              fontWeight: '600',
              color: roleColor,
              textTransform: 'uppercase'
            }}>
              Feedback as {roleLabel}
            </span>
          </div>

          {/* Rating Section */}
          <div style={{ marginBottom: '20px' }}>
            <label style={{
              display: 'block',
              fontSize: '14px',
              fontWeight: '600',
              marginBottom: '12px',
              color: '#1f2937'
            }}>
              How would you rate this experience? <span style={{ color: '#ef4444' }}>*</span>
            </label>
            
            <div style={{
              display: 'flex',
              gap: '12px',
              justifyContent: 'space-between'
            }}>
              {[1, 2, 3, 4, 5].map((value) => (
                <button
                  key={value}
                  type="button"
                  onClick={() => setRating(value)}
                  onMouseEnter={() => setHoverRating(value)}
                  onMouseLeave={() => setHoverRating(0)}
                  style={{
                    flex: 1,
                    padding: '12px 8px',
                    border: rating === value ? `2px solid ${roleColor}` : `2px solid #e5e7eb`,
                    backgroundColor: rating === value || hoverRating >= value ? roleColor + '15' : 'white',
                    borderRadius: '8px',
                    cursor: 'pointer',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    gap: '6px',
                    transition: 'all 0.2s ease'
                  }}
                >
                  <span style={{ fontSize: '24px' }}>
                    {ratingEmojis[value - 1]}
                  </span>
                  <span style={{
                    fontSize: '11px',
                    fontWeight: '600',
                    color: '#6b7280'
                  }}>
                    {ratingLabels[value - 1]}
                  </span>
                </button>
              ))}
            </div>
          </div>

          {/* Feedback Text */}
          <div style={{ marginBottom: '16px' }}>
            <label style={{
              display: 'block',
              fontSize: '14px',
              fontWeight: '600',
              marginBottom: '8px',
              color: '#1f2937'
            }}>
              What could we improve? <span style={{ color: '#9ca3af', fontWeight: '400' }}>(Optional)</span>
            </label>
            
            <textarea
              value={feedbackText}
              onChange={(e) => setFeedbackText(e.target.value)}
              placeholder="Share any challenges you faced or suggestions for improvement..."
              maxLength={200}
              style={{
                width: '100%',
                padding: '12px',
                border: '1px solid #e5e7eb',
                borderRadius: '8px',
                fontSize: '13px',
                fontFamily: 'inherit',
                resize: 'vertical',
                minHeight: '80px',
                boxSizing: 'border-box'
              }}
            />
            <p style={{
              fontSize: '12px',
              color: '#9ca3af',
              margin: '4px 0 0 0'
            }}>
              {feedbackText.length}/200
            </p>
          </div>

          {/* Error Message */}
          {error && (
            <div style={{
              padding: '10px 12px',
              backgroundColor: '#fee2e2',
              borderLeft: '4px solid #ef4444',
              borderRadius: '4px',
              marginBottom: '16px'
            }}>
              <p style={{
                margin: 0,
                fontSize: '13px',
                color: '#991b1b'
              }}>
                {error}
              </p>
            </div>
          )}

          {/* Buttons */}
          <div style={{
            display: 'flex',
            gap: '12px',
            justifyContent: 'flex-end'
          }}>
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              style={{
                padding: '10px 16px',
                border: '1px solid #e5e7eb',
                borderRadius: '6px',
                backgroundColor: '#f9fafb',
                color: '#374151',
                fontSize: '13px',
                fontWeight: '600',
                cursor: 'pointer',
                transition: 'all 0.2s ease',
                opacity: isSubmitting ? 0.6 : 1
              }}
            >
              Skip
            </button>
            <button
              type="submit"
              disabled={isSubmitting || rating === 0}
              style={{
                padding: '10px 16px',
                border: 'none',
                borderRadius: '6px',
                backgroundColor: roleColor,
                color: 'white',
                fontSize: '13px',
                fontWeight: '600',
                cursor: isSubmitting || rating === 0 ? 'not-allowed' : 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                opacity: isSubmitting || rating === 0 ? 0.6 : 1,
                transition: 'all 0.2s ease'
              }}
            >
              <Send size={14} />
              {isSubmitting ? 'Submitting...' : 'Submit Feedback'}
            </button>
          </div>
        </form>
      </div>

      <style>{`
        @keyframes slideUp {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
      `}</style>
    </div>
  );
};

export default RequestFeedbackModal;
