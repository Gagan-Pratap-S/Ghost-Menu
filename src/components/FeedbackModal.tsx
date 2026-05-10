"use client";

import { useState } from "react";
import { useAnalytics } from "@/context/AnalyticsContext";

interface FeedbackModalProps {
  isOpen: boolean;
  onClose: () => void;
  restaurantName?: string;
}

export function FeedbackModal({ isOpen, onClose, restaurantName }: FeedbackModalProps) {
  const [rating, setRating] = useState(0);
  const [hoveredRating, setHoveredRating] = useState(0);
  const [comment, setComment] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { trackFeedback } = useAnalytics();

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (rating === 0) return;

    setIsSubmitting(true);

    try {
      // Track feedback event
      trackFeedback(rating, comment.trim() || undefined);

      // In a real app, you would send this to your backend
      console.log("Feedback submitted:", { rating, comment: comment.trim() });

      // Reset form
      setRating(0);
      setComment("");
      onClose();

      // Show success message (you could add a toast notification here)
      alert("Thank you for your feedback!");
    } catch (error) {
      console.error("Failed to submit feedback:", error);
      alert("Failed to submit feedback. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const getRatingLabel = (rating: number) => {
    switch (rating) {
      case 1: return "Poor";
      case 2: return "Fair";
      case 3: return "Good";
      case 4: return "Very Good";
      case 5: return "Excellent";
      default: return "";
    }
  };

  return (
    <div
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        background: "rgba(0,0,0,0.5)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 1000,
        padding: 16,
      }}
      onClick={onClose}
    >
      <div
        className="gm-card"
        style={{
          maxWidth: 400,
          width: "100%",
          maxHeight: "90vh",
          overflow: "auto",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div style={{ padding: 24 }}>
          <div style={{ textAlign: "center", marginBottom: 24 }}>
            <h2 style={{ fontSize: "var(--gm-font-section-title)", fontWeight: 600, margin: "0 0 8px" }}>
              How was your experience?
            </h2>
            <p style={{ fontSize: "var(--gm-font-label)", color: "var(--gm-text-secondary)", margin: 0 }}>
              {restaurantName ? `at ${restaurantName}` : "with our service"}
            </p>
          </div>

          <form onSubmit={handleSubmit}>
            {/* Star Rating */}
            <div style={{ marginBottom: 24 }}>
              <div style={{ display: "flex", justifyContent: "center", gap: 8, marginBottom: 12 }}>
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    type="button"
                    onClick={() => setRating(star)}
                    onMouseEnter={() => setHoveredRating(star)}
                    onMouseLeave={() => setHoveredRating(0)}
                    style={{
                      background: "none",
                      border: "none",
                      cursor: "pointer",
                      fontSize: 32,
                      padding: 4,
                      transition: "transform 0.2s ease",
                    }}
                    onFocus={(e) => e.currentTarget.style.transform = "scale(1.1)"}
                    onBlur={(e) => e.currentTarget.style.transform = "scale(1)"}
                  >
                    <span
                      style={{
                        color: star <= (hoveredRating || rating) ? "#FFD700" : "var(--gm-border)",
                        filter: star <= (hoveredRating || rating) ? "drop-shadow(0 0 4px rgba(255,215,0,0.3))" : "none",
                        transition: "all 0.2s ease",
                      }}
                    >
                      ★
                    </span>
                  </button>
                ))}
              </div>
              {(rating > 0 || hoveredRating > 0) && (
                <div style={{
                  textAlign: "center",
                  fontSize: "var(--gm-font-label)",
                  fontWeight: 500,
                  color: "var(--gm-primary)"
                }}>
                  {getRatingLabel(hoveredRating || rating)}
                </div>
              )}
            </div>

            {/* Comment */}
            <div style={{ marginBottom: 24 }}>
              <label
                htmlFor="feedback-comment"
                style={{
                  display: "block",
                  fontSize: "var(--gm-font-label)",
                  fontWeight: 500,
                  marginBottom: 8,
                  color: "var(--gm-text)"
                }}
              >
                Comments (optional)
              </label>
              <textarea
                id="feedback-comment"
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                placeholder="Tell us what we could improve..."
                className="gm-input"
                style={{
                  minHeight: 80,
                  resize: "vertical",
                  fontFamily: "inherit",
                }}
                maxLength={500}
              />
              <div style={{
                fontSize: "var(--gm-font-caption)",
                color: "var(--gm-text-tertiary)",
                textAlign: "right",
                marginTop: 4
              }}>
                {comment.length}/500
              </div>
            </div>

            {/* Actions */}
            <div style={{ display: "flex", gap: 12 }}>
              <button
                type="button"
                onClick={onClose}
                className="gm-btn-ghost"
                style={{ flex: 1 }}
                disabled={isSubmitting}
              >
                Skip
              </button>
              <button
                type="submit"
                className="gm-btn-primary"
                style={{ flex: 1 }}
                disabled={rating === 0 || isSubmitting}
              >
                {isSubmitting ? "Submitting..." : "Submit Feedback"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

// Feedback trigger button component
interface FeedbackButtonProps {
  onClick: () => void;
  style?: React.CSSProperties;
}

export function FeedbackButton({ onClick, style }: FeedbackButtonProps) {
  return (
    <button
      onClick={onClick}
      className="gm-btn-ghost"
      style={{
        position: "fixed",
        bottom: "calc(var(--bottom-nav-height) + 16px)",
        right: 16,
        zIndex: 100,
        borderRadius: "50%",
        width: 56,
        height: 56,
        padding: 0,
        boxShadow: "var(--gm-shadow-lg)",
        ...style,
      }}
      aria-label="Give feedback"
      title="Give feedback"
    >
      <svg
        width="24"
        height="24"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
        <line x1="9" y1="9" x2="15" y2="9" />
        <line x1="9" y1="12" x2="15" y2="12" />
      </svg>
    </button>
  );
}