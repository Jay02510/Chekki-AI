
import React from 'react';
import { LegalType } from '../types';

interface Props {
  type: LegalType;
  onClose: () => void;
  isStandalone?: boolean;
}

export const LegalModal: React.FC<Props> = ({ type, onClose, isStandalone = false }) => {
  const getHeader = () => {
    switch(type) {
      case 'privacy': return { title: "개인정보처리방침 / Privacy Policy", icon: "🔒" };
      case 'terms': return { title: "이용약관 / Terms of Service", icon: "📜" };
      case 'refund': return { title: "환불 정책 / Refund Policy", icon: "💳" };
      case 'youth': return { title: "청소년 보호 정책 / Youth Protection", icon: "🛡️" };
      default: return { title: "Legal", icon: "⚖️" };
    }
  };

  const { title, icon } = getHeader();
  const date = "최종 수정일: 2025년 10월 24일";

  return (
    <div className={`fixed inset-0 z-[110] flex items-center justify-center ${isStandalone ? '' : 'p-4'}`}>
      <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={isStandalone ? undefined : onClose}></div>
      
      <div className={`relative bg-zinc-900 ${isStandalone ? 'w-full h-full rounded-none' : 'rounded-2xl w-full max-w-2xl h-[85vh]'} flex flex-col shadow-2xl border border-zinc-800 animate-fade-in-up`}>
        
        <div className="bg-zinc-950 px-6 py-4 border-b border-zinc-800 flex justify-between items-center shrink-0">
          <div className="flex items-center gap-3">
            <span className="text-xl">{icon}</span>
            <div>
              <h2 className="text-sm md:text-base font-bold text-white font-display">{title}</h2>
              <p className="text-[10px] text-zinc-500 uppercase tracking-widest">{date}</p>
            </div>
          </div>
          {!isStandalone && (
            <button 
                onClick={onClose} 
                aria-label="Close"
                className="text-zinc-500 hover:text-white transition-colors bg-zinc-900 w-8 h-8 rounded-full flex items-center justify-center border border-zinc-800"
            >
                ✕
            </button>
          )}
        </div>

        <div className="flex-1 overflow-y-auto custom-scrollbar p-6 space-y-8 bg-zinc-900">
            
            {type === 'terms' && (
                <div className="space-y-8">
                    <section className="space-y-4">
                        <div className="bg-white/5 p-5 rounded-xl border border-white/10">
                            <h3 className="text-white font-black text-sm mb-4 border-b border-white/10 pb-2">[KR] 이용약관</h3>
                            <p className="text-zinc-300 text-xs leading-relaxed space-y-4">
                                <strong>본 서비스는 전자상거래 등에서의 소비자보호에 관한 법률을 준수합니다.</strong><br/><br/>
                                본 약관은 Chekki (채키) (이하 “서비스”)가 제공하는 온라인 학습 보조 서비스의 이용 조건 및 절차, 이용자와 운영자 간의 권리와 의무를 규정함을 목적으로 합니다.<br/><br/>
                                <strong>제1조 (서비스 목적)</strong><br/>
                                Chekki (채키)는 부모가 가정에서 자녀의 영어 학습을 보다 원활하게 지도할 수 있도록 돕는 학습 보조 도구입니다.<br/><br/>
                                <strong>제2조 (유료 서비스 및 자동 결제)</strong><br/>
                                유료 서비스는 월 구독 형태로 제공되며, 매월 정기적으로 자동 결제가 진행됩니다. 구독 해지는 마이페이지에서 언제든지 가능하며, 해지 시 다음 결제일부터 과금되지 않습니다.<br/><br/>
                            </p>
                        </div>
                        <div className="bg-white/5 p-5 rounded-xl border border-white/10">
                            <h3 className="text-white font-black text-sm mb-4 border-b border-white/10 pb-2">[EN] Terms of Service</h3>
                            <p className="text-zinc-300 text-xs leading-relaxed">
                                <strong>This service complies with the Korean Act on Consumer Protection in Electronic Commerce.</strong><br/><br/>
                                Subscriptions may be cancelled anytime from the My Page section. Cancellation prevents future billing.
                            </p>
                        </div>
                    </section>
                </div>
            )}

            {type === 'privacy' && (
                <div className="space-y-8">
                    <section className="space-y-4">
                        <div className="bg-white/5 p-5 rounded-xl border border-white/10">
                            <h3 className="text-white font-black text-sm mb-4 border-b border-white/10 pb-2">[KR] 개인정보처리방침 (Zero-Storage)</h3>
                            <p className="text-zinc-300 text-xs leading-relaxed">
                                <strong>Chekki (채키)는 업로드된 이미지를 서버에 저장하지 않습니다.</strong><br/>
                                이미지는 분석 후 즉시 삭제됩니다. 개인정보 관리책임자: Jason Benjamin (jsn.benjamin@gmail.com)
                            </p>
                        </div>
                        <div className="bg-white/5 p-5 rounded-xl border border-white/10">
                            <h3 className="text-white font-black text-sm mb-4 border-b border-white/10 pb-2">[EN] Privacy Policy (Zero-Storage)</h3>
                            <p className="text-zinc-300 text-xs leading-relaxed">
                                <strong>Uploaded images are processed temporarily and are not stored.</strong> Images are deleted immediately after analysis.
                            </p>
                        </div>
                    </section>
                </div>
            )}

            {type === 'refund' && (
                <div className="space-y-8">
                    <section className="space-y-4">
                        <div className="bg-white/5 p-5 rounded-xl border border-white/10">
                            <h3 className="text-white font-black text-sm mb-4 border-b border-white/10 pb-2">[KR] 환불 정책</h3>
                            <p className="text-zinc-300 text-xs leading-relaxed">
                                Chekki는 디지털 구독 서비스입니다.<br/><br/>
                                <strong>1. 결제 후 7일 이내이며 서비스를 사용하지 않은 경우 전액 환불이 가능합니다.</strong><br/>
                                2. 이미 서비스를 사용한 경우에는 사용 기간에 따라 부분 환불이 진행될 수 있습니다.<br/>
                                3. 환불 요청은 이메일로 접수해주시기 바랍니다: jsn.benjamin@gmail.com<br/>
                                4. 환불 처리 기간: 영업일 기준 3~5일
                            </p>
                        </div>
                        <div className="bg-white/5 p-5 rounded-xl border border-white/10">
                            <h3 className="text-white font-black text-sm mb-4 border-b border-white/10 pb-2">[EN] Refund Policy</h3>
                            <p className="text-zinc-300 text-xs leading-relaxed">
                                <strong>Full refunds are available within 7 days of purchase if the service has not been used.</strong><br/>
                                If the service has been used, a partial refund may be issued depending on usage. Processing time: 3–5 business days. Contact: jsn.benjamin@gmail.com
                            </p>
                        </div>
                    </section>
                </div>
            )}
        </div>

        <div className="bg-zinc-950 p-6 border-t border-zinc-800 flex justify-end">
            <button 
                onClick={onClose}
                className="bg-white text-black hover:bg-zinc-200 px-10 py-3 rounded-xl font-black transition-colors text-xs active:scale-95 uppercase tracking-widest"
            >
                Confirm
            </button>
        </div>
      </div>
    </div>
  );
};