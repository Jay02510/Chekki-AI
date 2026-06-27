export default function TermsPage() {
  return (
    <main className="min-h-screen bg-[#020617] text-white py-32 px-4 md:px-8">
      <div className="max-w-3xl mx-auto space-y-12">
        <div>
          <h1 className="text-4xl font-bold tracking-tight mb-4">이용약관 / Terms of Service</h1>
          <p className="text-white/50 text-sm uppercase tracking-widest">최종 수정일: 2025년 10월 24일</p>
        </div>

        <section className="space-y-8">
          <div className="bg-white/5 p-8 rounded-2xl border border-white/10">
            <h3 className="font-black text-xl mb-6 border-b border-white/10 pb-4">
              [KR] 이용약관
            </h3>
            <div className="text-white/70 leading-loose space-y-6">
              <p>
                <strong>본 서비스는 전자상거래 등에서의 소비자보호에 관한 법률을 준수합니다.</strong>
              </p>
              <p>
                본 약관은 Chekki (채키) (이하 “서비스”)가 제공하는 온라인 학습 보조 서비스의 이용 조건 및 절차, 이용자와 운영자 간의 권리와 의무를 규정함을 목적으로 합니다.
              </p>

              <p>
                <strong className="text-white block mb-2 text-lg">제1조 (서비스 목적 및 내용)</strong>
                Chekki (채키)는 부모가 가정에서 자녀의 영어 학습을 보다 원활하게 지도할 수 있도록 돕는 학습 보조 도구입니다. 제공되는 서비스는 AI를 활용한 학습지 분석 및 오답 노트 관리 기능을 포함합니다.
              </p>

              <p>
                <strong className="text-white block mb-2 text-lg">제2조 (유료 서비스 및 이용 기간)</strong>
                1. 유료 서비스(Standard Pro)는 월 구독 형태로 제공되며, 1회 결제 시 이용 기간은 결제일로부터 30일입니다.<br />
                2. 구독 서비스는 이용자가 해지하기 전까지 매월 정기적으로 자동 결제가 진행됩니다.
              </p>

              <p>
                <strong className="text-white block mb-2 text-lg">제3조 (청약철회 및 서비스 해지)</strong>
                1. 이용자는 결제 후 7일 이내에 서비스를 이용하지 않은 경우 청약철회(환불)를 요청할 수 있습니다.<br />
                2. 서비스 해지(자동 결제 중단)는 설정 메뉴 내 '구독 관리'를 통해 언제든지 가능하며, 해지 시 다음 결제 예정일부터 과금이 중단됩니다.
              </p>
            </div>
          </div>

          <div className="bg-white/5 p-8 rounded-2xl border border-white/10">
            <h3 className="font-black text-xl mb-6 border-b border-white/10 pb-4">
              [EN] Terms of Service
            </h3>
            <div className="text-white/70 leading-loose space-y-6">
              <p>
                <strong>This service complies with the Korean Act on Consumer Protection in Electronic Commerce.</strong>
              </p>
              <p>
                These terms govern your use of the Chekki ("Service") online learning assistance tool. By using the Service, you agree to these terms.
              </p>

              <p>
                <strong className="text-white block mb-2 text-lg">1. Service Purpose & Content</strong>
                Chekki is a tool designed to help parents guide their children's English learning at home, including AI-powered worksheet analysis and review notes.
              </p>

              <p>
                <strong className="text-white block mb-2 text-lg">2. Subscriptions & Service Period</strong>
                1. Paid services (Standard Pro) are provided as monthly subscriptions. Each billing cycle covers a period of 30 days.<br />
                2. Subscriptions renew automatically every 30 days unless cancelled by the user.
              </p>

              <p>
                <strong className="text-white block mb-2 text-lg">3. Cancellation & Refunds</strong>
                1. Users may request a full refund within 7 days of purchase if the service has not been used.<br />
                2. Subscription cancellation can be performed at any time through the "Settings" menu. Cancellation prevents future recurring charges.
              </p>
            </div>
          </div>
        </section>

        <div className="text-center pt-8">
          <a href="/" className="inline-block px-8 py-3 rounded-xl bg-white text-black font-bold uppercase tracking-widest text-sm hover:bg-white/90 transition-colors">
            Back to Home
          </a>
        </div>
      </div>
    </main>
  );
}
