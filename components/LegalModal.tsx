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
      {!isStandalone && <div className="absolute inset-0 bg-black/90 backdrop-blur-md" onClick={onClose}></div>}
      
      <div className={`relative bg-zinc-900 ${isStandalone ? 'w-full h-full rounded-none flex-1' : 'rounded-[2.5rem] w-full max-w-3xl h-[85vh]'} flex flex-col shadow-[0_50px_150px_rgba(0,0,0,0.9)] border border-zinc-800 animate-fade-in-up overflow-hidden`}>
        
        <div className="bg-zinc-950 px-8 py-6 border-b border-zinc-800 flex justify-between items-center shrink-0">
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
                                <p><strong>본 서비스는 전자상거래 등에서의 소비자보호에 관한 법률을 준수합니다.</strong></p>
                                <p>본 약관은 Chekki (채키) (이하 “서비스”)가 제공하는 온라인 학습 보조 서비스의 이용 조건 및 절차, 이용자와 운영자 간의 권리와 의무를 규정함을 목적으로 합니다.</p>
                                <p><strong>제1조 (서비스 목적)</strong><br/>Chekki (채키)는 부모가 가정에서 자녀의 영어 학습을 보다 원활하게 지도할 수 있도록 돕는 학습 보조 도구입니다. 본 서비스는 교육적 보조 도구이며, 최종 학습 결과에 대한 책임은 이용자에게 있습니다.</p>
                                <p><strong>제2조 (유료 서비스 및 자동 결제)</strong><br/>유료 서비스는 월 구독 형태로 제공될 수 있으며, 매월 정기적으로 자동 결제가 진행됩니다. 구독 해지는 설정 메뉴에서 언제든지 가능하며, 해지 시 다음 결제일부터 과금되지 않습니다.</p>
                                <p><strong>제3조 (콘텐츠 권리)</strong><br/>AI가 생성한 학습 가이드 및 스크립트는 Chekki AI Labs의 자산이며, 무단 배포 및 상업적 이용을 금지합니다.</p>
                            </div>
                        </div>
                        <div className="bg-white/5 p-8 rounded-[2rem] border border-white/10 shadow-inner">
                            <h3 className="text-white font-black text-lg mb-6 border-b border-white/10 pb-3 uppercase tracking-wider">[EN] Terms of Service</h3>
                            <div className="text-zinc-300 text-sm md:text-base leading-relaxed space-y-4">
                                <p><strong>Compliance:</strong> This service complies with the Korean Act on Consumer Protection in Electronic Commerce and international digital service standards.</p>
                                <p><strong>Service Scope:</strong> Chekki is a pedagogical assistant designed for parents. It provides digital answer keys, pronunciation checking, and custom worksheet generation via AI analysis.</p>
                                <p><strong>User Responsibility:</strong> Users are responsible for the photos they upload. Uploading objectionable, violent, or illegal content is strictly prohibited and will result in permanent account suspension.</p>
                                <p><strong>Subscriptions:</strong> Users may manage or cancel subscriptions at any time via the Settings menu. Cancellations stop future billing cycles but do not provide partial refunds for the current active period unless required by local law.</p>
                            </div>
                        </div>
                    </section>
                </div>
            )}

            {type === 'privacy' && (
                <div className="space-y-10">
                    <section className="space-y-6">
                        <div className="bg-white/5 p-8 rounded-[2rem] border border-white/10 shadow-inner">
                            <h3 className="text-white font-black text-lg mb-6 border-b border-white/10 pb-3 uppercase tracking-wider">[KR] 개인정보처리방침 (Zero-Retention Policy)</h3>
                            <div className="text-zinc-300 text-sm md:text-base leading-relaxed space-y-4 font-korean">
                                <p><strong>1. 수집 항목:</strong> 이메일 주소, 이름, 학습지 분석을 위한 업로드 이미지 (일시적 처리).</p>
                                <p><strong>2. 제3자 제공 (AI 분석):</strong> 업로드된 이미지는 분석을 위해 Google Gemini API로 암호화되어 전송됩니다. </p>
                                <p><strong>3. 제로 스토리지 정책 (핵심):</strong> Chekki (채키)는 사용자가 업로드한 이미지를 자사 서버에 절대 저장하지 않습니다. 분석은 메모리 상에서만 이루어지며, 분석 완료 즉시 삭제됩니다. Google Gemini API 역시 'Zero-Retention' 모드로 작동하여 학습에 사용되거나 저장되지 않습니다.</p>
                                <p><strong>4. 정보 주체의 권리:</strong> 사용자는 설정 메뉴의 '계정 삭제' 기능을 통해 즉각적이고 영구적으로 모든 데이터를 삭제할 수 있습니다.</p>
                            </div>
                        </div>
                        <div className="bg-white/5 p-8 rounded-[2rem] border border-white/10 shadow-inner">
                            <h3 className="text-white font-black text-lg mb-6 border-b border-white/10 pb-3 uppercase tracking-wider">[EN] Privacy Policy (Zero-Storage Policy)</h3>
                            <div className="text-zinc-300 text-sm md:text-base leading-relaxed space-y-4">
                                <p><strong>Data Minimization:</strong> We strictly limit data collection to essential authentication info (Name, Email). We do not track location or specific device identifiers.</p>
                                <p><strong>AI Image Processing (Zero-Retention):</strong> When you snap a worksheet, the image is transmitted securely to Google Cloud Infrastructure. We utilize a **Zero-Retention architecture**—your photos are processed in temporary volatile memory and are NEVER saved to a persistent disk by Chekki or our AI providers. Your data is never used to train AI models.</p>
                                <p><strong>Third-Party Disclosure:</strong> Data is shared only with our core infrastructure providers (Firebase for Auth/Database, Google for AI Analysis). We never sell user data to third-party advertisers.</p>
                                <p><strong>Data Deletion:</strong> You have the absolute right to be forgotten. Deleting your account from the Settings menu removes all database entries instantly.</p>
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
                            Chekki (채키)는 청소년이 유해한 정보에 노출되지 않도록 엄격한 콘텐츠 필터링을 적용하고 있습니다. AI 분석 단계에서 유해 콘텐츠(폭력, 음란 등)가 감지될 경우 분석 처리가 즉시 중단되며 계정 경고가 발생할 수 있습니다. 자녀의 안전한 학습 환경을 위해 최선을 다합니다.
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
                                <p>Chekki는 디지털 구독 서비스입니다.</p>
                                <p><strong>1. 청약 철회:</strong> 결제 후 7일 이내이며 유료 기능(Magic Scan 등)을 사용하지 않은 경우 전액 환불이 가능합니다.</p>
                                <p><strong>2. 중도 해지:</strong> 이미 서비스를 사용한 경우에는 사용 기간 또는 사용 횟수에 따라 부분 환불이 진행되거나 환불이 불가할 수 있습니다.</p>
                                <p><strong>3. 접수 방법:</strong> 모든 환불 요청은 고객지원 이메일로 접수해주시기 바랍니다: chekkihelp@gmail.com</p>
                            </div>
                        </div>
                        <div className="bg-white/5 p-8 rounded-[2rem] border border-white/10 shadow-inner">
                            <h3 className="text-white font-black text-lg mb-6 border-b border-white/10 pb-3 uppercase tracking-wider">[EN] Refund Policy</h3>
                            <div className="text-zinc-300 text-sm md:text-base leading-relaxed space-y-4">
                                <p><strong>Standard Policy:</strong> Digital subscriptions are eligible for a full refund within 7 days of purchase if no premium features (Magic Scans, AI Sheet Generation) have been utilized.</p>
                                <p><strong>Usage-Based Adjustments:</strong> If premium analysis has been performed, refunds are subject to review and may be prorated based on use. App Store purchases must be managed via Apple Support.</p>
                                <p><strong>Support:</strong> For billing inquiries, contact chekkihelp@gmail.com.</p>
                            </div>
                        </div>
                    </section>
                </div>
            )}
        </div>

        <div className={`bg-zinc-950 p-8 border-t border-zinc-800 flex justify-end ${isStandalone ? 'pb-16' : ''}`}>
            {isStandalone ? (
              <p className="text-[11px] text-zinc-600 uppercase tracking-[0.3em] font-black">Official Chekki AI Compliance Documentation</p>
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
