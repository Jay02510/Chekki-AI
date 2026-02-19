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
    <div className={`fixed inset-0 z-[110] flex items-center justify-center ${isStandalone ? 'bg-[#050505]' : 'p-4'}`}>
      {!isStandalone && <div className="absolute inset-0 bg-black/90 backdrop-blur-md" onClick={onClose}></div>}
      
      <div className={`relative bg-zinc-900 ${isStandalone ? 'w-full h-full rounded-none flex-1' : 'rounded-[2.5rem] w-full max-w-3xl h-[85vh]'} flex flex-col shadow-[0_50px_150px_rgba(0,0,0,0.9)] border border-white/5 animate-fade-in-up overflow-hidden`}>
        
        <div className="bg-zinc-950 px-8 py-6 border-b border-white/5 flex justify-between items-center shrink-0">
          <div className="flex items-center gap-4">
            <span className="text-2xl md:text-3xl">{icon}</span>
            <div>
              <h2 className="text-base md:text-xl font-black text-white font-display uppercase tracking-widest">{title}</h2>
              <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-[0.2em] mt-0.5">{date}</p>
            </div>
          </div>
          {!isStandalone && (
            <button 
                onClick={onClose} 
                aria-label="Close"
                className="text-zinc-500 hover:text-white transition-colors bg-zinc-800 w-10 h-10 rounded-full flex items-center justify-center border border-zinc-700 shadow-xl"
            >
                ✕
            </button>
          )}
        </div>

        <div className="flex-1 overflow-y-auto custom-scrollbar p-8 md:p-12 space-y-10 bg-zinc-900/50">
            
            {type === 'terms' && (
                <div className="space-y-10">
                    <section className="space-y-6">
                        <div className="bg-white/5 p-8 rounded-[2rem] border border-white/10 shadow-inner">
                            <h3 className="text-white font-black text-lg mb-6 border-b border-white/10 pb-3 uppercase tracking-wider">[KR] 이용약관</h3>
                            <div className="text-zinc-300 text-sm md:text-base leading-relaxed space-y-4 font-korean">
                                <p><strong>제1조 (목적)</strong><br/>본 약관은 Chekki AI Labs(이하 “회사”)가 제공하는 Chekki(채키) 서비스 및 관련 제반 서비스의 이용과 관련하여 회사와 회원 간의 권리, 의무 및 책임사항, 기타 필요한 사항을 규정함을 목적으로 합니다.</p>
                                <p><strong>제2조 (서비스의 제공 및 변경)</strong><br/>1. 회사는 인공지능 기반의 학습지 분석, 정답 가이드 제공, 발음 체크 및 맞춤형 학습 콘텐츠 생성 서비스를 제공합니다.<br/>2. 서비스의 품질 향상 또는 기술적 사양의 변경에 따라 서비스의 내용을 변경할 수 있으며, 이 경우 사전에 공지합니다.</p>
                                <p><strong>제3조 (유료 서비스 이용 및 결제)</strong><br/>1. 회원은 회사가 정한 결제 수단을 통해 유료 서비스를 이용할 수 있습니다.<br/>2. 정기 구독 서비스는 회원이 해지하지 않는 한 매월 자동으로 갱신되며 결제가 진행됩니다.</p>
                                <p><strong>제4조 (이용자의 의무)</strong><br/>회원은 타인의 저작권을 침해하거나 공공질서 및 미풍양속에 위반되는 게시물(음란, 폭력적 이미지 등)을 업로드해서는 안 됩니다. 위반 시 사전 고지 없이 계정 이용이 제한될 수 있습니다.</p>
                            </div>
                        </div>
                        <div className="bg-white/5 p-8 rounded-[2rem] border border-white/10 shadow-inner">
                            <h3 className="text-white font-black text-lg mb-6 border-b border-white/10 pb-3 uppercase tracking-wider">[EN] Terms of Service</h3>
                            <div className="text-zinc-300 text-sm md:text-base leading-relaxed space-y-4">
                                <p><strong>1. Acceptance of Terms</strong><br/>By accessing Chekki AI, you agree to comply with these terms. Chekki AI is a pedagogical support tool for parents and should not be used as the sole source of official educational grading.</p>
                                <p><strong>2. User Content</strong><br/>You are solely responsible for the images you upload. You must not upload images that are illegal, offensive, or infringe upon the intellectual property of others. We reserve the right to terminate accounts that violate these safety standards.</p>
                                <p><strong>3. Subscription and Billing</strong><br/>Premium features are provided on a subscription basis. Subscriptions automatically renew unless cancelled at least 24 hours before the end of the current period through your Account Settings.</p>
                                <p><strong>4. Limitation of Liability</strong><br/>The service is provided "as is." While we strive for high AI accuracy, the company is not responsible for any educational outcomes or errors in the analysis provided by the AI models.</p>
                            </div>
                        </div>
                    </section>
                </div>
            )}

            {type === 'privacy' && (
                <div className="space-y-10">
                    <section className="space-y-6">
                        <div className="bg-white/5 p-8 rounded-[2rem] border border-white/10 shadow-inner">
                            <h3 className="text-white font-black text-lg mb-6 border-b border-white/10 pb-3 uppercase tracking-wider">[KR] 개인정보처리방침 (Zero-Retention)</h3>
                            <div className="text-zinc-300 text-sm md:text-base leading-relaxed space-y-4 font-korean">
                                <p><strong>1. 수집하는 개인정보 항목:</strong> 이름(닉네임), 이메일 주소, 서비스 이용 기록, 분석을 위한 이미지(일시적).</p>
                                <p><strong>2. 개인정보의 수집 및 이용 목적:</strong> 회원 식별, 서비스 제공 및 품질 개선, 고객 상담 대응.</p>
                                <p><strong>3. 제로 스토리지 정책 (Zero-Retention Architecture):</strong><br/>Chekki는 사용자가 업로드한 학습지 이미지를 영구 저장하지 않습니다. 모든 이미지는 휘발성 메모리에서 실시간으로 분석된 후 즉시 삭제됩니다. Google Gemini API 역시 데이터 미저장 모드로 작동합니다.</p>
                                <p><strong>4. 개인정보의 보유 및 이용기간:</strong> 회원 탈퇴 시까지 또는 법령에서 정한 기간 동안 보유하며, 탈퇴 시 즉시 영구 파기됩니다.</p>
                            </div>
                        </div>
                        <div className="bg-white/5 p-8 rounded-[2rem] border border-white/10 shadow-inner">
                            <h3 className="text-white font-black text-lg mb-6 border-b border-white/10 pb-3 uppercase tracking-wider">[EN] Privacy Policy (Zero-Storage)</h3>
                            <div className="text-zinc-300 text-sm md:text-base leading-relaxed space-y-4">
                                <p><strong>1. Data Minimization</strong><br/>We only collect essential data: your name and email address for account management. We do not track your location or share your data with third-party advertisers.</p>
                                <p><strong>2. Zero-Retention Image Processing</strong><br/>Your worksheet photos are processed in temporary memory and are NEVER saved to a persistent disk. Once the AI analysis is returned to your device, the source image is deleted from our cloud infrastructure immediately.</p>
                                <p><strong>3. Third-Party Security</strong><br/>We use Firebase (Google) for secure authentication and Google Cloud for AI processing. Both providers adhere to strict SOC2/GDPR compliance standards.</p>
                                <p><strong>4. User Rights</strong><br/>You have the right to access, correct, or delete your data at any time. Deleting your account from the Settings menu results in the immediate and permanent deletion of all associated data from our systems.</p>
                            </div>
                        </div>
                    </section>
                </div>
            )}

            {type === 'youth' && (
                <div className="space-y-6">
                    <div className="bg-white/5 p-8 rounded-[2rem] border border-white/10 shadow-inner">
                        <h3 className="text-white font-black text-lg mb-6 border-b border-white/10 pb-3 uppercase tracking-wider">[KR] 청소년 보호 정책</h3>
                        <p className="text-zinc-300 text-sm md:text-base leading-relaxed font-korean">
                            Chekki는 자녀와 함께 사용하는 서비스임을 인지하고 청소년 보호에 최선을 다하고 있습니다.<br/><br/>
                            1. <strong>유해 콘텐츠 차단:</strong> 음란, 폭력, 비속어가 포함된 이미지가 감지될 경우 AI 분석이 즉시 거부되며 시스템에 의해 경고 조치됩니다.<br/>
                            2. <strong>개인정보 보호:</strong> 아동의 민감 정보를 별도로 수집하지 않으며, 부모의 관리 하에 서비스가 이용될 것을 권고합니다.<br/>
                            3. <strong>민원 처리:</strong> 청소년 보호 관련 문의는 chekkihelp@gmail.com으로 연락 주시면 24시간 이내에 조치하겠습니다.
                        </p>
                    </div>
                </div>
            )}

            {type === 'refund' && (
                <div className="space-y-10">
                    <section className="space-y-6">
                        <div className="bg-white/5 p-8 rounded-[2rem] border border-white/10 shadow-inner">
                            <h3 className="text-white font-black text-lg mb-6 border-b border-white/10 pb-3 uppercase tracking-wider">[KR] 환불 정책</h3>
                            <div className="text-zinc-300 text-sm md:text-base leading-relaxed space-y-4 font-korean">
                                <p><strong>1. 청약 철회 (7일 이내):</strong> 결제 후 7일 이내이며 유료 기능(Magic Scan 등)을 1회도 사용하지 않은 경우 전액 환불이 가능합니다.</p>
                                <p><strong>2. 중도 해지:</strong> 정기 결제 중도 해지 시, 이미 결제된 해당 월의 잔여 기간에 대한 환불은 불가하나 다음 결제일부터는 과금되지 않습니다.</p>
                                <p><strong>3. 결제 오류:</strong> 회사의 과실로 중복 결제 등이 발생한 경우 전액 환불 처리해 드립니다.</p>
                                <p><strong>4. 접수:</strong> chekkihelp@gmail.com으로 계정 정보와 결제 영수증을 보내주시면 신속히 처리하겠습니다.</p>
                            </div>
                        </div>
                        <div className="bg-white/5 p-8 rounded-[2rem] border border-white/10 shadow-inner">
                            <h3 className="text-white font-black text-lg mb-6 border-b border-white/10 pb-3 uppercase tracking-wider">[EN] Refund Policy</h3>
                            <div className="text-zinc-300 text-sm md:text-base leading-relaxed space-y-4">
                                <p><strong>1. 7-Day Cooling Off:</strong> You are eligible for a full refund within 7 days of purchase if no premium scans or AI sheets have been generated.</p>
                                <p><strong>2. Cancellation:</strong> You can cancel your subscription at any time. Your access will continue until the end of the current billing cycle. We do not provide prorated refunds for mid-month cancellations.</p>
                                <p><strong>3. App Store Purchases:</strong> If you subscribed via the Apple App Store, refunds must be requested through Apple Support as per their merchant policies.</p>
                            </div>
                        </div>
                    </section>
                </div>
            )}
        </div>

        <div className={`bg-zinc-950 p-8 border-t border-zinc-800 flex justify-end ${isStandalone ? 'pb-16' : ''}`}>
            {isStandalone ? (
              <div className="flex flex-col items-end gap-1">
                 <p className="text-[10px] text-zinc-600 uppercase tracking-[0.3em] font-black">Official Chekki AI Compliance Documentation</p>
                 <p className="text-[8px] text-zinc-800 font-bold uppercase tracking-widest italic">Protected by Chekki AI Labs Zero-Retention Policy</p>
              </div>
            ) : (
              <button 
                  onClick={onClose}
                  className="bg-white text-black hover:bg-zinc-200 px-14 py-4 rounded-2xl font-black transition-all text-sm active:scale-95 uppercase tracking-widest shadow-2xl ring-4 ring-white/10"
              >
                  I Understand
              </button>
            )}
        </div>
      </div>
    </div>
  );
};