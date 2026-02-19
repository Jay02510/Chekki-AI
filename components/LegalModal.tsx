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
    <div className={`fixed inset-0 z-[110] flex items-center justify-center ${isStandalone ? 'bg-zinc-950' : 'p-4'}`}>
      <div className={`${isStandalone ? 'hidden' : 'absolute inset-0 bg-black/80 backdrop-blur-sm'}`} onClick={isStandalone ? undefined : onClose}></div>
      
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
                            <p className="text-zinc-300 text-xs leading-relaxed">
                                <strong>본 서비스는 전자상거래 등에서의 소비자보호에 관한 법률을 준수합니다.</strong><br/><br/>
                                본 약관은 Chekki (채키) (이하 “서비스”)가 제공하는 온라인 학습 보조 서비스의 이용 조건 및 절차, 이용자와 운영자 간의 권리와 의무를 규정함을 목적으로 합니다.<br/><br/>
                                <strong>제1조 (서비스 목적)</strong><br/>
                                Chekki (채키)는 부모가 가정에서 자녀의 영어 학습을 보다 원활하게 지도할 수 있도록 돕는 학습 보조 도구입니다.<br/><br/>
                                <strong>제2조 (유료 서비스 및 자동 결제)</strong><br/>
                                유료 서비스는 월 구독 형태로 제공되며, 매월 정기적으로 자동 결제가 진행됩니다. 구독 해지는 설정 메뉴에서 언제든지 가능하며, 해지 시 다음 결제일부터 과금되지 않습니다.
                            </p>
                        </div>
                        <div className="bg-white/5 p-5 rounded-xl border border-white/10">
                            <h3 className="text-white font-black text-sm mb-4 border-b border-white/10 pb-2">[EN] Terms of Service</h3>
                            <p className="text-zinc-300 text-xs leading-relaxed">
                                <strong>Compliance:</strong> This service complies with the Korean Act on Consumer Protection in Electronic Commerce.<br/><br/>
                                <strong>Service Scope:</strong> Chekki is a pedagogical assistant designed for parents of English Kindergarten students. It provides digital answer keys, pronunciation checking, and custom worksheet generation.<br/><br/>
                                <strong>Subscription:</strong> Users may cancel subscriptions at any time via the Settings menu. Cancellations stop future billing cycles but do not provide partial refunds for active periods unless otherwise specified.
                            </p>
                        </div>
                    </section>
                </div>
            )}

            {type === 'privacy' && (
                <div className="space-y-8">
                    <section className="space-y-4">
                        <div className="bg-white/5 p-5 rounded-xl border border-white/10">
                            <h3 className="text-white font-black text-sm mb-4 border-b border-white/10 pb-2">[KR] 개인정보처리방침 (Zero-Storage Policy)</h3>
                            <p className="text-zinc-300 text-xs leading-relaxed">
                                <strong>1. 수집 항목:</strong> 이메일 주소, 이름, 학습지 분석을 위한 업로드 이미지 (일시적 처리).<br/>
                                <strong>2. 제3자 제공 (AI 분석):</strong> 업로드된 이미지는 분석을 위해 Google Gemini API로 전송됩니다. 해당 서비스는 분석 완료 후 데이터를 저장하지 않는 모델을 사용합니다.<br/>
                                <strong>3. 제로 스토리지 정책:</strong> Chekki (채키)는 사용자가 업로드한 이미지를 자사 서버에 절대 저장하지 않습니다. 분석 즉시 메모리에서 삭제됩니다.<br/>
                                <strong>4. 정보 주체의 권리:</strong> 사용자는 언제든지 계정 삭제 및 정보 정정을 요구할 수 있습니다.
                            </p>
                        </div>
                        <div className="bg-white/5 p-5 rounded-xl border border-white/10">
                            <h3 className="text-white font-black text-sm mb-4 border-b border-white/10 pb-2">[EN] Privacy Policy (Zero-Storage Policy)</h3>
                            <p className="text-zinc-300 text-xs leading-relaxed">
                                <strong>Data Minimization:</strong> We only collect your name and email for authentication. No other personal identifiers are stored.<br/><br/>
                                <strong>AI Image Processing:</strong> When you snap a worksheet, the image is sent securely to Google Cloud for analysis. We utilize a Zero-Retention architecture—your photos are processed in memory and never saved to a persistent disk by Chekki or our AI providers.<br/><br/>
                                <strong>Data Deletion:</strong> You can delete your account and all associated metadata instantly from the Settings menu.
                            </p>
                        </div>
                    </section>
                </div>
            )}

            {type === 'youth' && (
                <div className="space-y-4">
                    <div className="bg-white/5 p-5 rounded-xl border border-white/10">
                        <h3 className="text-white font-black text-sm mb-4 border-b border-white/10 pb-2">[KR] 청소년 보호 정책</h3>
                        <p className="text-zinc-300 text-xs leading-relaxed">
                            Chekki (채키)는 청소년이 유해한 정보에 노출되지 않도록 엄격한 콘텐츠 필터링을 적용하고 있습니다. AI 분석 단계에서 유해 콘텐츠(폭력, 음란 등)가 감지될 경우 처리가 중단됩니다.
                        </p>
                    </div>
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
                                3. 환불 요청은 이메일로 접수해주시기 바랍니다: chekkihelp@gmail.com
                            </p>
                        </div>
                        <div className="bg-white/5 p-5 rounded-xl border border-white/10">
                            <h3 className="text-white font-black text-sm mb-4 border-b border-white/10 pb-2">[EN] Refund Policy</h3>
                            <p className="text-zinc-300 text-xs leading-relaxed">
                                <strong>Standard Policy:</strong> Digital goods are eligible for a full refund within 7 days of purchase if no analysis (Magic Scans) have been performed.<br/><br/>
                                <strong>Usage-Based Refunds:</strong> If the service has been used, we may issue a prorated refund based on the remaining days of the billing cycle. Contact chekkihelp@gmail.com for requests.
                            </p>
                        </div>
                    </section>
                </div>
            )}
        </div>

        <div className={`bg-zinc-950 p-6 border-t border-zinc-800 flex justify-end ${isStandalone ? 'pb-12' : ''}`}>
            {isStandalone ? (
              <p className="text-[10px] text-zinc-600 uppercase tracking-widest font-bold">Chekki AI Compliance Documentation</p>
            ) : (
              <button 
                  onClick={onClose}
                  className="bg-white text-black hover:bg-zinc-200 px-10 py-3 rounded-xl font-black transition-colors text-xs active:scale-95 uppercase tracking-widest shadow-xl"
              >
                  Confirm
              </button>
            )}
        </div>
      </div>
    </div>
  );
};