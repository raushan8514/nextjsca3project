import React from 'react';
import { Certificate } from '../../types';
import { Award, Printer, CheckCircle2, ShieldCheck, X, ExternalLink } from 'lucide-react';

interface CertificateModalProps {
  certificate: Certificate;
  onClose: () => void;
  onNavigateToVerify?: (certId: string) => void;
}

export const CertificateModal: React.FC<CertificateModalProps> = ({
  certificate,
  onClose,
  onNavigateToVerify
}) => {
  const handlePrint = () => {
    window.print();
  };

  const formattedDate = new Date(certificate.issue_date).toLocaleDateString('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric'
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm overflow-y-auto">
      <div className="relative w-full max-w-3xl bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden my-8">
        {/* Top Action Bar (hidden in print) */}
        <div className="print:hidden flex items-center justify-between px-6 py-3.5 bg-slate-900 text-white">
          <div className="flex items-center gap-2 text-xs font-semibold">
            <Award className="w-4 h-4 text-purple-400" />
            <span>Official Academic Certificate of Completion</span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="px-3 py-1.5 text-xs font-medium bg-purple-700 hover:bg-purple-600 text-white rounded-lg flex items-center gap-1.5 transition-colors"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Print / Save PDF</span>
            </button>
            <button
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-white rounded-lg transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Printable Certificate Frame */}
        <div className="p-8 sm:p-12 text-center bg-radial from-white via-slate-50 to-slate-100 border-[12px] border-double border-slate-300 relative print:m-0 print:border-none print:p-8">
          {/* Decorative Corner Ornaments */}
          <div className="absolute top-4 left-4 text-slate-300 text-2xl font-serif">❖</div>
          <div className="absolute top-4 right-4 text-slate-300 text-2xl font-serif">❖</div>
          <div className="absolute bottom-4 left-4 text-slate-300 text-2xl font-serif">❖</div>
          <div className="absolute bottom-4 right-4 text-slate-300 text-2xl font-serif">❖</div>

          {/* Certificate Header */}
          <div className="mb-6">
            <div className="w-12 h-12 mx-auto rounded-xl bg-purple-700 text-white flex items-center justify-center font-bold text-xl mb-3 shadow-md">
              L
            </div>
            <h1 className="text-xs font-bold tracking-[0.25em] uppercase text-purple-800">
              LingoPro Language Learning SaaS
            </h1>
            <p className="text-xs text-slate-400 mt-1">Official Academic CEFR Proficiency Registry</p>
          </div>

          <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900 font-serif tracking-tight mb-4">
            Certificate of Achievement
          </h2>

          <p className="text-xs text-slate-500 uppercase tracking-widest mb-3">
            This is proudly conferred to
          </p>

          <p className="text-2xl sm:text-3xl font-bold text-slate-900 border-b-2 border-purple-700 pb-2 inline-block px-8 mb-6 font-serif">
            {certificate.recipient_name}
          </p>

          <p className="text-xs sm:text-sm text-slate-600 max-w-lg mx-auto leading-relaxed mb-6">
            for successfully satisfying all curriculum milestones, interactive 6-modality competencies, and passing the rigorous server-evaluated final examination in
          </p>

          <h3 className="text-xl sm:text-2xl font-bold text-purple-900 font-serif mb-6">
            {certificate.course_title}
          </h3>

          {/* Metrics & Signatures Row */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 pt-6 border-t border-slate-200 text-xs text-slate-600 max-w-xl mx-auto items-end">
            <div>
              <p className="font-semibold text-slate-800">{formattedDate}</p>
              <div className="w-24 h-px bg-slate-300 mx-auto my-1" />
              <p className="text-[11px] text-slate-400">Date Issued</p>
            </div>

            <div className="flex flex-col items-center">
              <div className="w-14 h-14 rounded-full border-2 border-purple-600 flex flex-col items-center justify-center text-purple-700 mb-1">
                <ShieldCheck className="w-6 h-6" />
                <span className="text-[9px] font-bold">VERIFIED</span>
              </div>
              <p className="text-[10px] text-slate-400">Registry Seal</p>
            </div>

            <div>
              <p className="font-semibold text-slate-800 font-mono">{certificate.id}</p>
              <div className="w-24 h-px bg-slate-300 mx-auto my-1" />
              <p className="text-[11px] text-slate-400">Certificate Credential ID</p>
            </div>
          </div>

          {/* Verification Link Notice */}
          <div className="mt-8 pt-4 border-t border-slate-200 text-[11px] text-slate-400 flex flex-col sm:flex-row items-center justify-between gap-2">
            <span>Score: <strong className="text-slate-700">{certificate.final_score}%</strong> final grade</span>
            <div className="print:hidden">
              {onNavigateToVerify && (
                <button
                  onClick={() => onNavigateToVerify(certificate.id)}
                  className="text-purple-700 font-semibold hover:underline flex items-center gap-1"
                >
                  <span>Verify in Public Registry</span>
                  <ExternalLink className="w-3 h-3" />
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
