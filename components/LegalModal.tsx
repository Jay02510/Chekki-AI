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
  const date = "최종 수정일: 2025년 10월 24일 (Effective: Oct 24, 2025)";

  return (
    <div className={`fixed inset-0 z-[110] flex items-center justify-center ${isStandalone ? 'bg-[#050505]' : 'p-4'}`}>
      {!isStandalone && <div className="absolute inset-0 bg-black/90 backdrop-blur-md" onClick={onClose}></div>}
      
      <div className={`relative bg-zinc-900 ${isStandalone ? 'w-full h-full rounded-none flex-1' : 'rounded-[2.5rem] w-full max-w-3xl h-[85vh]'} flex flex-col shadow-[0_50px_150px_rgba(0,0,0,0.9)] border border-white/5 animate-fade-in-up overflow-hidden`}>
        
        <div className="bg-zinc-950 px-8 py-6 border-b border-white/5 flex justify-between items-center shrink-0">
          <div className="flex items-center gap-4">
            <span className="text-2xl md:text-3xl">{icon}</span>
            <div>
              <h2 className="text-sm md:text-xl font-black text-white font-display uppercase tracking-widest">{title}</h2>
              <p className="text-[9px] text-zinc-500 font-bold uppercase tracking-[0.2em] mt-0.5">{date}</p>
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

        <div className="flex-1 overflow-y-auto custom-scrollbar p-8 md:p-12 space-y-12 bg-zinc-900/50">
            
            {type === 'terms' && (
                <div className="space-y-12">
                    <section className="space-y-6">
                        <div className="bg-white/5 p-8 rounded-[2rem] border border-white/10 shadow-inner">
                            <h3 className="text-white font-black text-lg mb-6 border-b border-white/10 pb-3 uppercase tracking-wider font-display">이용약관 (Terms of Service)</h3>
                            <div className="text-zinc-300 text-sm md:text-base leading-relaxed space-y-6 font-korean">
                                <div>
                                    <p className="font-bold text-white mb-2">제1조 (목적)</p>
                                    <p>본 약관은 Chekki AI Labs(이하 “회사”)가 제공하는 Chekki(채키) 서비스 및 관련 제반 서비스의 이용과 관련하여 회사와 회원 간의 권리, 의무 및 책임사항, 기타 필요한 사항을 규정함을 목적으로 합니다.</p>
                                </div>
                                <div>
                                    <p className="font-bold text-white mb-2">제2조 (서비스의 내용)</p>
                                    <p>회사는 인공지능(AI)을 활용한 영어 학습지 분석, 정답 가이드, 원어민 음성 제공 및 학습 보조 도구를 제공합니다. 본 서비스는 부모의 자녀 학습 지도를 돕는 '보조적 수단'이며, 공식적인 교육 성적이나 평가를 보증하지 않습니다.</p>
                                </div>
                                <div>
                                    <p className="font-bold text-white mb-2">제3조 (유료 서비스 및 구독)</p>
                                    <p>1. 유료 서비스 이용 요금은 앱 내 결제 페이지에 명시된 바에 따릅니다.<br/>2. 정기 구독 서비스는 이용자가 명시적으로 해지하지 않는 한 자동으로 갱신되며 요금이 청구됩니다.</p>
                                </div>
                                <div className="pt-6 border-t border-white/5">
                                    <p className="text-xs text-zinc-500 italic mb-4 uppercase tracking-widest">[English Summary]</p>
                                    <p><strong>1. Purpose:</strong> This agreement governs your use of Chekki AI. By using the app, you agree to these terms.</p>
                                    <p><strong>2. Nature of Service:</strong> Chekki provides AI-driven pedagogical support. It is a tool for parents and does not guarantee specific educational outcomes.</p>
                                    <p><strong>3. Content Responsibility:</strong> Users must not upload illegal or infringing content. We use automated filters to ensure a safe learning environment.</p>
                                </div>
                            </div>
                        </div>
                    </section>
                </div>
            )}

            {type === 'privacy' && (
                <div className="space-y-12">
                    <section className="space-y-6">
                        <div className="bg-white/5 p-8 rounded-[2rem] border border-white/10 shadow-inner">
                            <h3 className="text-white font-black text-lg mb-6 border-b border-white/10 pb-3 uppercase tracking-wider font-display">개인정보처리방침 (Privacy Policy)</h3>
                            <div className="text-zinc-300 text-sm md:text-base leading-relaxed space-y-6 font-korean">
                                <div>
                                    <p className="font-bold text-white mb-2">1. 수집하는 개인정보 항목</p>
                                    <p>회사는 서비스 제공을 위해 다음 정보를 수집합니다: 이메일 주소, 이름(닉네임), 서비스 이용 기록. 분석을 위해 업로드된 이미지는 분석 즉시 삭제되는 것을 원칙으로 합니다.</p>
                                </div>
                                <div>
                                    <p className="font-bold text-white mb-2">2. 제로 스토리지 정책 (Zero-Retention Policy)</p>
                                    <p>Chekki는 사용자의 프라이버시를 최우선으로 합니다. 학습지 이미지는 AI 분석을 위한 휘발성 메모리에서만 처리되며, 분석이 완료되는 즉시 서버에서 영구 삭제됩니다. 회사는 사용자의 학습지 이미지를 보관하거나 학습용 데이터로 재사용하지 않습니다.</p>
                                </div>
                                <div>
                                    <p className="font-bold text-white mb-2">3. 개인정보의 보유 및 이용기간</p>
                                    <p>회원 탈퇴 시까지 정보를 보유하며, 탈퇴 시 지체 없이 파기합니다. 단, 관계 법령에 따라 보존할 필요가 있는 경우 해당 기간 동안 보관합니다.</p>
                                </div>
                                <div className="pt-6 border-t border-white/5">
                                    <p className="text-xs text-zinc-500 italic mb-4 uppercase tracking-widest">[English Summary]</p>
                                    <p><strong>1. Data Collection:</strong> We collect only necessary data like email and name for account management. We do not track sensitive personal information.</p>
                                    <p><strong>2. Image Privacy:</strong> We employ a Zero-Retention architecture. Your worksheet images are processed in real-time and deleted immediately after analysis. We do not store your photos.</p>
                                    <p><strong>3. Third-Party API:</strong> We use Google Gemini API with data logging disabled to ensure your data stays private and is not used for model training.</p>
                                </div>
                            </div>
                        </div>
                    </section>
                </div>
            )}

            {type === 'refund' && (
                <div className="space-y-12">
                    <section className="space-y-6">
                        <div className="bg-white/5 p-8 rounded-[2rem] border border-white/10 shadow-inner">
                            <h3 className="text-white font-black text-lg mb-6 border-b border-white/10 pb-3 uppercase tracking-wider font-display">환불 정책 (Refund Policy)</h3>
                            <div className="text-zinc-300 text-sm md:text-base leading-relaxed space-y-6 font-korean">
                                <div>
                                    <p className="font-bold text-white mb-2">1. 청약 철회</p>
                                    <p>전자상거래법에 의거하여, 유료 서비스 결제 후 7일 이내에 서비스를 전혀 사용하지 않은 경우 전액 환불이 가능합니다.</p>
                                </div>
                                <div>
                                    <p className="font-bold text-white mb-2">2. 환불의 제한</p>
                                    <p>AI 스캔 기능을 1회 이상 사용하거나 디지털 콘텐츠를 확인한 경우, 서비스의 특성상 청약 철회가 제한될 수 있습니다.</p>
                                </div>
                                <div>
                                    <p className="font-bold text-white mb-2">3. 방법</p>
                                    <p>환불 신청은 고객센터(chekkihelp@gmail.com)를 통해 접수해 주시기 바랍니다. 앱스토어 결제 건은 애플의 정책에 따라 해당 스토어에서 직접 신청해야 합니다.</p>
                                </div>
                                <div className="pt-6 border-t border-white/5">
                                    <p className="text-xs text-zinc-500 italic mb-4 uppercase tracking-widest">[English Summary]</p>
                                    <p><strong>1. 7-Day Window:</strong> You are eligible for a full refund within 7 days of purchase if no premium features have been used.</p>
                                    <p><strong>2. Digital Consumption:</strong> Once a "Magic Scan" or AI content is generated, the service is considered consumed and non-refundable under digital commerce laws.</p>
                                    <p><strong>3. Processing:</strong> Contact chekkihelp@gmail.com for support. For iOS/App Store purchases, refunds must be processed through Apple Support.</p>
                                </div>
                            </div>
                        </div>
                    </section>
                </div>
            )}

            {type === 'youth' && (
                <div className="space-y-12">
                    <section className="space-y-6">
                        <div className="bg-white/5 p-8 rounded-[2rem] border border-white/10 shadow-inner">
                            <h3 className="text-white font-black text-lg mb-6 border-b border-white/10 pb-3 uppercase tracking-wider font-display">청소년 보호 정책 (Youth Protection)</h3>
                            <div className="text-zinc-300 text-sm md:text-base leading-relaxed space-y-6 font-korean">
                                <div>
                                    <p className="font-bold text-white mb-2">1. 유해 정보 차단</p>
                                    <p>회사는 청소년이 유해한 정보에 노출되지 않도록 AI 필터링 및 모니터링 시스템을 운영합니다. 교육 목적에 어긋나는 유해 이미지는 분석이 거부됩니다.</p>
                                </div>
                                <div>
                                    <p className="font-bold text-white mb-2">2. 부모의 역할</p>
                                    <p>본 서비스는 성인(부모 및 보호자)의 지도 하에 사용되는 것을 전제로 설계되었습니다. 아동이 단독으로 부적절한 정보를 접하지 않도록 보호자의 각별한 주의를 권장합니다.</p>
                                </div>
                                <div>
                                    <p className="font-bold text-white mb-2">3. 관리책임자</p>
                                    <p>청소년 보호 관련 민원은 chekkihelp@gmail.com으로 문의 주시면 신속하게 조치하겠습니다.</p>
                                </div>
                                <div className="pt-6 border-t border-white/5">
                                    <p className="text-xs text-zinc-500 italic mb-4 uppercase tracking-widest">[English Summary]</p>
                                    <p>Chekki AI is committed to a safe environment for families. We employ automated safety filters to prevent the processing of harmful content. We recommend all activities be supervised by a parent or guardian.</p>
                                </div>
                            </div>
                        </div>
                    </section>
                </div>
            )}
        </div>

        <div className={`bg-zinc-950 p-8 border-t border-zinc-800 flex justify-end ${isStandalone ? 'pb-[max(2rem,env(safe-area-inset-bottom))]' : ''}`}>
            {isStandalone ? (
              <div className="flex flex-col items-end gap-1">
                 <p className="text-[10px] text-zinc-600 uppercase tracking-[0.3em] font-black">Official Chekki AI Compliance Documentation</p>
                 <p className="text-[8px] text-zinc-800 font-bold uppercase tracking-widest italic">Protected by Zero-Retention Policy</p>
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