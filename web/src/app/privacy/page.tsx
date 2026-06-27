export default function PrivacyPage() {
  return (
    <main className="min-h-screen bg-[#020617] text-white py-32 px-4 md:px-8">
      <div className="max-w-3xl mx-auto space-y-12">
        <div>
          <h1 className="text-4xl font-bold tracking-tight mb-4">개인정보처리방침 / Privacy Policy</h1>
          <p className="text-white/50 text-sm uppercase tracking-widest">최종 수정일: 2025년 10월 24일</p>
        </div>

        <section className="space-y-8">
          <div className="bg-white/5 p-8 rounded-2xl border border-white/10">
            <h3 className="font-black text-xl mb-6 border-b border-white/10 pb-4">
              [KR] 개인정보처리방침
            </h3>
            <div className="text-white/70 leading-loose space-y-6">
              <p>
                <strong className="text-white block mb-2 text-lg">1. 개인정보의 수집 항목 및 목적</strong>
                Chekki (채키)는 회원가입 및 서비스 제공을 위해 최소한의 개인정보를 수집합니다.<br />
                - 수집 항목: 이름, 이메일 주소, 기기 정보<br />
                - 수집 목적: 회원 식별, 서비스 알림, 기능 개선
              </p>

              <p>
                <strong className="text-white block mb-2 text-lg">2. 데이터 저장 및 활용</strong>
                업로드된 원본 학습지 이미지와 추출된 텍스트 및 오답 데이터는 개인 맞춤형 복습 워크시트 생성 및 학습 진행도 추적을 위해 안전하게 서버에 저장됩니다.
              </p>

              <p>
                <strong className="text-white block mb-2 text-lg">3. 제3자 제공 및 위탁</strong>
                서비스 운영을 위해 아래와 같은 외부 서비스를 이용하며, 해당 업체는 철저히 관리됩니다.<br />
                - 인프라: Firebase (Google Cloud)<br />
                - AI 분석: Google Gemini API
              </p>

              <p>
                <strong className="text-white block mb-2 text-lg">4. 개인정보의 보유 및 파기</strong>
                이용자가 계정 탈퇴를 요청할 경우 수집된 개인정보는 즉시 파기됩니다.
              </p>

              <p className="pt-4 border-t border-white/10">개인정보 관리책임자: Chekki 지원팀 (chekkihelp@gmail.com)</p>
            </div>
          </div>

          <div className="bg-white/5 p-8 rounded-2xl border border-white/10">
            <h3 className="font-black text-xl mb-6 border-b border-white/10 pb-4">
              [EN] Privacy Policy
            </h3>
            <div className="text-white/70 leading-loose space-y-6">
              <p>
                <strong className="text-white block mb-2 text-lg">1. Collected Data & Purpose</strong>
                Chekki collects minimal data required for account management and service delivery.<br />
                - Items: Name, email address, device info.<br />
                - Purpose: User identification, service notifications, and feature improvements.
              </p>

              <p>
                <strong className="text-white block mb-2 text-lg">2. Data Storage & Usage</strong>
                Uploaded original worksheet images, along with extracted text and mistake data, are stored securely on our servers to generate customized PDF practice worksheets and track learning progress.
              </p>

              <p>
                <strong className="text-white block mb-2 text-lg">3. Third-Party Services</strong>
                We use trusted providers to maintain service reliability:<br />
                - Infrastructure: Firebase (Google Cloud)<br />
                - AI Processing: Google Gemini API
              </p>

              <p>
                <strong className="text-white block mb-2 text-lg">4. Data Retention & Deletion</strong>
                User data is retained until account deletion. You may delete your account and all associated data at any time through the app settings.
              </p>

              <p className="pt-4 border-t border-white/10">Data Protection Officer: Chekki Support Team (chekkihelp@gmail.com)</p>
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
