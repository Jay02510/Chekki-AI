import React, { useState } from 'react';
import {
  BookOpen,
  Sparkle,
  CheckCircle,
  UploadSimple,
  FileText,
  BookmarkSimple,
  Lightning,
  ArrowsClockwise,
  ArrowRight
} from '@phosphor-icons/react';

interface Props {
  isNight?: boolean;
}

export const NativeCurriculumPreseed: React.FC<Props> = ({ isNight = true }) => {
  const [selectedBook, setSelectedBook] = useState<string>('bricks-150');
  const [selectedUnit, setSelectedUnit] = useState<number>(4);
  const [isScanningOcr, setIsScanningOcr] = useState<boolean>(false);
  const [scannedSuccess, setScannedSuccess] = useState<boolean>(false);

  const textbooks = [
    {
      id: 'bricks-150',
      title: 'Bricks Reading 150 (Book 1)',
      publisher: 'Bricks Education',
      targetLevel: 'Elementary Grade 3-4',
      units: [
        { unitNum: 1, title: 'The Solar System', vocab: ['Planet', 'Orbit', 'Gravity', 'Galaxy'] },
        { unitNum: 2, title: 'Deep Sea Creatures', vocab: ['Bioluminescence', 'Trench', 'Octopus', 'Coral'] },
        { unitNum: 3, title: 'Ancient Egypt', vocab: ['Pyramid', 'Pharaoh', 'Papyrus', 'Hieroglyph'] },
        { unitNum: 4, title: 'Photosynthesis & Plants', vocab: ['Chloroplast', 'Stomata', 'Glucose', 'Carbon Dioxide'] }
      ]
    },
    {
      id: 'subject-link-3',
      title: 'Subject Link 3',
      publisher: 'NE Build & Grow',
      targetLevel: 'Elementary Grade 4-5',
      units: [
        { unitNum: 1, title: 'Ecosystems & Food Chains', vocab: ['Producer', 'Consumer', 'Decomposer', 'Prey'] },
        { unitNum: 2, title: 'Architectural Wonders', vocab: ['Skyscraper', 'Blueprint', 'Arch', 'Foundation'] },
        { unitNum: 3, title: 'The Industrial Revolution', vocab: ['Steam Engine', 'Factory', 'Assembly', 'Locomotive'] },
        { unitNum: 4, title: 'Renewable Energy', vocab: ['Solar Panel', 'Turbine', 'Geothermal', 'Biomass'] }
      ]
    }
  ];

  const currentTextbook = textbooks.find((b) => b.id === selectedBook) || textbooks[0];
  const currentUnitObj = currentTextbook.units.find((u) => u.unitNum === selectedUnit) || currentTextbook.units[3];

  const handleSimulateOcrScan = () => {
    setIsScanningOcr(true);
    setScannedSuccess(false);
    setTimeout(() => {
      setIsScanningOcr(false);
      setScannedSuccess(true);
    }, 1200);
  };

  return (
    <div
      className={`p-6 sm:p-8 rounded-3xl border shadow-2xl space-y-8 font-sans transition-all ${
        isNight ? 'bg-brand-dark border-white/15 text-zinc-100' : 'bg-white border-zinc-200 text-zinc-900'
      }`}
    >
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/10 pb-6">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-[10px] font-black uppercase tracking-widest text-orange-500 font-mono">
              PRODUCT B (SCHOOL PRO FEATURE)
            </span>
            <span className="px-2.5 py-0.5 rounded text-[10px] font-mono font-bold bg-purple-500/20 text-purple-400 border border-purple-500/30">
              Verified Textbook Vocabulary Sync
            </span>
          </div>
          <h3 className="text-xl sm:text-2xl font-black tracking-tight flex items-center gap-2">
            <BookOpen size={24} className="text-orange-500" />
            <span>Curriculum & Textbook Pre-Seeding Hub</span>
          </h3>
        </div>

        <span className="px-3.5 py-1.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-xs font-bold self-start sm:self-auto">
          ⚡ Auto-Fills Foreign Teacher Forms in &lt;15s
        </span>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left Column: Preset Textbooks & Syllabus Photo Upload (5 cols) */}
        <div className="lg:col-span-5 space-y-6">
          {/* 1. Photo Syllabus Scanner Box */}
          <div className={`p-5 rounded-2xl border space-y-4 ${isNight ? 'bg-brand-dark border-orange-500/30' : 'bg-orange-50/50 border-orange-200'}`}>
            <div className="flex items-center justify-between">
              <span className="text-xs font-black uppercase tracking-wider font-mono text-orange-500 flex items-center gap-1.5">
                <UploadSimple size={16} />
                <span>1-Photo Syllabus Scanner</span>
              </span>
              <span className="text-[10px] font-mono font-bold text-emerald-400">Photo / PDF Upload</span>
            </div>

            <p className={`text-xs leading-relaxed ${isNight ? 'text-zinc-400' : 'text-zinc-600'}`}>
              Upload or snap a photo of your textbook syllabus. Chekki AI automatically extracts all units, topics, and target vocabulary.
            </p>

            <button
              type="button"
              onClick={handleSimulateOcrScan}
              disabled={isScanningOcr}
              className="w-full py-3 bg-orange-500 hover:bg-orange-600 text-white font-bold rounded-xl text-xs shadow-md transition-all active:scale-95 cursor-pointer flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {isScanningOcr ? (
                <>
                  <ArrowsClockwise size={16} className="animate-spin text-white" />
                  <span>Reading Syllabus Page & Extracting Units...</span>
                </>
              ) : (
                <>
                  <Sparkle size={16} weight="fill" />
                  <span>Scan 1-Page Syllabus Photo</span>
                </>
              )}
            </button>

            {scannedSuccess && (
              <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center gap-2 text-xs text-emerald-400 font-medium">
                <CheckCircle size={16} weight="fill" />
                <span>Syllabus Scanned! 16 Units & 64 Target Words Pre-Seeded into DB.</span>
              </div>
            )}
          </div>

          {/* 2. Textbook Selector */}
          <div className="space-y-3">
            <span className="text-xs font-black uppercase tracking-wider font-mono text-zinc-400 block">
              Or Pick Pre-Loaded Textbook Preset:
            </span>
            <div className="space-y-2.5">
              {textbooks.map((b) => (
                <button
                  key={b.id}
                  type="button"
                  onClick={() => setSelectedBook(b.id)}
                  className={`w-full text-left p-4 rounded-2xl border text-xs transition-all flex items-center justify-between cursor-pointer ${
                    selectedBook === b.id
                      ? isNight
                        ? 'bg-[#0f0b08] border-orange-500 text-white shadow-lg shadow-orange-500/10'
                        : 'bg-orange-50/80 border-orange-500 text-zinc-900 shadow-md'
                      : isNight
                      ? 'bg-white/5 border-white/10 text-zinc-400 hover:border-white/20'
                      : 'bg-zinc-50 border-zinc-200 text-zinc-700 hover:border-zinc-300'
                  }`}
                >
                  <div className="space-y-1">
                    <h4 className="font-black text-sm">{b.title}</h4>
                    <p className="text-[11px] text-zinc-500 font-mono">{b.publisher} • {b.targetLevel}</p>
                  </div>
                  {selectedBook === b.id && (
                    <div className="w-2.5 h-2.5 rounded-full bg-orange-500 shrink-0 animate-pulse" />
                  )}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Right Column: Pre-Seeded Scope & Sequence View (7 cols) */}
        <div className="lg:col-span-7 space-y-6">
          <div className={`p-6 sm:p-8 rounded-3xl border space-y-6 ${isNight ? 'bg-brand-dark border-white/10' : 'bg-zinc-50 border-zinc-200'}`}>
            <div className="flex items-center justify-between border-b border-white/10 pb-4">
              <div>
                <span className="text-[10px] font-mono font-bold text-orange-500 uppercase block mb-1">
                  Active Pre-Seeded Scope & Sequence
                </span>
                <h4 className="text-lg font-black text-white">{currentTextbook.title}</h4>
              </div>
              <span className="px-3 py-1 rounded-full bg-orange-500/10 text-orange-400 border border-orange-500/20 text-xs font-mono font-bold">
                Pre-Seeded RAG
              </span>
            </div>

            {/* Unit Selector Pills */}
            <div className="space-y-2">
              <span className="text-xs font-bold text-zinc-400 block font-mono">Select Teaching Unit / Week:</span>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {currentTextbook.units.map((u) => (
                  <button
                    key={u.unitNum}
                    type="button"
                    onClick={() => setSelectedUnit(u.unitNum)}
                    className={`p-3 rounded-xl border text-xs font-bold transition-all text-center cursor-pointer ${
                      selectedUnit === u.unitNum
                        ? 'bg-orange-500 border-orange-500 text-white shadow-md'
                        : isNight
                        ? 'bg-white/5 border-white/10 text-zinc-400 hover:text-white'
                        : 'bg-white border-zinc-200 text-zinc-700'
                    }`}
                  >
                    Unit {u.unitNum}
                  </button>
                ))}
              </div>
            </div>

            {/* Selected Unit Details Box */}
            <div className={`p-5 rounded-2xl border space-y-4 ${isNight ? 'bg-brand-dark border-white/10' : 'bg-white border-zinc-200'}`}>
              <div className="flex items-center justify-between">
                <span className="text-xs font-mono font-bold text-emerald-400 uppercase">
                  Unit {currentUnitObj.unitNum} Topic:
                </span>
                <span className="text-xs font-mono text-zinc-500">Auto-Linked to Roster</span>
              </div>

              <h4 className="text-base font-black text-white">{currentUnitObj.title}</h4>

              <div className="space-y-3 pt-2 border-t border-white/5">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-zinc-400 block font-mono">Pre-Seeded Target Vocabulary Words:</span>
                  <span className="text-[10px] font-bold text-orange-400 font-mono">✏️ Human-in-the-Loop Editable</span>
                </div>
                <div className="flex flex-wrap gap-2">
                  {currentUnitObj.vocab.map((w, idx) => (
                    <span
                      key={idx}
                      className="px-3 py-1.5 rounded-xl bg-orange-500/10 text-orange-400 border border-orange-500/30 text-xs font-bold font-mono flex items-center gap-1.5"
                    >
                      <span>{w}</span>
                      <button
                        type="button"
                        title="Remove word"
                        onClick={() => {
                          const updated = currentUnitObj.vocab.filter((_, i) => i !== idx);
                          currentUnitObj.vocab = updated;
                          setSelectedUnit(selectedUnit); // force trigger re-render
                        }}
                        className="text-orange-500/60 hover:text-orange-400 font-bold ml-1 cursor-pointer"
                      >
                        ×
                      </button>
                    </span>
                  ))}
                  <button
                    type="button"
                    onClick={() => {
                      const newWord = prompt('Enter custom vocabulary word to add:', 'Photosynthesis');
                      if (newWord && newWord.trim()) {
                        currentUnitObj.vocab.push(newWord.trim());
                        setSelectedUnit(selectedUnit);
                      }
                    }}
                    className="px-3 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 text-zinc-300 border border-dashed border-white/20 text-xs font-bold font-mono transition-all cursor-pointer flex items-center gap-1"
                  >
                    <span>+ Add Custom Word</span>
                  </button>
                </div>
              </div>
            </div>

            {/* Impact Note */}
            <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center gap-3 text-xs">
              <Lightning size={20} className="text-emerald-400 shrink-0" />
              <p className={isNight ? 'text-zinc-300' : 'text-zinc-700'}>
                <strong>How it works for teachers:</strong> When Foreign Teachers open their mobile form, Unit {currentUnitObj.unitNum} ({currentUnitObj.title}) and all target vocabulary are pre-selected automatically.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
