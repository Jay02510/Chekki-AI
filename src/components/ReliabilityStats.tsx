import { ShieldCheck, Lightning, Cloud } from '@phosphor-icons/react';

interface Props {
  isNight: boolean;
  isKo: boolean;
}

// Numbers below come from a real k6 load test against a staging deployment
// (200 concurrent virtual users ramped over 3.5 min, 24k+ requests, Gemini
// calls mocked to isolate infra behavior from AI response time). Update
// this comment and the copy together if the test is rerun with different
// numbers — don't let this drift into an unverified claim.
export default function ReliabilityStats({ isNight, isKo }: Props) {
  const stats = [
    {
      icon: <Lightning size={20} weight="bold" />,
      value: '200+',
      labelKo: '동시 접속 부하 테스트 완료',
      labelEn: 'Concurrent Sessions Load-Tested',
    },
    {
      icon: <ShieldCheck size={20} weight="bold" />,
      value: '0%',
      labelKo: '부하 테스트 중 오류율',
      labelEn: 'Failure Rate Under Peak Load',
    },
    {
      icon: <Cloud size={20} weight="bold" />,
      value: isKo ? 'Google Cloud' : 'Google Cloud',
      labelKo: '엔터프라이즈급 클라우드 인프라',
      labelEn: 'Enterprise-Grade Infrastructure',
    },
  ];

  return (
    <div className="hero-text flex flex-wrap items-center justify-center md:justify-start gap-x-8 gap-y-4 mt-8">
      {stats.map((stat, i) => (
        <div key={i} className="flex items-center gap-2.5">
          <span className="text-brand shrink-0">{stat.icon}</span>
          <div className="flex flex-col leading-tight">
            <span className={`text-sm font-black ${isNight ? 'text-white' : 'text-zinc-900'}`}>{stat.value}</span>
            <span className={`text-[11px] font-medium ${isNight ? 'text-zinc-500' : 'text-zinc-500'}`}>
              {isKo ? stat.labelKo : stat.labelEn}
            </span>
          </div>
        </div>
      ))}
    </div>
  );
}
