
import React from 'react';

export type LegalType = 'privacy' | 'terms' | 'refund' | 'youth';

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
        
        {/* Header */}
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

        {/* Content */}
        <div className="flex-1 overflow-y-auto custom-scrollbar p-6 space-y-8 bg-zinc-900">
            
            {type === 'terms' && (
                <div className="space-y-8">
                    <section className="space-y-4">
                        <div className="bg-white/5 p-5 rounded-xl border border-white/10">
                            <h3 className="text-white font-black text-sm mb-4 border-b border-white/10 pb-2">[KR] 이용약관</h3>
                            <p className="text-zinc-300 text-xs leading-relaxed space-y-4">
                                본 약관은 Chekki AI (채키 AI) (이하 “서비스”)가 제공하는 온라인 학습 보조 서비스의 이용 조건 및 절차, 이용자와 운영자 간의 권리와 의무를 규정함을 목적으로 합니다.<br/><br/>
                                <strong>제1조 (서비스 목적)</strong><br/>
                                Chekki AI (채키 AI)는 부모가 가정에서 자녀의 영어 학습을 보다 원활하게 지도할 수 있도록 돕는 학습 보조 도구입니다. 본 서비스는 교사를 대체하거나 학습 성과를 보장하는 서비스가 아닙니다.<br/><br/>
                                <strong>제2조 (이용자 자격)</strong><br/>
                                본 서비스는 보호자(부모)를 이용 주체로 하며, 미성년자는 보호자의 감독 하에만 이용할 수 있습니다.<br/><br/>
                                <strong>제3조 (서비스 내용)</strong><br/>
                                1. 학습지 이미지 인식 및 정답 표시<br/>
                                2. 보호자를 위한 한·영 설명 가이드 제공<br/>
                                3. 발음 청취 기능 제공<br/><br/>
                                <strong>제4조 (유료 서비스 및 결제)</strong><br/>
                                유료 서비스는 월 구독 형태로 제공되며, 결제는 지정된 결제 수단을 통해 이루어집니다.<br/><br/>
                                <strong>제5조 (환불 및 해지)</strong><br/>
                                구독 해지는 언제든 가능하며, 환불 정책은 별도의 환불 정책에 따릅니다.<br/><br/>
                                <strong>제6조 (책임의 제한)</strong><br/>
                                Chekki AI (채키 AI)는 학습 참고용 도구이며, 학습 결과에 대한 법적 책임을 지지 않습니다.
                            </p>
                        </div>
                        <div className="bg-white/5 p-5 rounded-xl border border-white/10">
                            <h3 className="text-white font-black text-sm mb-4 border-b border-white/10 pb-2">[EN] Terms of Service</h3>
                            <p className="text-zinc-300 text-xs leading-relaxed">
                                These Terms govern the use of Chekki AI (채키 AI), an online learning support service designed to assist parents in guiding their children’s English homework at home.<br/><br/>
                                Chekki AI (채키 AI) is a supplementary educational tool and does not replace teachers or guarantee learning outcomes.<br/><br/>
                                Parents are the primary users. Children may only use the service under parental supervision.<br/><br/>
                                Paid services are provided on a subscription basis and may be canceled at any time in accordance with the Refund Policy.
                            </p>
                        </div>
                    </section>
                </div>
            )}

            {type === 'privacy' && (
                <div className="space-y-8">
                    <section className="space-y-4">
                        <div className="bg-white/5 p-5 rounded-xl border border-white/10">
                            <h3 className="text-white font-black text-sm mb-4 border-b border-white/10 pb-2">[KR] 개인정보처리방침</h3>
                            <p className="text-zinc-300 text-xs leading-relaxed">
                                Chekki AI (채키 AI)는 이용자의 개인정보 보호를 최우선으로 합니다.<br/><br/>
                                <strong>1. 수집 정보</strong><br/>
                                Chekki AI (채키 AI)는 학습지 이미지를 서버에 저장하지 않습니다. 업로드된 이미지는 분석 후 즉시 폐기됩니다.<br/><br/>
                                <strong>2. 이용 목적</strong><br/>
                                - 학습 보조 기능 제공<br/>
                                - 서비스 품질 개선<br/><br/>
                                <strong>3. 보관 기간</strong><br/>
                                Chekki AI (채키 AI)는 개인정보를 저장하지 않으며, 모든 처리는 일시적으로 이루어집니다.<br/><br/>
                                <strong>4. 미성년자 보호</strong><br/>
                                본 서비스는 보호자를 이용 주체로 하며, 아동 개인정보를 수집하지 않습니다.
                            </p>
                        </div>
                        <div className="bg-white/5 p-5 rounded-xl border border-white/10">
                            <h3 className="text-white font-black text-sm mb-4 border-b border-white/10 pb-2">[EN] Privacy Policy</h3>
                            <p className="text-zinc-300 text-xs leading-relaxed">
                                Chekki AI (채키 AI) prioritizes user privacy.<br/><br/>
                                Uploaded worksheet images are processed temporarily and are not stored. No child photos or voice data are retained. All processing is transient and deleted immediately after use.<br/><br/>
                                Chekki AI (채키 AI) does not collect personal data from children. Parents are the primary users.
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
                                <strong>1. 해지 및 환불</strong><br/>
                                월 구독 서비스는 언제든지 해지할 수 있습니다.<br/><br/>
                                <strong>2. 전액 환불 조건</strong><br/>
                                결제 후 사용 이력이 없는 경우 전액 환불이 가능합니다.<br/><br/>
                                <strong>3. 부분 환불</strong><br/>
                                부분 사용 후 환불은 관련 법령(전자상거래 등에서의 소비자보호에 관한 법률 등)에 따라 처리됩니다.<br/><br/>
                                <strong>4. 접수 방법</strong><br/>
                                환불 요청은 고객센터 이메일(chekkihelp@gmail.com)을 통해 접수할 수 있습니다.
                            </p>
                        </div>
                        <div className="bg-white/5 p-5 rounded-xl border border-white/10">
                            <h3 className="text-white font-black text-sm mb-4 border-b border-white/10 pb-2">[EN] Refund Policy</h3>
                            <p className="text-zinc-300 text-xs leading-relaxed">
                                Monthly subscriptions may be canceled at any time.<br/><br/>
                                Full refunds are available if no usage has occurred after payment.<br/><br/>
                                Partial refunds follow applicable Korean consumer protection laws.
                            </p>
                        </div>
                    </section>
                </div>
            )}

            {type === 'youth' && (
                <div className="space-y-8">
                    <section className="space-y-4">
                        <div className="bg-white/5 p-5 rounded-xl border border-white/10">
                            <h3 className="text-white font-black text-sm mb-4 border-b border-white/10 pb-2">[KR] 청소년 보호 정책</h3>
                            <p className="text-zinc-300 text-xs leading-relaxed">
                                Chekki AI (채키 AI)는 청소년 보호법을 준수합니다.<br/><br/>
                                1. 본 서비스는 보호자를 위한 학습 보조 도구입니다.<br/>
                                2. 모든 결제는 보호자에 의해 이루어져야 합니다.<br/>
                                3. 유해 콘텐츠를 제공하지 않으며, 광고를 포함하지 않습니다.
                            </p>
                        </div>
                        <div className="bg-white/5 p-5 rounded-xl border border-white/10">
                            <h3 className="text-white font-black text-sm mb-4 border-b border-white/10 pb-2">[EN] Youth Protection Policy</h3>
                            <p className="text-zinc-300 text-xs leading-relaxed">
                                Chekki AI (채키 AI) complies with Korean youth protection regulations.<br/><br/>
                                The service is intended for parents. All payments must be made by legal guardians. No harmful content or advertisements are provided.
                            </p>
                        </div>
                    </section>
                </div>
            )}

        </div>

        {/* Footer Actions */}
        <div className="bg-zinc-950 p-6 border-t border-zinc-800 flex justify-end">
            <button 
                onClick={isStandalone ? () => window.location.href = '/' : onClose}
                className="bg-white text-black hover:bg-zinc-200 px-10 py-3 rounded-xl font-black transition-colors text-xs active:scale-95 uppercase tracking-widest"
            >
                {isStandalone ? "메인으로 이동 / Go to Home" : "확인 / Confirm"}
            </button>
        </div>

      </div>
    </div>
  );
};
