import React, { useState } from 'react';
import {
  Buildings,
  Users,
  UserPlus,
  Trash,
  CheckCircle,
  WarningCircle,
  PhoneCall,
  MagnifyingGlass,
  Gear,
  PencilSimple,
  UserGear,
  PlusCircle,
  DotsThreeVertical,
  SlidersHorizontal,
  FolderUser,
  EnvelopeSimple
} from '@phosphor-icons/react';

interface StudentItem {
  id: string;
  nameEn: string;
  nameKo: string;
  grade: string;
  assignedClass: string;
  flaggedException?: {
    date: string;
    reason: string;
    teacherName: string;
    resolved: boolean;
  };
}

interface TeacherItem {
  id: string;
  name: string;
  role: 'foreign_teacher' | 'korean_teacher';
  email: string;
  assignedClasses: string[];
}

interface Props {
  isNight?: boolean;
  academyName?: string;
}

export const NativeDirectorPortal: React.FC<Props> = ({
  isNight = true,
  academyName = 'Apex English Academy (Seocho)'
}) => {
  const [activeTab, setActiveTab] = useState<'roster' | 'exceptions' | 'teachers'>('roster');

  // Sample State for Class Rosters
  const [students, setStudents] = useState<StudentItem[]>([
    {
      id: 'st-1',
      nameEn: 'Min-jun Kim',
      nameKo: '김민준',
      grade: 'Grade 4',
      assignedClass: '7A Sunshine',
      flaggedException: {
        date: '2026-07-27',
        reason: 'Struggled with target word "Photosynthesis". Homework unsubmitted.',
        teacherName: 'Sarah Teacher (FT)',
        resolved: false
      }
    },
    {
      id: 'st-2',
      nameEn: 'Seo-yeon Park',
      nameKo: '박서연',
      grade: 'Grade 4',
      assignedClass: '7A Sunshine'
    },
    {
      id: 'st-3',
      nameEn: 'Ji-hoo Lee',
      nameKo: '이지후',
      grade: 'Grade 5',
      assignedClass: '8B Excellence',
      flaggedException: {
        date: '2026-07-26',
        reason: 'Hesitant during speaking assessment. Needs encouragement at home.',
        teacherName: 'Mark Teacher (FT)',
        resolved: true
      }
    },
    {
      id: 'st-4',
      nameEn: 'Yuna Choi',
      nameKo: '최유나',
      grade: 'Grade 5',
      assignedClass: '8B Excellence'
    }
  ]);

  // Sample State for Teacher Assignments
  const [teachers, setTeachers] = useState<TeacherItem[]>([
    {
      id: 't-1',
      name: 'Sarah Miller',
      role: 'foreign_teacher',
      email: 'sarah.miller@apex.edu',
      assignedClasses: ['7A Sunshine', '7B Star']
    },
    {
      id: 't-2',
      name: 'Mark Davis',
      role: 'foreign_teacher',
      email: 'mark.davis@apex.edu',
      assignedClasses: ['8B Excellence']
    },
    {
      id: 't-3',
      name: 'Ji-young Kang (강지영)',
      role: 'korean_teacher',
      email: 'jiyoung.kang@apex.edu',
      assignedClasses: ['7A Sunshine', '8B Excellence']
    }
  ]);

  // Modal / Add Student Form State
  const [showAddStudent, setShowAddStudent] = useState(false);
  const [newStudentEn, setNewStudentEn] = useState('');
  const [newStudentKo, setNewStudentKo] = useState('');
  const [newStudentClass, setNewStudentClass] = useState('7A Sunshine');
  const [newStudentGrade, setNewStudentGrade] = useState('Grade 4');

  // Search filter
  const [searchTerm, setSearchTerm] = useState('');

  const handleAddStudent = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newStudentEn || !newStudentKo) return;

    const newSt: StudentItem = {
      id: `st-${Date.now()}`,
      nameEn: newStudentEn,
      nameKo: newStudentKo,
      grade: newStudentGrade,
      assignedClass: newStudentClass
    };

    setStudents([newSt, ...students]);
    setNewStudentEn('');
    setNewStudentKo('');
    setShowAddStudent(false);
  };

  const handleRemoveStudent = (id: string) => {
    if (confirm('Are you sure you want to remove this student from the class roster?')) {
      setStudents(students.filter((s) => s.id !== id));
    }
  };

  const filteredStudents = students.filter(
    (s) =>
      s.nameEn.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.nameKo.includes(searchTerm) ||
      s.assignedClass.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const flaggedStudents = students.filter((s) => s.flaggedException);

  return (
    <div
      className={`p-6 sm:p-8 rounded-3xl border shadow-2xl space-y-8 font-sans transition-all ${
        isNight ? 'bg-[#060608] border-white/15 text-zinc-100' : 'bg-white border-zinc-200 text-zinc-900'
      }`}
    >
      {/* Portal Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-white/10 pb-6">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-[10px] font-black uppercase tracking-widest text-orange-500 font-mono">
              DIRECTOR ADMIN PORTAL
            </span>
            <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-orange-500/10 text-orange-400 border border-orange-500/20">
              Campus Manager
            </span>
          </div>
          <h3 className="text-xl sm:text-2xl font-black tracking-tight flex items-center gap-2">
            <Buildings size={24} className="text-orange-500" />
            <span>{academyName}</span>
          </h3>
        </div>

        {/* Tab Navigation */}
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => setActiveTab('roster')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer border ${
              activeTab === 'roster'
                ? 'bg-orange-500 border-orange-500 text-white shadow-md'
                : isNight
                ? 'bg-white/5 border-white/10 text-zinc-400 hover:text-white'
                : 'bg-zinc-100 border-zinc-200 text-zinc-700'
            }`}
          >
            <Users size={16} weight="bold" />
            <span>Class Rosters ({students.length})</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('exceptions')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer border relative ${
              activeTab === 'exceptions'
                ? 'bg-orange-500 border-orange-500 text-white shadow-md'
                : isNight
                ? 'bg-white/5 border-white/10 text-zinc-400 hover:text-white'
                : 'bg-zinc-100 border-zinc-200 text-zinc-700'
            }`}
          >
            <WarningCircle size={16} weight="bold" className="text-amber-400" />
            <span>Flagged Exceptions ({flaggedStudents.length})</span>
            {flaggedStudents.some((s) => !s.flaggedException?.resolved) && (
              <span className="w-2 h-2 rounded-full bg-rose-500 absolute -top-1 -right-1 animate-ping" />
            )}
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('teachers')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer border ${
              activeTab === 'teachers'
                ? 'bg-orange-500 border-orange-500 text-white shadow-md'
                : isNight
                ? 'bg-white/5 border-white/10 text-zinc-400 hover:text-white'
                : 'bg-zinc-100 border-zinc-200 text-zinc-700'
            }`}
          >
            <UserGear size={16} weight="bold" />
            <span>Teacher Assignments</span>
          </button>
        </div>
      </div>

      {/* Privacy Reassurance Banner */}
      <div className="p-3.5 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-xs flex items-center justify-between text-emerald-400 font-mono">
        <div className="flex items-center gap-2">
          <span>🛡️</span>
          <span className="font-bold">100% Student PII Protection (개인정보보호법 준수)</span>
          <span className="hidden md:inline text-zinc-400">• Zero-Roster Exposure: Parents must enter their child's exact name. Student lists are never exposed to public view.</span>
        </div>
        <span className="px-2 py-0.5 rounded bg-emerald-500/20 text-[10px] font-black border border-emerald-500/30 shrink-0">
          ENCRYPTED ISOLATION
        </span>
      </div>

      {/* ========================================================================= */}
      {/* TAB 1: CLASS ROSTERS & STUDENT MANAGEMENT */}
      {/* ========================================================================= */}
      {activeTab === 'roster' && (
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            {/* Search Input */}
            <div className="relative w-full sm:w-72">
              <MagnifyingGlass size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-400" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search student or class..."
                className={`w-full pl-9 pr-4 py-2.5 rounded-xl border text-xs font-medium focus:outline-none transition-all ${
                  isNight
                    ? 'bg-[#08080c] border-white/10 text-white focus:border-orange-500'
                    : 'bg-white border-zinc-300 text-zinc-900 focus:border-orange-500 shadow-sm'
                }`}
              />
            </div>

            {/* Add Student CTA */}
            <button
              type="button"
              onClick={() => setShowAddStudent(true)}
              className="w-full sm:w-auto px-4 py-2.5 bg-orange-500 hover:bg-orange-600 text-white font-bold rounded-xl text-xs flex items-center justify-center gap-1.5 shadow-md active:scale-95 cursor-pointer transition-all"
            >
              <UserPlus size={16} weight="bold" />
              <span>+ Add Student to Class</span>
            </button>
          </div>

          {/* Add Student Modal / Slide-down Form */}
          {showAddStudent && (
            <form
              onSubmit={handleAddStudent}
              className={`p-6 rounded-2xl border space-y-4 transition-all ${
                isNight ? 'bg-[#08080c] border-orange-500/40' : 'bg-orange-50/50 border-orange-300'
              }`}
            >
              <div className="flex items-center justify-between border-b border-white/10 pb-3">
                <h4 className="font-black text-sm text-orange-500 flex items-center gap-2">
                  <UserPlus size={18} />
                  <span>Add New Student to Roster</span>
                </h4>
                <button
                  type="button"
                  onClick={() => setShowAddStudent(false)}
                  className="text-xs text-zinc-400 hover:text-white"
                >
                  Cancel
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 text-xs font-medium">
                <div>
                  <label className="block text-zinc-400 mb-1">English Name</label>
                  <input
                    type="text"
                    required
                    value={newStudentEn}
                    onChange={(e) => setNewStudentEn(e.target.value)}
                    placeholder="e.g. Min-jun Kim"
                    className={`w-full p-2.5 rounded-xl border ${
                      isNight ? 'bg-[#030305] border-white/10 text-white' : 'bg-white border-zinc-300 text-zinc-900'
                    }`}
                  />
                </div>
                <div>
                  <label className="block text-zinc-400 mb-1">Korean Name</label>
                  <input
                    type="text"
                    required
                    value={newStudentKo}
                    onChange={(e) => setNewStudentKo(e.target.value)}
                    placeholder="e.g. 김민준"
                    className={`w-full p-2.5 rounded-xl border ${
                      isNight ? 'bg-[#030305] border-white/10 text-white' : 'bg-white border-zinc-300 text-zinc-900'
                    }`}
                  />
                </div>
                <div>
                  <label className="block text-zinc-400 mb-1">Assign Class</label>
                  <select
                    value={newStudentClass}
                    onChange={(e) => setNewStudentClass(e.target.value)}
                    className={`w-full p-2.5 rounded-xl border ${
                      isNight ? 'bg-[#030305] border-white/10 text-white' : 'bg-white border-zinc-300 text-zinc-900'
                    }`}
                  >
                    <option value="7A Sunshine">7A Sunshine</option>
                    <option value="8B Excellence">8B Excellence</option>
                    <option value="6C Phonics">6C Phonics</option>
                  </select>
                </div>
                <div className="flex items-end">
                  <button
                    type="submit"
                    className="w-full py-2.5 bg-orange-500 hover:bg-orange-600 text-white font-bold rounded-xl text-xs cursor-pointer shadow-md active:scale-95 transition-all"
                  >
                    Save Student
                  </button>
                </div>
              </div>
            </form>
          )}

          {/* Student Roster Table */}
          <div
            className={`rounded-2xl border overflow-hidden ${
              isNight ? 'bg-[#050507] border-white/10' : 'bg-white border-zinc-200'
            }`}
          >
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead
                  className={`font-mono text-[11px] uppercase tracking-wider ${
                    isNight ? 'bg-white/5 text-zinc-400' : 'bg-zinc-100 text-zinc-600'
                  }`}
                >
                  <tr>
                    <th className="p-4">Student Name (EN/KO)</th>
                    <th className="p-4">Grade</th>
                    <th className="p-4">Assigned Class</th>
                    <th className="p-4">Exception Status</th>
                    <th className="p-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className={`divide-y ${isNight ? 'divide-white/5' : 'divide-zinc-200'}`}>
                  {filteredStudents.map((st) => (
                    <tr key={st.id} className={isNight ? 'hover:bg-white/[0.02]' : 'hover:bg-zinc-50'}>
                      <td className="p-4 font-bold">
                        <div className="flex items-center gap-2">
                          <span className={isNight ? 'text-white' : 'text-zinc-900'}>{st.nameEn}</span>
                          <span className="text-zinc-400 font-normal">({st.nameKo})</span>
                        </div>
                      </td>
                      <td className="p-4 text-zinc-400">{st.grade}</td>
                      <td className="p-4">
                        <span className="px-2.5 py-1 rounded-full bg-orange-500/10 text-orange-400 font-bold border border-orange-500/20 text-[11px]">
                          {st.assignedClass}
                        </span>
                      </td>
                      <td className="p-4">
                        {st.flaggedException ? (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-amber-500/20 text-amber-400 font-bold text-[11px] border border-amber-500/30">
                            <WarningCircle size={14} />
                            <span>Flagged Issue</span>
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 text-[11px] text-zinc-500 font-mono">
                            <CheckCircle size={13} className="text-emerald-500" />
                            <span>Normal</span>
                          </span>
                        )}
                      </td>
                      <td className="p-4 text-right">
                        <button
                          type="button"
                          onClick={() => handleRemoveStudent(st.id)}
                          className="p-1.5 text-zinc-400 hover:text-rose-400 transition-colors cursor-pointer"
                          title="Remove student from roster"
                        >
                          <Trash size={16} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 2: FLAGGED STUDENT EXCEPTION CENTER */}
      {/* ========================================================================= */}
      {activeTab === 'exceptions' && (
        <div className="space-y-6">
          <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-start gap-3">
            <WarningCircle size={20} className="text-amber-400 shrink-0 mt-0.5" />
            <div className="space-y-1 text-xs">
              <h4 className="font-bold text-amber-400">Director Exception Oversight Center</h4>
              <p className={isNight ? 'text-zinc-300' : 'text-zinc-700'}>
                Foreign teachers flagged these specific students for academic or behavioral issues during daily logs.
                Korean counselors use these pre-generated talking points for parent phone calls.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {flaggedStudents.map((st) => (
              <div
                key={st.id}
                className={`p-6 rounded-2xl border space-y-4 ${
                  isNight ? 'bg-[#08080c] border-white/10' : 'bg-white border-zinc-200 shadow-sm'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-black text-sm text-white">
                      {st.nameEn} ({st.nameKo})
                    </h4>
                    <span className="text-xs text-orange-400 font-mono">{st.assignedClass}</span>
                  </div>
                  <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-amber-500/20 text-amber-400 border border-amber-500/30">
                    {st.flaggedException?.date}
                  </span>
                </div>

                <div className={`p-4 rounded-xl border text-xs leading-relaxed ${isNight ? 'bg-[#030305] border-white/5 text-zinc-300' : 'bg-zinc-50 border-zinc-200 text-zinc-800'}`}>
                  <span className="text-[10px] font-bold uppercase font-mono text-zinc-500 block mb-1">
                    Flagged Reason by {st.flaggedException?.teacherName}:
                  </span>
                  <p>{st.flaggedException?.reason}</p>
                </div>

                <div className="flex items-center justify-between pt-2 border-t border-white/5 text-xs">
                  <span className="text-zinc-400 font-mono text-[11px]">Parent Consultation Prep Ready</span>
                  <button
                    type="button"
                    onClick={() => {
                      alert(`Phone Talking Points for ${st.nameKo}:\n1. Acknowledge class effort\n2. Address: ${st.flaggedException?.reason}\n3. Suggest 10-minute home vocabulary review.`);
                    }}
                    className="px-3 py-1.5 bg-orange-500/10 hover:bg-orange-500/20 text-orange-400 font-bold rounded-lg border border-orange-500/30 flex items-center gap-1.5 cursor-pointer transition-colors"
                  >
                    <PhoneCall size={14} />
                    <span>View Phone Script</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 3: TEACHER ASSIGNMENTS & CLASS ALLOCATION */}
      {/* ========================================================================= */}
      {activeTab === 'teachers' && (
        <div className="space-y-6">
          <div className="p-4 rounded-2xl bg-blue-500/10 border border-blue-500/20 flex items-start gap-3">
            <UserGear size={20} className="text-blue-400 shrink-0 mt-0.5" />
            <div className="space-y-1 text-xs">
              <h4 className="font-bold text-blue-400">Teacher & Class Allocation</h4>
              <p className={isNight ? 'text-zinc-300' : 'text-zinc-700'}>
                Assign Foreign Teachers (FT) to generate daily class logs and Korean Teachers (KT) to review and copy KakaoTalk scripts.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {teachers.map((t) => (
              <div
                key={t.id}
                className={`p-6 rounded-2xl border space-y-4 ${
                  isNight ? 'bg-[#08080c] border-white/10' : 'bg-white border-zinc-200 shadow-sm'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span
                    className={`px-2.5 py-1 rounded-full text-[10px] font-bold font-mono border ${
                      t.role === 'foreign_teacher'
                        ? 'bg-purple-500/20 text-purple-400 border-purple-500/30'
                        : 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30'
                    }`}
                  >
                    {t.role === 'foreign_teacher' ? 'Foreign Teacher (FT)' : 'Korean Teacher (KT)'}
                  </span>
                  <EnvelopeSimple size={16} className="text-zinc-500" />
                </div>

                <div>
                  <h4 className="font-black text-base text-white">{t.name}</h4>
                  <p className="text-xs text-zinc-400 font-mono mt-0.5">{t.email}</p>
                </div>

                <div className="space-y-2 pt-2 border-t border-white/5 text-xs">
                  <span className="text-zinc-400 font-bold block">Assigned Classes:</span>
                  <div className="flex flex-wrap gap-1.5">
                    {t.assignedClasses.map((cls, idx) => (
                      <span
                        key={idx}
                        className="px-2.5 py-1 rounded-lg bg-white/5 border border-white/10 font-mono text-[11px] text-zinc-300"
                      >
                        {cls}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
