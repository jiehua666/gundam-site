"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/lib/store";

interface SubscriptionTier {
  id: string;
  name: string;
  price: number;
  period: string;
  features: string[];
}

interface Subscription {
  id: string;
  tier: string;
  status: string;
  startAt: string;
  expireAt: string;
  autoRenew: boolean;
}

export default function SubscriptionPage() {
  const router = useRouter();
  const { user, isLoading: authLoading } = useAuthStore();
  const [isLoading, setIsLoading] = useState(true);
  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [currentTier, setCurrentTier] = useState<string>("free");
  const [remainingDays, setRemainingDays] = useState<number | null>(null);
  const [tiers, setTiers] = useState<Record<string, SubscriptionTier>>({});
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [processing, setProcessing] = useState<string | null>(null);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [selectedTier, setSelectedTier] = useState<string | null>(null);

  useEffect(() => {
    if (!authLoading && !user) {
      router.push("/login");
    } else if (user) {
      fetchSubscription();
    }
  }, [user, authLoading, router]);

  const fetchSubscription = async () => {
    try {
      const response = await fetch("/api/subscription");
      const data = await response.json();

      if (response.ok) {
        setSubscription(data.subscription);
        setCurrentTier(data.tier);
        setRemainingDays(data.remainingDays);
        setTiers(data.tiers);
      }
      setIsLoading(false);
    } catch {
      setMessage({ type: "error", text: "Failed to load subscription" });
      setIsLoading(false);
    }
  };

  const handleSubscribe = async (tierId: string) => {
    if (tierId === currentTier) {
      setMessage({ type: "error", text: "You are already on this tier" });
      return;
    }

    setSelectedTier(tierId);
    setShowPaymentModal(true);
  };

  const confirmPayment = async (paymentMethod: string) => {
    if (!selectedTier) return;

    setProcessing(paymentMethod);
    setShowPaymentModal(false);

    try {
      const response = await fetch("/api/subscription", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tier: selectedTier, paymentMethod }),
      });

      const data = await response.json();

      if (response.ok) {
        setSubscription(data.subscription);
        setCurrentTier(selectedTier);
        setMessage({ type: "success", text: "Subscription successful!" });
        // Refresh remaining days
        const subResponse = await fetch("/api/subscription");
        const subData = await subResponse.json();
        if (subResponse.ok) {
          setRemainingDays(subData.remainingDays);
        }
      } else {
        setMessage({ type: "error", text: data.error || "Subscription failed" });
      }
    } catch {
      setMessage({ type: "error", text: "Network error" });
    }

    setProcessing(null);
    setSelectedTier(null);
  };

  const handleCancel = async () => {
    if (!confirm("Are you sure you want to cancel your subscription?")) {
      return;
    }

    setProcessing("cancel");

    try {
      const response = await fetch("/api/subscription", {
        method: "DELETE",
      });

      const data = await response.json();

      if (response.ok) {
        setSubscription(null);
        setCurrentTier("free");
        setRemainingDays(null);
        setMessage({ type: "success", text: "Subscription cancelled" });
      } else {
        setMessage({ type: "error", text: data.error || "Failed to cancel" });
      }
    } catch {
      setMessage({ type: "error", text: "Network error" });
    }

    setProcessing(null);
  };

  if (authLoading || isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-zinc-50 dark:bg-black">
        <div className="text-zinc-600 dark:text-zinc-400">Loading...</div>
      </div>
    );
  }

  const tierList = Object.values(tiers);

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-black py-12 px-4">
      <div className="max-w-5xl mx-auto">
        <h1 className="text-3xl font-bold text-zinc-900 dark:text-zinc-50 mb-4 text-center">
          Subscription Plans
        </h1>
        <p className="text-zinc-600 dark:text-zinc-400 text-center mb-8">
          Choose the plan that best fits your needs
        </p>

        {/* Current Status */}
        {currentTier !== "free" && subscription && (
          <div className="bg-gradient-to-r from-violet-600 to-indigo-600 rounded-lg p-6 mb-8 text-white">
            <div className="flex flex-wrap justify-between items-center gap-4">
              <div>
                <p className="text-sm opacity-80">Current Plan</p>
                <p className="text-2xl font-bold">{tiers[currentTier]?.name || currentTier}</p>
                <p className="text-sm opacity-80 mt-1">
                  {remainingDays !== null && remainingDays > 0
                    ? `${remainingDays} days remaining`
                    : "Expires soon"}
                </p>
              </div>
              <div className="flex gap-3">
                <button
                  onClick={() => handleSubscribe(currentTier)}
                  disabled={processing !== null}
                  className="px-4 py-2 bg-white/20 hover:bg-white/30 rounded-lg transition text-sm"
                >
                  Renew
                </button>
                <button
                  onClick={handleCancel}
                  disabled={processing !== null}
                  className="px-4 py-2 bg-white/10 hover:bg-white/20 rounded-lg transition text-sm"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Message */}
        {message && (
          <div
            className={`p-4 rounded-lg mb-8 ${
              message.type === "success"
                ? "bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-400"
                : "bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400"
            }`}
          >
            {message.text}
          </div>
        )}

        {/* Processing Overlay */}
        {processing && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <div className="bg-white dark:bg-zinc-800 rounded-lg p-6 text-center">
              <div className="animate-spin w-8 h-8 border-4 border-violet-600 border-t-transparent rounded-full mx-auto mb-4" />
              <p className="text-zinc-700 dark:text-zinc-300">
                {processing === "cancel" ? "Cancelling..." : "Processing payment..."}
              </p>
            </div>
          </div>
        )}

        {/* Tier Cards */}
        <div className="grid md:grid-cols-3 gap-6">
          {tierList.map((tier) => {
            const isCurrentTier = currentTier === tier.id;
            const isUpgrade = !isCurrentTier && tier.price > (tiers[currentTier]?.price || 0);

            return (
              <div
                key={tier.id}
                className={`bg-white dark:bg-zinc-900 rounded-xl shadow-lg overflow-hidden border-2 transition ${
                  isCurrentTier
                    ? "border-violet-600"
                    : "border-transparent hover:border-zinc-300 dark:hover:border-zinc-700"
                }`}
              >
                {isCurrentTier && (
                  <div className="bg-violet-600 text-white text-center py-1 text-sm font-medium">
                    Current Plan
                  </div>
                )}
                <div className="p-6">
                  <h3 className="text-xl font-bold text-zinc-900 dark:text-zinc-100 mb-2">
                    {tier.name}
                  </h3>
                  <div className="mb-4">
                    <span className="text-3xl font-bold text-zinc-900 dark:text-zinc-100">
                      ¥{tier.price}
                    </span>
                    <span className="text-zinc-500 dark:text-zinc-400">/{tier.period}</span>
                  </div>

                  <ul className="space-y-2 mb-6">
                    {tier.features.map((feature, index) => (
                      <li key={index} className="flex items-start gap-2 text-sm text-zinc-600 dark:text-zinc-400">
                        <svg className="w-5 h-5 text-green-500 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                        {feature}
                      </li>
                    ))}
                  </ul>

                  <button
                    onClick={() => handleSubscribe(tier.id)}
                    disabled={isCurrentTier || processing !== null}
                    className={`w-full py-3 rounded-lg font-medium transition ${
                      isCurrentTier
                        ? "bg-zinc-200 dark:bg-zinc-700 text-zinc-500 dark:text-zinc-400 cursor-not-allowed"
                        : isUpgrade
                        ? "bg-violet-600 hover:bg-violet-700 text-white"
                        : "bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 text-zinc-900 dark:text-zinc-100"
                    }`}
                  >
                    {isCurrentTier ? "Current Plan" : isUpgrade ? "Upgrade" : "Subscribe"}
                  </button>
                </div>
              </div>
            );
          })}
        </div>

        {/* Payment Modal */}
        {showPaymentModal && selectedTier && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white dark:bg-zinc-800 rounded-xl p-6 max-w-sm w-full">
              <h3 className="text-xl font-bold text-zinc-900 dark:text-zinc-100 mb-4">
                Complete Payment
              </h3>
              <p className="text-zinc-600 dark:text-zinc-400 mb-6">
                You are subscribing to <strong>{tiers[selectedTier]?.name}</strong> for{" "}
                <strong>¥{tiers[selectedTier]?.price}</strong>
              </p>

              <div className="space-y-3">
                <button
                  onClick={() => confirmPayment("wechat")}
                  className="w-full py-3 bg-green-600 hover:bg-green-700 text-white rounded-lg font-medium transition flex items-center justify-center gap-2"
                >
                  <span>WeChat Pay</span>
                </button>
                <button
                  onClick={() => confirmPayment("alipay")}
                  className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition flex items-center justify-center gap-2"
                >
                  <span>Alipay</span>
                </button>
                <button
                  onClick={() => confirmPayment("mock")}
                  className="w-full py-3 bg-zinc-600 hover:bg-zinc-700 text-white rounded-lg font-medium transition flex items-center justify-center gap-2"
                >
                  <span>Mock Payment (Test)</span>
                </button>
              </div>

              <button
                onClick={() => {
                  setShowPaymentModal(false);
                  setSelectedTier(null);
                }}
                className="w-full mt-4 py-2 text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 transition"
              >
                Cancel
              </button>
            </div>
          </div>
        )}

        {/* Reissue Card Info */}
        <div className="mt-12 bg-white dark:bg-zinc-900 rounded-xl p-6">
          <h2 className="text-xl font-bold text-zinc-900 dark:text-zinc-100 mb-4">
            Reissue Cards
          </h2>
          <p className="text-zinc-600 dark:text-zinc-400 text-sm mb-4">
            Missed a check-in? Use a reissue card to backfill the date and maintain your streak!
          </p>
          <div className="flex items-center gap-2 text-sm text-zinc-500 dark:text-zinc-400">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            Reissue cards can be earned through check-in streaks and special events.
          </div>
        </div>
      </div>
    </div>
  );
}
