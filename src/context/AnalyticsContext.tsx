"use client";

import { createContext, useContext, useCallback, ReactNode } from "react";

// Analytics event types
export interface AnalyticsEvent {
  event: string;
  category: string;
  action: string;
  label?: string;
  value?: number;
  metadata?: Record<string, any>;
  timestamp: number;
  sessionId: string;
  userId?: string;
  restaurantId?: string;
}

// Analytics context interface
interface AnalyticsContextValue {
  trackEvent: (event: Omit<AnalyticsEvent, 'timestamp' | 'sessionId'>) => void;
  trackMenuView: (restaurantId: string, menuSlug: string) => void;
  trackItemView: (itemId: number, itemName: string, category: string) => void;
  trackItemAddToCart: (itemId: number, itemName: string, quantity: number, price: number) => void;
  trackOrderPlaced: (orderId: string, total: number, itemCount: number) => void;
  trackSearch: (query: string, resultCount: number) => void;
  trackCategoryFilter: (category: string) => void;
  trackFeedback: (rating: number, comment?: string) => void;
}

const AnalyticsContext = createContext<AnalyticsContextValue | null>(null);

// Generate session ID
const generateSessionId = () => {
  return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
};

// Get or create session ID
const getSessionId = () => {
  if (typeof window === 'undefined') return 'server';
  let sessionId = localStorage.getItem('ghost-menu-session-id');
  if (!sessionId) {
    sessionId = generateSessionId();
    localStorage.setItem('ghost-menu-session-id', sessionId);
  }
  return sessionId;
};

export function AnalyticsProvider({ children }: { children: ReactNode }) {
  const sessionId = getSessionId();

  const trackEvent = useCallback((eventData: Omit<AnalyticsEvent, 'timestamp' | 'sessionId'>) => {
    const event: AnalyticsEvent = {
      ...eventData,
      timestamp: Date.now(),
      sessionId,
    };

    // Store in localStorage for persistence (in production, send to analytics service)
    try {
      const events = JSON.parse(localStorage.getItem('ghost-menu-analytics') || '[]');
      events.push(event);

      // Keep only last 1000 events to prevent storage bloat
      if (events.length > 1000) {
        events.splice(0, events.length - 1000);
      }

      localStorage.setItem('ghost-menu-analytics', JSON.stringify(events));
    } catch (error) {
      console.warn('Failed to store analytics event:', error);
    }

    // In production, you would send to your analytics service here
    // Example: gtag('event', event.action, { event_category: event.category, ... })
    console.log('Analytics Event:', event);
  }, [sessionId]);

  const trackMenuView = useCallback((restaurantId: string, menuSlug: string) => {
    trackEvent({
      event: 'menu_view',
      category: 'engagement',
      action: 'view_menu',
      label: menuSlug,
      metadata: { restaurantId, menuSlug },
    });
  }, [trackEvent]);

  const trackItemView = useCallback((itemId: number, itemName: string, category: string) => {
    trackEvent({
      event: 'item_view',
      category: 'engagement',
      action: 'view_item',
      label: itemName,
      value: itemId,
      metadata: { itemId, itemName, category },
    });
  }, [trackEvent]);

  const trackItemAddToCart = useCallback((itemId: number, itemName: string, quantity: number, price: number) => {
    trackEvent({
      event: 'add_to_cart',
      category: 'ecommerce',
      action: 'add_item',
      label: itemName,
      value: itemId,
      metadata: { itemId, itemName, quantity, price, total: quantity * price },
    });
  }, [trackEvent]);

  const trackOrderPlaced = useCallback((orderId: string, total: number, itemCount: number) => {
    trackEvent({
      event: 'order_placed',
      category: 'ecommerce',
      action: 'place_order',
      label: orderId,
      value: Math.round(total * 100), // Convert to cents for analytics
      metadata: { orderId, total, itemCount },
    });
  }, [trackEvent]);

  const trackSearch = useCallback((query: string, resultCount: number) => {
    trackEvent({
      event: 'search',
      category: 'engagement',
      action: 'search_query',
      label: query,
      value: resultCount,
      metadata: { query, resultCount },
    });
  }, [trackEvent]);

  const trackCategoryFilter = useCallback((category: string) => {
    trackEvent({
      event: 'filter',
      category: 'engagement',
      action: 'filter_category',
      label: category,
      metadata: { category },
    });
  }, [trackEvent]);

  const trackFeedback = useCallback((rating: number, comment?: string) => {
    trackEvent({
      event: 'feedback',
      category: 'engagement',
      action: 'submit_feedback',
      label: `Rating: ${rating}`,
      value: rating,
      metadata: { rating, comment: comment || null },
    });
  }, [trackEvent]);

  return (
    <AnalyticsContext.Provider
      value={{
        trackEvent,
        trackMenuView,
        trackItemView,
        trackItemAddToCart,
        trackOrderPlaced,
        trackSearch,
        trackCategoryFilter,
        trackFeedback,
      }}
    >
      {children}
    </AnalyticsContext.Provider>
  );
}

export function useAnalytics() {
  const context = useContext(AnalyticsContext);
  if (!context) {
    throw new Error('useAnalytics must be used within an AnalyticsProvider');
  }
  return context;
}

// Utility function to get stored analytics data (for admin dashboard)
export function getStoredAnalytics(): AnalyticsEvent[] {
  if (typeof window === 'undefined') return [];
  try {
    return JSON.parse(localStorage.getItem('ghost-menu-analytics') || '[]');
  } catch {
    return [];
  }
}

// Utility function to clear old analytics data
export function clearOldAnalytics(daysOld: number = 30) {
  if (typeof window === 'undefined') return;
  try {
    const events = getStoredAnalytics();
    const cutoff = Date.now() - (daysOld * 24 * 60 * 60 * 1000);
    const filtered = events.filter(event => event.timestamp > cutoff);
    localStorage.setItem('ghost-menu-analytics', JSON.stringify(filtered));
  } catch (error) {
    console.warn('Failed to clear old analytics:', error);
  }
}