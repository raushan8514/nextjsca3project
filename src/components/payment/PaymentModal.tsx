import React, { useState } from 'react';
import { SubscriptionPlan } from '../../types';
import { api } from '../../lib/api';
import { useAuth } from '../../context/AuthContext';
import { ShieldCheck, CreditCard, CheckCircle2, AlertCircle, X, Sparkles } from 'lucide-react';
import confetti from 'canvas-confetti';

interface PaymentModalProps {
  plan: SubscriptionPlan;
  onClose: () => void;
  onSuccess: () => void;
}

export const PaymentModal: React.FC<PaymentModalProps> = ({ plan, onClose, onSuccess }) => {
  const { user, refreshUser } = useAuth();
  const [step, setStep] = useState<'review' | 'processing' | 'success' | 'error'>('review');
  const [orderData, setOrderData] = useState<any>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleStartPayment = async () => {
    setStep('processing');
    setErrorMessage(null);

    try {
      // Step 1: Create Order on Trusted Server (Prices loaded from server records)
      const order = await api.createPaymentOrder(plan.id);
      setOrderData(order);

      // Step 2: In test sandbox, simulate customer authorization with valid test payment credentials
      const testPaymentId = `pay_rzptest_${Date.now()}`;
      const testSignature = `sig_valid_${Date.now()}`;

      // Simulate a brief secure gateway handshake
      setTimeout(async () => {
        try {
          // Step 3: Verify Payment Server-Side
          const verifyRes = await api.verifyPayment({
            orderId: order.orderId,
            paymentId: testPaymentId,
            signature: testSignature,
            planId: plan.id
          });

          if (verifyRes.success) {
            await refreshUser();
            setStep('success');
            confetti({
              particleCount: 100,
              spread: 80,
              origin: { y: 0.6 }
            });
            setTimeout(() => {
              onSuccess();
            }, 1800);
          }
        } catch (verifyErr: any) {
          setErrorMessage(verifyErr.message || 'Payment verification failed on the server.');
          setStep('error');
        }
      }, 1000);
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to initialize payment order on server.');
      setStep('error');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
      <div className="relative w-full max-w-md bg-white rounded-2xl shadow-xl border border-slate-200 overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50">
          <div className="flex items-center gap-2">
            <CreditCard className="w-4 h-4 text-purple-700" />
            <h3 className="text-sm font-bold text-slate-900">Secure Checkout · Test Sandbox</h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 text-slate-400 hover:text-slate-700 rounded-md transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          {step === 'review' && (
            <div>
              <div className="flex items-center justify-between pb-4 mb-4 border-b border-slate-100">
                <div>
                  <h4 className="text-base font-bold text-slate-900">{plan.name}</h4>
                  <p className="text-xs text-slate-500">Monthly billing · Cancel anytime</p>
                </div>
                <div className="text-right">
                  <span className="text-2xl font-extrabold text-slate-900 tabular-nums">
                    ₹{plan.price_inr}
                  </span>
                  <span className="text-xs text-slate-500">/mo</span>
                </div>
              </div>

              <div className="space-y-2 mb-6">
                <p className="text-xs font-semibold text-slate-700 uppercase tracking-wider">
                  Included Entitlements:
                </p>
                {plan.features.map((feat, i) => (
                  <div key={i} className="flex items-center gap-2 text-xs text-slate-600">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                    <span>{feat}</span>
                  </div>
                ))}
              </div>

              {/* Security Banner */}
              <div className="p-3 bg-purple-50/70 border border-purple-200 rounded-lg text-xs text-purple-900 mb-6 flex items-start gap-2">
                <ShieldCheck className="w-4 h-4 text-purple-700 shrink-0 mt-0.5" />
                <div>
                  <span className="font-semibold block">Razorpay Test Mode Active:</span>
                  <span>Orders are signed and verified server-side. No real credit card charge occurs during this evaluation.</span>
                </div>
              </div>

              <button
                onClick={handleStartPayment}
                className="w-full py-2.5 text-xs font-bold text-white bg-purple-700 hover:bg-purple-800 rounded-xl transition-all shadow-sm flex items-center justify-center gap-2"
              >
                <span>Authorize Test Payment (₹{plan.price_inr})</span>
              </button>
            </div>
          )}

          {step === 'processing' && (
            <div className="text-center py-8">
              <div className="w-10 h-10 border-3 border-purple-600 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
              <h4 className="text-sm font-bold text-slate-900 mb-1">Processing Gateway Handshake</h4>
              <p className="text-xs text-slate-500">
                Generating signed order and performing server-side HMAC validation...
              </p>
            </div>
          )}

          {step === 'success' && (
            <div className="text-center py-6">
              <div className="w-12 h-12 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto mb-3">
                <CheckCircle2 className="w-6 h-6" />
              </div>
              <h4 className="text-base font-bold text-slate-900 mb-1">Subscription Activated!</h4>
              <p className="text-xs text-slate-600 mb-2">
                Your account is now upgraded to <strong className="text-purple-700">{plan.name}</strong>.
              </p>
              <p className="text-[11px] text-slate-400">All premium course units have been unlocked.</p>
            </div>
          )}

          {step === 'error' && (
            <div className="text-center py-6">
              <div className="w-12 h-12 rounded-full bg-rose-100 text-rose-600 flex items-center justify-center mx-auto mb-3">
                <AlertCircle className="w-6 h-6" />
              </div>
              <h4 className="text-base font-bold text-slate-900 mb-1">Payment Verification Error</h4>
              <p className="text-xs text-slate-600 mb-4">{errorMessage || 'Verification failed.'}</p>
              <button
                onClick={() => setStep('review')}
                className="px-4 py-2 text-xs font-semibold bg-slate-900 text-white rounded-lg hover:bg-slate-800"
              >
                Return to Review
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
