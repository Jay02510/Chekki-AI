
import React from 'react';
import { LegalType } from '../types';

interface Props {
    type: LegalType;
    onClose: () => void;
    isStandalone?: boolean;
}

export const LegalModal: React.FC<Props> = ({ type, onClose, isStandalone = false }) => {
    const getHeader = () => {
        switch (type) {
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
                                    <div className="text-zinc-300 text-[10px] leading-relaxed space-y-4">
                                        <p><strong>본 서비스는 전자상거래 등에서의 소비자보호에 관한 법률을 준수합니다.</strong></p>
                                        <p>본 약관은 Chekki (채키) (이하 “서비스”)가 제공하는 온라인 학습 보조 서비스의 이용 조건 및 절차, 이용자와 운영자 간의 권리와 의무를 규정함을 목적으로 합니다.</p>
                                        <p>
                                            <strong>제1조 (서비스 목적)</strong><br />
                                            Chekki (채키)는 부모가 가정에서 자녀의 영어 학습을 보다 원활하게 지도할 수 있도록 돕는 학습 보조 도구입니다.
                                        </p>
                                        <p>
                                            <strong>제2조 (유료 서비스 및 자동 결제)</strong><br />
                                            유료 서비스는 월 구독 형태로 제공되며, 매월 정기적으로 자동 결제가 진행됩니다. 구독 해지는 마이페이지 또는 설정에서 언제든지 가능하며, 해지 시 다음 결제일부터 과금되지 않습니다.
                                        </p>
                                        <p>
                                            <strong>제3조 (이용자의 의무)</strong><br />
                                            이용자는 본인의 계정 정보를 안전하게 관리해야 하며, 타인에게 양도하거나 대여할 수 없습니다.
                                        </p>
                                    </div>
                                </div>
                                <div className="bg-white/5 p-5 rounded-xl border border-white/10">
                                    <h3 className="text-white font-black text-sm mb-4 border-b border-white/10 pb-2">[EN] Terms of Service</h3>
                                    <div className="text-zinc-300 text-[10px] leading-relaxed space-y-4">
                                        <p><strong>This service complies with the Korean Act on Consumer Protection in Electronic Commerce.</strong></p>
                                        <p>These terms govern your use of the Chekki ("Service") online learning assistance tool. By using the Service, you agree to these terms.</p>
                                        <p>
                                            <strong>1. Service Purpose</strong><br />
                                            Chekki is a tool designed to help parents guide their children's English learning at home.
                                        </p>
                                        <p>
                                            <strong>2. Subscriptions & Billing</strong><br />
                                            Paid services are provided as monthly subscriptions with automatic recurring billing. Subscriptions can be cancelled at any time through the app settings. Cancellation prevents future billing.
                                        </p>
                                        <p>
                                            <strong>3. User Obligations</strong><br />
                                            Users are responsible for maintaining the confidentiality of their account credentials and may not share or transfer their account to others.
                                        </p>
                                    </div>
                                </div>
                            </section>
                        </div>
                    )}

                    {type === 'privacy' && (
                        <div className="space-y-8">
                            <section className="space-y-4">
                                <div className="bg-white/5 p-5 rounded-xl border border-white/10">
                                    <h3 className="text-white font-black text-sm mb-4 border-b border-white/10 pb-2">[KR] 개인정보처리방침</h3>
                                    <div className="text-zinc-300 text-[10px] leading-relaxed space-y-4">
                                        <p><strong>1. 개인정보의 수집 항목 및 목적</strong><br />
                                            Chekki (채키)는 회원가입 및 서비스 제공을 위해 최소한의 개인정보를 수집합니다.<br />
                                            - 수집 항목: 이름, 이메일 주소, 기기 정보<br />
                                            - 수집 목적: 회원 식별, 서비스 알림, 기능 개선</p>

                                        <p><strong>2. 이미지 처리 및 보안 (Zero-Storage Policy)</strong><br />
                                            <strong>업로드된 학습지 이미지는 분석을 위해서만 일시적으로 처리되며, 서버에 저장되지 않습니다.</strong> 분석이 완료되는 즉시 메모리에서 삭제됩니다.</p>

                                        <p><strong>3. 제3자 제공 및 위탁</strong><br />
                                            서비스 운영을 위해 아래와 같은 외부 서비스를 이용하며, 해당 업체는 철저히 관리됩니다.<br />
                                            - 인프라: Firebase (Google Cloud)<br />
                                            - AI 분석: Google Gemini API</p>

                                        <p><strong>4. 개인정보의 보유 및 파기</strong><br />
                                            이용자가 계정 탈퇴를 요청할 경우 수집된 개인정보는 즉시 파기됩니다.</p>

                                        <p>개인정보 관리책임자: Jason Benjamin (jsn.benjamin@gmail.com)</p>
                                    </div>
                                </div>
                                <div className="bg-white/5 p-5 rounded-xl border border-white/10">
                                    <h3 className="text-white font-black text-sm mb-4 border-b border-white/10 pb-2">[EN] Privacy Policy</h3>
                                    <div className="text-zinc-300 text-[10px] leading-relaxed space-y-4">
                                        <p><strong>1. Collected Data & Purpose</strong><br />
                                            Chekki collects minimal data required for account management and service delivery.<br />
                                            - Items: Name, email address, device info.<br />
                                            - Purpose: User identification, service notifications, and feature improvements.</p>

                                        <p><strong>2. Image Processing (Zero-Storage Policy)</strong><br />
                                            <strong>Uploaded worksheet images are processed temporarily for analysis and are NEVER stored on our servers.</strong> Images are purged immediately after processing.</p>

                                        <p><strong>3. Third-Party Services</strong><br />
                                            We use trusted providers to maintain service reliability:<br />
                                            - Infrastructure: Firebase (Google Cloud)<br />
                                            - AI Processing: Google Gemini API</p>

                                        <p><strong>4. Data Retention & Deletion</strong><br />
                                            User data is retained until account deletion. You may delete your account and all associated data at any time through the app settings.</p>

                                        <p>Data Protection Officer: Jason Benjamin (jsn.benjamin@gmail.com)</p>
                                    </div>
                                </div>
                            </section>
                        </div>
                    )}

                    {type === 'youth' && (
                        <div className="space-y-8">
                            <section className="space-y-4">
                                <div className="bg-white/5 p-5 rounded-xl border border-white/10">
                                    <h3 className="text-white font-black text-sm mb-4 border-b border-white/10 pb-2">[KR] 청소년 보호 정책</h3>
                                    <div className="text-zinc-300 text-[10px] leading-relaxed space-y-4">
                                        <p>Chekki (채키)는 청소년이 안전하고 유익하게 서비스를 이용할 수 있도록 청소년 보호 정책을 시행하고 있습니다.</p>
                                        <p><strong>1. 기본 원칙</strong><br />서비스는 아동 및 청소년의 정서적 발달에 유해한 콘텐츠를 생성하거나 가공하지 않으며, 건전한 교육 환경을 제공하기 위해 노력합니다.</p>
                                        <p><strong>2. 유해 정보 차단</strong><br />AI 기술과 내부 모니터링을 통해 부적절한 언어, 폭력적 내용, 성인용 콘텐츠가 학습 보조 자료에 포함되지 않도록 원천적으로 차단합니다.</p>
                                        <p><strong>3. 피해 상담 및 고충 처리</strong><br />청소년 보호와 관련하여 건의사항이나 피해가 발생한 경우, 아래 이메일로 연락주시면 즉시 조치하도록 하겠습니다.</p>
                                        <p>청소년 보호 책임자: Jason Benjamin (jsn.benjamin@gmail.com)</p>
                                    </div>
                                </div>
                                <div className="bg-white/5 p-5 rounded-xl border border-white/10">
                                    <h3 className="text-white font-black text-sm mb-4 border-b border-white/10 pb-2">[EN] Youth Protection Policy</h3>
                                    <div className="text-zinc-300 text-[10px] leading-relaxed space-y-4">
                                        <p>Chekki is committed to providing a safe and beneficial environment for children and youth.</p>
                                        <p><strong>1. Core Principles</strong><br />We ensure that AI-generated educational materials are appropriate for youth and free from harmful emotional or psychological content.</p>
                                        <p><strong>2. Blocking Harmful Content</strong><br />We utilize AI safety filters and monitoring to proactively block inappropriate language, violence, or adult content from being processed or displayed.</p>
                                        <p><strong>3. Reporting & Grievances</strong><br />For any concerns regarding youth safety or to report inappropriate content, please contact our Youth Protection Officer.</p>
                                        <p>Youth Protection Officer: Jason Benjamin (jsn.benjamin@gmail.com)</p>
                                    </div>
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