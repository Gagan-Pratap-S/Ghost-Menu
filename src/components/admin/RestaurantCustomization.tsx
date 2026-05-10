"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/context/AuthContext";

interface RestaurantSettings {
  // Branding
  name: string;
  description: string;
  logo?: string;
  primaryColor: string;
  secondaryColor: string;

  // Contact
  phone: string;
  email: string;
  website?: string;

  // Features
  enableOnlineOrdering: boolean;
  enableReservations: boolean;
  enableFeedback: boolean;
  enableAnalytics: boolean;

  // Customization
  customCss?: string;
  theme: "light" | "dark" | "auto";

  // Business Hours
  businessHours: {
    [key: string]: { open: string; close: string; closed: boolean };
  };

  // Social Media
  socialLinks: {
    facebook?: string;
    instagram?: string;
    twitter?: string;
  };
}

const DEFAULT_SETTINGS: RestaurantSettings = {
  name: "",
  description: "",
  primaryColor: "#FF7A00",
  secondaryColor: "#FFD7B5",
  phone: "",
  email: "",
  enableOnlineOrdering: true,
  enableReservations: false,
  enableFeedback: true,
  enableAnalytics: true,
  theme: "auto",
  businessHours: {
    monday: { open: "09:00", close: "22:00", closed: false },
    tuesday: { open: "09:00", close: "22:00", closed: false },
    wednesday: { open: "09:00", close: "22:00", closed: false },
    thursday: { open: "09:00", close: "22:00", closed: false },
    friday: { open: "09:00", close: "22:00", closed: false },
    saturday: { open: "09:00", close: "22:00", closed: false },
    sunday: { open: "09:00", close: "22:00", closed: false },
  },
  socialLinks: {},
};

