import React, { useState } from 'react';
import { CampusEvent } from '../../types';
import { useApp } from '../../context/AppContext';
import {
  X,
  Star,
  MessageSquare,
  Sparkles,
  CheckCircle2
} from 'lucide-react';

interface FeedbackModalProps {
  event: CampusEvent;
  onClose: () => void;
}

export const FeedbackModal: React.FC<FeedbackModalProps> = ({ event, onClose }) => {
  const { submitFeedback } = useApp();

  const [rating, setRating] = useState(5);
  const [hoverRating, setHoverRating] = useState(0);
  const [comment, setComment] = useState('');
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!comment.trim()) {
      alert('Please add a few words about your experience.');
      return;
    }
    submitFeedback({
      eventId: event.id,
      rating,
      usefulnessRating: rating,
      organizationRating: rating,
      comments: comment,
      suggestions: ''
    });
    setSubmitted(true);
    setTimeout(() => {
      onClose();
    }, 1200);
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/75 backdrop-blur-sm flex items-center justify-center p-3 sm:p-6 animate-in fade-in">
      <div className="relative w-full max-w-lg bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden my-6">
        
        {/* Header */}
        <div className="p-5 bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="p-2 rounded-xl bg-indigo-600 text-white shadow-sm">
              <MessageSquare className="w-5 h-5" />
            </span>
            <div>
              <h2 className="text-base font-extrabold text-slate-900 dark:text-slate-100">
                Rate & Review Event
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                {event.title}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        {submitted ? (
          <div className="p-8 text-center space-y-3">
            <CheckCircle2 className="w-12 h-12 text-emerald-500 mx-auto animate-bounce" />
            <h3 className="text-base font-extrabold text-slate-900 dark:text-slate-100">
              Thank you for your feedback!
            </h3>
            <p className="text-xs text-slate-500">
              Your feedback helps organizers improve future campus workshops and sessions.
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="p-6 space-y-6">
            {/* Star selector */}
            <div className="text-center space-y-2">
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                Overall Experience Rating
              </label>
              <div className="flex items-center justify-center gap-2">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    type="button"
                    onClick={() => setRating(star)}
                    onMouseEnter={() => setHoverRating(star)}
                    onMouseLeave={() => setHoverRating(0)}
                    className="p-1 text-2xl transition-transform hover:scale-125 focus:outline-none"
                  >
                    <Star
                      className={`w-7 h-7 ${
                        (hoverRating || rating) >= star
                          ? 'text-amber-400 fill-amber-400'
                          : 'text-slate-300 dark:text-slate-700'
                      }`}
                    />
                  </button>
                ))}
              </div>
              <div className="text-xs font-semibold text-indigo-600 dark:text-indigo-400">
                {rating === 5 && '🌟 Outstanding & High Value!'}
                {rating === 4 && '👍 Great Workshop & Speaker!'}
                {rating === 3 && '👌 Good, Can be improved'}
                {rating === 2 && '👎 Average'}
                {rating === 1 && '⚠️ Needs significant improvement'}
              </div>
            </div>

            {/* Comment textarea */}
            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                What did you like the most? Any suggestions for the club?
              </label>
              <textarea
                rows={4}
                placeholder="Share your experience about hands-on coding, speaker clarity, organization..."
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                className="w-full bg-slate-50 dark:bg-slate-800 p-3 rounded-2xl border border-slate-300 dark:border-slate-700 text-xs text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-indigo-500 leading-relaxed"
                required
              />
            </div>

            {/* Submit */}
            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-xs font-semibold text-slate-600 dark:text-slate-400"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl shadow-md transition-colors"
              >
                Submit Feedback
              </button>
            </div>
          </form>
        )}

      </div>
    </div>
  );
};
