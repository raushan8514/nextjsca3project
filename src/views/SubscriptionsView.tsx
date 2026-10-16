import React, { useState, useEffect } from 'react';
import { SubscriptionPlan, Subscription } from '../types';
import { api } from '../lib/api';
import { useAuth } from '../context/AuthContext';
import { PaymentModal } from '../components/payment/PaymentModal';
import { CheckCircle2, ShieldCheck, CreditCard, Sparkles, AlertCircle } from 'lucide-react';

export const SubscriptionsView: React.FC = () => {
  const { user, subscription, openAuthModal } = useAuth();
  const [plans, setPlans] = useState<SubscriptionPlan[]>([]);
  const [selectedPlanForPayment, setSelectedPlanForPayment] = useState<SubscriptionPlan | null>(null);
  const [payments, setPayments] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchPlans = async () => {
    setIsLoading(true);
    try {
      const plansData = await api.getPlans();
      setPlans(plansData.plans);

      if (user) {
        const subData = await api.getCurrentSubscription();
        setPayments(subData.payments);
      }
    } catch (err) {
      console.error('Failed to load plans:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchPlans();
  }, [user]);

  const handleSelectPlan = (plan: SubscriptionPlan) => {
    if (!user) {
      openAuthModal('register');
      return;
    }
    if (plan.price_inr === 0) {
      return; // Already free
    }
    setSelectedPlanForPayment(plan);
  };

  if (isLoading) {
    return (
      <div className="py-24 text-center">
        <div className="w-8 h-8 border-2 border-purple-600 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
        <p className="text-xs text-slate-500">Loading subscription entitlements from server...</p>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-6 py-12 space-y-12">
      {/* Title */}
      <div className="text-center max-w-2xl mx-auto">
        <span className="text-xs font-semibold uppercase tracking-wider text-purple-700 block mb-1">
          Simple, Transparent Pricing
        </span>
        <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight mb-3">
          Elevate Your Language Mastery
        </h1>
        <p className="text-sm text-slate-600">
          Subscribe to unlock full 6-modality oral drills, advanced business curriculum, AI language tutoring, and verified academic credentials.
        </p>

        {/* Test Sandbox Callout */}
        <div className="inline-flex items-center gap-2 mt-4 px-3.5 py-1.5 bg-purple-50 text-purple-900 border border-purple-200 rounded-lg text-xs">
          <ShieldCheck className="w-4 h-4 text-purple-700" />
          <span>Razorpay Test Sandbox Mode Active · No real credit card charges occur</span>
        </div>
      </div>

      {/* Plan Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {plans.map((plan) => {
          const isCurrent = subscription?.plan_id === plan.id;
          const isPro = plan.id === 'plan_pro';

          return (
            <div
              key={plan.id}
              className={`bg-white rounded-2xl p-7 transition-all flex flex-col justify-between relative ${
                isPro
                  ? 'border-2 border-purple-600 shadow-xl'
                  : 'border border-slate-200 shadow-sm hover:border-slate-300'
              }`}
            >
              {isPro && (
                <span className="absolute -top-3.5 right-6 px-3 py-0.5 text-[10px] font-bold uppercase tracking-wider bg-purple-700 text-white rounded-full shadow-sm">
                  Most Popular
                </span>
              )}

              <div>
                <h3 className="text-lg font-bold text-slate-900 mb-1">{plan.name}</h3>
                <p className="text-xs text-slate-500 mb-6">
                  {plan.price_inr === 0 ? 'Foundational access' : 'Comprehensive fluency pass'}
                </p>

                <div className="mb-6 pb-6 border-b border-slate-100">
                  <span className="text-4xl font-extrabold text-slate-900 tabular-nums">
                    ₹{plan.price_inr}
                  </span>
                  <span className="text-xs text-slate-500"> / {plan.billing_cycle}</span>
                </div>

                <div className="space-y-3 mb-8">
                  <p className="text-xs font-semibold text-slate-700 uppercase tracking-wider">
                    Included Benefits:
                  </p>
                  {plan.features.map((feat, i) => (
                    <div key={i} className="flex items-start gap-2.5 text-xs text-slate-600">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                      <span>{feat}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div>
                {isCurrent ? (
                  <div className="w-full py-2.5 text-xs font-bold text-center text-purple-700 bg-purple-50 border border-purple-200 rounded-xl">
                    Active Current Plan
                  </div>
                ) : (
                  <button
                    onClick={() => handleSelectPlan(plan)}
                    disabled={plan.price_inr === 0}
                    className={`w-full py-2.5 text-xs font-bold rounded-xl transition-all shadow-sm ${
                      isPro
                        ? 'bg-purple-700 hover:bg-purple-800 text-white'
                        : 'bg-slate-900 hover:bg-slate-800 text-white'
                    } disabled:opacity-40 disabled:cursor-not-allowed`}
                  >
                    {plan.price_inr === 0 ? 'Included by Default' : `Subscribe for ₹${plan.price_inr}/mo`}
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Payment Invoices & Transaction History */}
      {user && payments.length > 0 && (
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs max-w-4xl mx-auto">
          <h3 className="text-sm font-bold text-slate-900 mb-4 flex items-center gap-2">
            <CreditCard className="w-4 h-4 text-purple-700" />
            <span>Authoritative Payment Records</span>
          </h3>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-500 uppercase tracking-wider border-b border-slate-200">
                <tr>
                  <th className="py-2.5 px-3">Order ID</th>
                  <th className="py-2.5 px-3">Amount</th>
                  <th className="py-2.5 px-3">Gateway</th>
                  <th className="py-2.5 px-3">Receipt</th>
                  <th className="py-2.5 px-3">Status</th>
                  <th className="py-2.5 px-3">Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {payments.map((p) => (
                  <tr key={p.id}>
                    <td className="py-2.5 px-3 font-mono text-slate-800">{p.order_id}</td>
                    <td className="py-2.5 px-3 font-bold text-slate-900 tabular-nums">₹{p.amount_inr}</td>
                    <td className="py-2.5 px-3 capitalize">{p.gateway}</td>
                    <td className="py-2.5 px-3 font-mono text-slate-500">{p.receipt_number}</td>
                    <td className="py-2.5 px-3">
                      <span className="px-2 py-0.5 text-[10px] font-bold rounded bg-emerald-100 text-emerald-800">
                        {p.status}
                      </span>
                    </td>
                    <td className="py-2.5 px-3 text-slate-500">
                      {new Date(p.created_at).toLocaleDateString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Payment Modal */}
      {selectedPlanForPayment && (
        <PaymentModal
          plan={selectedPlanForPayment}
          onClose={() => setSelectedPlanForPayment(null)}
          onSuccess={() => {
            setSelectedPlanForPayment(null);
            fetchPlans();
          }}
        />
      )}
    </div>
  );
};