export default function RestaurantCustomization() {
  const { restaurant } = useAuth();
  const [settings, setSettings] = useState<RestaurantSettings>(DEFAULT_SETTINGS);
  const [isSaving, setIsSaving] = useState(false);
  const [activeTab, setActiveTab] = useState<"branding" | "features" | "hours" | "contact">("branding");

  useEffect(() => {
    // Load settings from localStorage or API
    const saved = localStorage.getItem(`restaurant-settings-${restaurant?.id}`);
    if (saved) {
      try {
        setSettings({ ...DEFAULT_SETTINGS, ...JSON.parse(saved) });
      } catch (error) {
        console.error("Failed to load settings:", error);
      }
    }
  }, [restaurant?.id]);

  const saveSettings = async () => {
    setIsSaving(true);
    try {
      // In a real app, this would save to your backend
      localStorage.setItem(`restaurant-settings-${restaurant?.id}`, JSON.stringify(settings));

      // Apply theme changes immediately
      if (settings.theme !== "auto") {
        document.documentElement.setAttribute("data-theme", settings.theme);
      }

      // Apply custom CSS if provided
      if (settings.customCss) {
        const styleId = "restaurant-custom-css";
        let styleElement = document.getElementById(styleId) as HTMLStyleElement;
        if (!styleElement) {
          styleElement = document.createElement("style");
          styleElement.id = styleId;
          document.head.appendChild(styleElement);
        }
        styleElement.textContent = settings.customCss;
      }

      alert("Settings saved successfully!");
    } catch (error) {
      console.error("Failed to save settings:", error);
      alert("Failed to save settings. Please try again.");
    } finally {
      setIsSaving(false);
    }
  };

  const updateSetting = <K extends keyof RestaurantSettings>(
    key: K,
    value: RestaurantSettings[K]
  ) => {
    setSettings(prev => ({ ...prev, [key]: value }));
  };

  const updateBusinessHour = (day: string, field: "open" | "close" | "closed", value: string | boolean) => {
    setSettings(prev => ({
      ...prev,
      businessHours: {
        ...prev.businessHours,
        [day]: {
          ...prev.businessHours[day],
          [field]: value,
        },
      },
    }));
  };

  const tabs = [
    { key: "branding" as const, label: "Branding", icon: "🎨" },
    { key: "features" as const, label: "Features", icon: "⚙️" },
    { key: "hours" as const, label: "Hours", icon: "🕐" },
    { key: "contact" as const, label: "Contact", icon: "📞" },
  ];

  return (
    <div style={{ padding: "20px", maxWidth: 800, margin: "0 auto" }}>
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontSize: "var(--gm-font-page-title)", fontWeight: 600, margin: "0 0 8px" }}>
          Restaurant Customization
        </h1>
        <p style={{ fontSize: "var(--gm-font-label)", color: "var(--gm-text-secondary)", margin: 0 }}>
          Customize your restaurant's appearance and settings
        </p>
      </div>

      {/* Tab Navigation */}
      <div style={{ display: "flex", gap: 4, marginBottom: 24, borderBottom: "1px solid var(--gm-border)" }}>
        {tabs.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            style={{
              padding: "12px 16px",
              border: "none",
              background: activeTab === tab.key ? "var(--gm-primary)" : "transparent",
              color: activeTab === tab.key ? "white" : "var(--gm-text-secondary)",
              borderRadius: "8px 8px 0 0",
              fontSize: "var(--gm-font-label)",
              fontWeight: 500,
              cursor: "pointer",
              transition: "all 0.2s ease",
            }}
          >
            <span style={{ marginRight: 8 }}>{tab.icon}</span>
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <div className="gm-card" style={{ padding: 24 }}>
        {activeTab === "branding" && (
          <div>
            <h3 style={{ fontSize: "var(--gm-font-section-title)", fontWeight: 600, margin: "0 0 20px" }}>
              Branding & Appearance
            </h3>

            <div style={{ display: "grid", gap: 20 }}>
              <div>
                <label style={{ display: "block", fontSize: "var(--gm-font-label)", fontWeight: 500, marginBottom: 8 }}>
                  Restaurant Name
                </label>
                <input
                  type="text"
                  value={settings.name}
                  onChange={(e) => updateSetting("name", e.target.value)}
                  className="gm-input"
                  placeholder="Enter restaurant name"
                />
              </div>

              <div>
                <label style={{ display: "block", fontSize: "var(--gm-font-label)", fontWeight: 500, marginBottom: 8 }}>
                  Description
                </label>
                <textarea
                  value={settings.description}
                  onChange={(e) => updateSetting("description", e.target.value)}
                  className="gm-input"
                  placeholder="Brief description of your restaurant"
                  rows={3}
                />
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
                <div>
                  <label style={{ display: "block", fontSize: "var(--gm-font-label)", fontWeight: 500, marginBottom: 8 }}>
                    Primary Color
                  </label>
                  <div style={{ display: "flex", gap: 12 }}>
                    <input
                      type="color"
                      value={settings.primaryColor}
                      onChange={(e) => updateSetting("primaryColor", e.target.value)}
                      style={{ width: 60, height: 40, border: "none", borderRadius: 8, cursor: "pointer" }}
                    />
                    <input
                      type="text"
                      value={settings.primaryColor}
                      onChange={(e) => updateSetting("primaryColor", e.target.value)}
                      className="gm-input"
                      style={{ flex: 1 }}
                    />
                  </div>
                </div>

                <div>
                  <label style={{ display: "block", fontSize: "var(--gm-font-label)", fontWeight: 500, marginBottom: 8 }}>
                    Secondary Color
                  </label>
                  <div style={{ display: "flex", gap: 12 }}>
                    <input
                      type="color"
                      value={settings.secondaryColor}
                      onChange={(e) => updateSetting("secondaryColor", e.target.value)}
                      style={{ width: 60, height: 40, border: "none", borderRadius: 8, cursor: "pointer" }}
                    />
                    <input
                      type="text"
                      value={settings.secondaryColor}
                      onChange={(e) => updateSetting("secondaryColor", e.target.value)}
                      className="gm-input"
                      style={{ flex: 1 }}
                    />
                  </div>
                </div>
              </div>

              <div>
                <label style={{ display: "block", fontSize: "var(--gm-font-label)", fontWeight: 500, marginBottom: 8 }}>
                  Theme
                </label>
                <select
                  value={settings.theme}
                  onChange={(e) => updateSetting("theme", e.target.value as "light" | "dark" | "auto")}
                  className="gm-input"
                >
                  <option value="auto">Auto (System)</option>
                  <option value="light">Light</option>
                  <option value="dark">Dark</option>
                </select>
              </div>
            </div>
          </div>
        )}

        {activeTab === "features" && (
          <div>
            <h3 style={{ fontSize: "var(--gm-font-section-title)", fontWeight: 600, margin: "0 0 20px" }}>
              Feature Settings
            </h3>

            <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
              <ToggleSetting
                label="Online Ordering"
                description="Allow customers to place orders through the app"
                checked={settings.enableOnlineOrdering}
                onChange={(checked) => updateSetting("enableOnlineOrdering", checked)}
              />

              <ToggleSetting
                label="Reservations"
                description="Enable table reservation system"
                checked={settings.enableReservations}
                onChange={(checked) => updateSetting("enableReservations", checked)}
              />

              <ToggleSetting
                label="Customer Feedback"
                description="Allow customers to leave reviews and ratings"
                checked={settings.enableFeedback}
                onChange={(checked) => updateSetting("enableFeedback", checked)}
              />

              <ToggleSetting
                label="Analytics Tracking"
                description="Track customer behavior and app usage"
                checked={settings.enableAnalytics}
                onChange={(checked) => updateSetting("enableAnalytics", checked)}
              />
            </div>
          </div>
        )}

        {activeTab === "hours" && (
          <div>
            <h3 style={{ fontSize: "var(--gm-font-section-title)", fontWeight: 600, margin: "0 0 20px" }}>
              Business Hours
            </h3>

            <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
              {Object.entries(settings.businessHours).map(([day, hours]) => (
                <div key={day} style={{ display: "flex", alignItems: "center", gap: 16 }}>
                  <div style={{ width: 100, fontSize: "var(--gm-font-label)", fontWeight: 500, textTransform: "capitalize" }}>
                    {day}
                  </div>

                  <label style={{ display: "flex", alignItems: "center", gap: 8, cursor: "pointer" }}>
                    <input
                      type="checkbox"
                      checked={hours.closed}
                      onChange={(e) => updateBusinessHour(day, "closed", e.target.checked)}
                    />
                    <span style={{ fontSize: "var(--gm-font-caption)" }}>Closed</span>
                  </label>

                  {!hours.closed && (
                    <>
                      <input
                        type="time"
                        value={hours.open}
                        onChange={(e) => updateBusinessHour(day, "open", e.target.value)}
                        className="gm-input"
                        style={{ width: 120 }}
                      />
                      <span style={{ fontSize: "var(--gm-font-label)", color: "var(--gm-text-secondary)" }}>to</span>
                      <input
                        type="time"
                        value={hours.close}
                        onChange={(e) => updateBusinessHour(day, "close", e.target.value)}
                        className="gm-input"
                        style={{ width: 120 }}
                      />
                    </>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === "contact" && (
          <div>
            <h3 style={{ fontSize: "var(--gm-font-section-title)", fontWeight: 600, margin: "0 0 20px" }}>
              Contact Information
            </h3>

            <div style={{ display: "grid", gap: 20 }}>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
                <div>
                  <label style={{ display: "block", fontSize: "var(--gm-font-label)", fontWeight: 500, marginBottom: 8 }}>
                    Phone Number
                  </label>
                  <input
                    type="tel"
                    value={settings.phone}
                    onChange={(e) => updateSetting("phone", e.target.value)}
                    className="gm-input"
                    placeholder="+1 (555) 123-4567"
                  />
                </div>

                <div>
                  <label style={{ display: "block", fontSize: "var(--gm-font-label)", fontWeight: 500, marginBottom: 8 }}>
                    Email Address
                  </label>
                  <input
                    type="email"
                    value={settings.email}
                    onChange={(e) => updateSetting("email", e.target.value)}
                    className="gm-input"
                    placeholder="contact@restaurant.com"
                  />
                </div>
              </div>

              <div>
                <label style={{ display: "block", fontSize: "var(--gm-font-label)", fontWeight: 500, marginBottom: 8 }}>
                  Website (optional)
                </label>
                <input
                  type="url"
                  value={settings.website || ""}
                  onChange={(e) => updateSetting("website", e.target.value)}
                  className="gm-input"
                  placeholder="https://restaurant.com"
                />
              </div>

              <div>
                <label style={{ fontSize: "var(--gm-font-label)", fontWeight: 500, marginBottom: 12, display: "block" }}>
                  Social Media Links
                </label>

                <div style={{ display: "grid", gap: 12 }}>
                  <div>
                    <label style={{ display: "block", fontSize: "var(--gm-font-caption)", color: "var(--gm-text-secondary)", marginBottom: 4 }}>
                      Facebook
                    </label>
                    <input
                      type="url"
                      value={settings.socialLinks.facebook || ""}
                      onChange={(e) => updateSetting("socialLinks", { ...settings.socialLinks, facebook: e.target.value })}
                      className="gm-input"
                      placeholder="https://facebook.com/restaurant"
                    />
                  </div>

                  <div>
                    <label style={{ display: "block", fontSize: "var(--gm-font-caption)", color: "var(--gm-text-secondary)", marginBottom: 4 }}>
                      Instagram
                    </label>
                    <input
                      type="url"
                      value={settings.socialLinks.instagram || ""}
                      onChange={(e) => updateSetting("socialLinks", { ...settings.socialLinks, instagram: e.target.value })}
                      className="gm-input"
                      placeholder="https://instagram.com/restaurant"
                    />
                  </div>

                  <div>
                    <label style={{ display: "block", fontSize: "var(--gm-font-caption)", color: "var(--gm-text-secondary)", marginBottom: 4 }}>
                      Twitter
                    </label>
                    <input
                      type="url"
                      value={settings.socialLinks.twitter || ""}
                      onChange={(e) => updateSetting("socialLinks", { ...settings.socialLinks, twitter: e.target.value })}
                      className="gm-input"
                      placeholder="https://twitter.com/restaurant"
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Save Button */}
      <div style={{ display: "flex", justifyContent: "flex-end", marginTop: 24 }}>
        <button
          onClick={saveSettings}
          className="gm-btn-primary"
          disabled={isSaving}
          style={{ minWidth: 120 }}
        >
          {isSaving ? "Saving..." : "Save Settings"}
        </button>
      </div>
    </div>
  );
}

function ToggleSetting({
  label,
  description,
  checked,
  onChange
}: {
  label: string;
  description: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
}) {
  return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "16px 0", borderBottom: "1px solid var(--gm-divider)" }}>
      <div>
        <div style={{ fontSize: "var(--gm-font-label)", fontWeight: 500, marginBottom: 4 }}>
          {label}
        </div>
        <div style={{ fontSize: "var(--gm-font-caption)", color: "var(--gm-text-secondary)" }}>
          {description}
        </div>
      </div>
      <label style={{ position: "relative", display: "inline-block", width: 50, height: 24 }}>
        <input
          type="checkbox"
          checked={checked}
          onChange={(e) => onChange(e.target.checked)}
          style={{ opacity: 0, width: 0, height: 0 }}
        />
        <span style={{
          position: "absolute",
          cursor: "pointer",
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: checked ? "var(--gm-primary)" : "var(--gm-border)",
          borderRadius: 24,
          transition: "background 0.3s ease",
        }}>
          <span style={{
            position: "absolute",
            content: '""',
            height: 18,
            width: 18,
            left: checked ? 28 : 3,
            bottom: 3,
            background: "white",
            borderRadius: "50%",
            transition: "left 0.3s ease",
            boxShadow: "0 2px 4px rgba(0,0,0,0.2)",
          }} />
        </span>
      </label>
    </div>
  );
}