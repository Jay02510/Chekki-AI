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
import { TeacherInvitePanel } from './TeacherInvitePanel';

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
  onOpenLogoModal?: () => void;
  schoolId?: string;
  seatsTotal?: { ft: number; kt: number };
}

export const NativeDirectorPortal: React.FC<Props> = ({
  isNight = true,
  academyName = 'Apex English Academy (Seocho)',
  onOpenLogoModal,
  schoolId,
  seatsTotal
}) => {
  const [activeTab, setActiveTab] = useState<'roster' | 'curriculum' | 'exceptions' | 'teachers'>('curriculum');

  // Real state — starts empty for new directors. Data loads from Firestore via TeacherPage props.
  const [students, setStudents] = useState<StudentItem[]>([]);

  // Teacher Assignments — empty until director adds them
  const [teachers, setTeachers] = useState<TeacherItem[]>([]);

  // Modal / Add Student Form State
  const [showAddStudent, setShowAddStudent] = useState(false);
  const [newStudentEn, setNewStudentEn] = useState('');
  const [newStudentKo, setNewStudentKo] = useState('');
  const [newStudentClass, setNewStudentClass] = useState('');
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
  const [showSeatExpansionModal, setShowSeatExpansionModal] = useState(false);
  const [requestedExtraSeats, setRequestedExtraSeats] = useState(3);
  const [seatRequestSent, setSeatRequestSent] = useState(false);

  const handleExportRosterCSV = () => {
    const headers = "Student Name (EN),Student Name (KO),Grade,Assigned Class,Exception Flag,Exception Details\n";
    const rows = students.map((s) => 
      `"${s.nameEn}","${s.nameKo}","${s.grade}","${s.assignedClass}","${s.flaggedException ? 'YES' : 'NO'}","${s.flaggedException?.reason || 'None'}"`
    ).join("\n");
    
    const blob = new Blob(["\uFEFF" + headers + rows], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `${academyName.replace(/\s+/g, '_')}_Student_Roster_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div
      className={`p-6 sm:p-8 rounded-3xl border shadow-2xl space-y-8 font-sans transition-all ${
        isNight ? 'bg-[#060608] border-white/15 text-zinc-100' : 'bg-white border-zinc-200 text-zinc-900'
      }`}
    >
      {/* Setup-First Activation Header Banner */}
      {typeof window !== 'undefined' && sessionStorage.getItem('chekki_paid_active') !== 'true' && (
        <div className="p-4 rounded-2xl bg-gradient-to-r from-orange-500/20 via-amber-500/20 to-emerald-500/20 border border-orange-500/30 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 text-left">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-orange-500/20 border border-orange-500/30 text-orange-400 flex items-center justify-center font-bold text-lg shrink-0">
              🎉
            </div>
            <div>
              <h4 className="font-black text-sm text-white flex items-center gap-2">
                <span>{academyName || '어학원'} 캠퍼스 구축 완료!</span>
                <span className="px-2 py-0.5 rounded bg-orange-500/20 text-orange-400 text-[10px] font-mono border border-orange-500/30">
                  {sessionStorage.getItem('chekki_selected_plan')?.replace('_', ' ').toUpperCase() || 'MASTER SCHOOL PRO'} ({sessionStorage.getItem('chekki_teacher_seats') || '10'} SEATS ALLOWED)
                </span>
              </h4>
              <p className="text-xs text-zinc-300 mt-0.5">
                원생 숙제 자동 스캐너 &amp; 학부모 카카오톡 연동을 위해 결제를 완료하세요. (7일 100% 환불 보장)
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => {
              if (typeof window !== 'undefined') {
                sessionStorage.setItem('chekki_paid_school', academyName);
                window.location.href = '/schools';
              }
            }}
            className="px-5 py-3 bg-emerald-500 hover:bg-emerald-600 text-white font-black text-xs rounded-xl shadow-lg shadow-emerald-500/25 transition-all flex items-center justify-center gap-2 shrink-0 cursor-pointer active:scale-95"
          >
            <span>⚡ 결제 완료하고 최종 활성화하기 →</span>
          </button>
        </div>
      )}

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
          <div className="flex items-center gap-3">
            <h3 className="text-xl sm:text-2xl font-black tracking-tight flex items-center gap-2">
              <Buildings size={24} className="text-orange-500" />
              <span>{academyName}</span>
            </h3>
            <button
              type="button"
              onClick={() => {
                if (onOpenLogoModal) {
                  onOpenLogoModal();
                } else {
                  const evt = new CustomEvent('open_logo_modal');
                  window.dispatchEvent(evt);
                }
              }}
              className="px-3 py-1 bg-orange-500/10 hover:bg-orange-500/20 text-orange-400 text-[11px] font-bold rounded-xl border border-orange-500/20 transition-all cursor-pointer inline-flex items-center gap-1.5 active:scale-95"
            >
              <span>🖼️</span>
              <span>원장님 맞춤 로고 등록</span>
            </button>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => setActiveTab('curriculum')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer border ${
              activeTab === 'curriculum'
                ? 'bg-orange-500 border-orange-500 text-white shadow-md'
                : isNight
                ? 'bg-white/5 border-white/10 text-zinc-400 hover:text-white'
                : 'bg-zinc-100 border-zinc-200 text-zinc-700'
            }`}
          >
            <FolderUser size={16} weight="bold" className="text-orange-400" />
            <span>Curriculum &amp; Homework Stream</span>
          </button>

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

      {/* High-Level Metric Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-left">
        <div className={`p-5 rounded-2xl border ${isNight ? 'bg-white/5 border-white/10' : 'bg-zinc-50 border-zinc-200'}`}>
          <span className="text-[10px] font-bold uppercase tracking-widest text-zinc-400 block font-mono">CAMPUS CLASSES</span>
          <h4 className={`text-2xl font-black mt-1 ${isNight ? 'text-white' : 'text-zinc-900'}`}>
            {teachers.length > 0 ? teachers.reduce((a, t) => a + t.assignedClasses.length, 0) : '—'}{' '}
            <span className="text-xs font-normal text-zinc-400">Active</span>
          </h4>
        </div>
        <div className={`p-5 rounded-2xl border ${isNight ? 'bg-white/5 border-white/10' : 'bg-zinc-50 border-zinc-200'}`}>
          <span className="text-[10px] font-bold uppercase tracking-widest text-zinc-400 block font-mono">TOTAL ROSTER</span>
          <h4 className="text-2xl font-black text-orange-400 mt-1">{students.length} <span className="text-xs font-normal text-zinc-400">Enrolled</span></h4>
        </div>
        <div className={`p-5 rounded-2xl border ${isNight ? 'bg-white/5 border-white/10' : 'bg-zinc-50 border-zinc-200'}`}>
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold uppercase tracking-widest text-zinc-400 block font-mono">STAFF SEAT QUOTA</span>
            <button
              type="button"
              onClick={() => setShowSeatExpansionModal(true)}
              className="text-[10px] font-bold text-orange-400 hover:underline cursor-pointer"
            >
              + Add Seats
            </button>
          </div>
          <h4 className="text-2xl font-black text-emerald-400 mt-1">
            {teachers.length} <span className="text-xs font-normal text-zinc-400">/ {typeof window !== 'undefined' ? sessionStorage.getItem('chekki_teacher_seats') || '10' : '10'} Active</span>
          </h4>
        </div>
        <div className={`p-5 rounded-2xl border ${isNight ? 'bg-white/5 border-white/10' : 'bg-zinc-50 border-zinc-200'}`}>
          <span className="text-[10px] font-bold uppercase tracking-widest text-zinc-400 block font-mono">FLAGGED EXCEPTIONS</span>
          <h4 className="text-2xl font-black text-amber-400 mt-1">{flaggedStudents.filter(s => !s.flaggedException?.resolved).length} <span className="text-xs font-normal text-zinc-400">Unresolved</span></h4>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* TAB 0: CURRICULUM & HOMEWORK STREAM (Syllabus & Worksheet Oversight) */}
      {/* ========================================================================= */}
      {activeTab === 'curriculum' && (
        <div className="space-y-6 animate-fade-in text-left">

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* CARD 1: Course Syllabus Scope Stream */}
            <div className={`p-6 rounded-2xl border space-y-4 ${
              isNight ? 'bg-[#08080c] border-white/10' : 'bg-zinc-50 border-zinc-200'
            }`}>
              <div className="flex items-center justify-between border-b border-white/10 pb-3">
                <div className="flex items-center gap-2">
                  <span className="p-2 rounded-xl bg-blue-500/10 text-blue-400 border border-blue-500/20 font-bold text-xs">📘 SYLLABUS</span>
                  <div>
                    <h5 className={`font-bold text-sm ${isNight ? 'text-white' : 'text-zinc-900'}`}>Course Syllabus Stream</h5>
                    <p className="text-[10px] text-zinc-400">Multi-Week Vocabulary &amp; Phonics Scope per Class</p>
                  </div>
                </div>
              </div>

              <div className="flex flex-col items-center justify-center py-8 text-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-blue-500/10 border border-blue-500/20 text-blue-400 flex items-center justify-center">
                  <PlusCircle size={24} weight="bold" />
                </div>
                <p className={`text-sm font-bold ${isNight ? 'text-white' : 'text-zinc-800'}`}>No syllabi uploaded yet</p>
                <p className="text-xs text-zinc-400 max-w-[200px]">Teachers can upload course syllabi from the Manage Syllabus tab to populate this stream.</p>
              </div>
            </div>

            {/* CARD 2: Daily Homework Worksheets Stream */}
            <div className={`p-6 rounded-2xl border space-y-4 ${
              isNight ? 'bg-[#08080c] border-white/10' : 'bg-zinc-50 border-zinc-200'
            }`}>
              <div className="flex items-center justify-between border-b border-white/10 pb-3">
                <div className="flex items-center gap-2">
                  <span className="p-2 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-bold text-xs">📄 WORKSHEETS</span>
                  <div>
                    <h5 className={`font-bold text-sm ${isNight ? 'text-white' : 'text-zinc-900'}`}>Daily Homework Stream</h5>
                    <p className="text-[10px] text-zinc-400">Chekki Parent App Green Ink Overlays</p>
                  </div>
                </div>
              </div>

              <div className="flex flex-col items-center justify-center py-8 text-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center">
                  <PlusCircle size={24} weight="bold" />
                </div>
                <p className={`text-sm font-bold ${isNight ? 'text-white' : 'text-zinc-800'}`}>No worksheets submitted yet</p>
                <p className="text-xs text-zinc-400 max-w-[200px]">Teachers upload daily homework from the Manage Homework tab. Submissions appear here automatically.</p>
              </div>
            </div>
          </div>
        </div>
      )}

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

            {/* Action Cluster: Export CSV & Add Student CTA */}
            <div className="flex items-center gap-2 w-full sm:w-auto">
              <button
                type="button"
                onClick={handleExportRosterCSV}
                className="px-4 py-2.5 bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-400 font-bold border border-emerald-500/30 rounded-xl text-xs flex items-center justify-center gap-1.5 cursor-pointer transition-all active:scale-95"
              >
                <span>📥</span>
                <span>Export Roster to CSV</span>
              </button>
              <button
                type="button"
                onClick={() => setShowAddStudent(true)}
                className="px-4 py-2.5 bg-orange-500 hover:bg-orange-600 text-white font-bold rounded-xl text-xs flex items-center justify-center gap-1.5 shadow-md active:scale-95 cursor-pointer transition-all shrink-0"
              >
                <UserPlus size={16} weight="bold" />
                <span>+ Add Student to Class</span>
              </button>
            </div>
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
          {schoolId ? (
            <TeacherInvitePanel
              isNight={isNight}
              isKo={false}
              schoolId={schoolId}
              seatsTotal={seatsTotal || { ft: 0, kt: 0 }}
            />
          ) : (
            <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-xs text-amber-400 font-bold">
              School profile still loading — invites will be available once it finishes.
            </div>
          )}

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

      {/* SEAT EXPANSION REQUEST MODAL */}
      {showSeatExpansionModal && (
        <div className="fixed inset-0 z-[550] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
          <div className={`relative w-full max-w-md p-6 sm:p-8 rounded-3xl border shadow-2xl space-y-6 text-left transition-all ${
            isNight ? 'bg-[#0a0a0d] border-white/15 text-white' : 'bg-white border-zinc-300 text-zinc-900'
          }`}>
            <div className="flex items-center justify-between border-b border-white/10 pb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-orange-500/20 text-orange-400 flex items-center justify-center font-black text-lg">
                  ➕
                </div>
                <div>
                  <h3 className="font-black text-lg">교사 석 추가 (Seat Expansion)</h3>
                  <p className="text-xs text-zinc-400 font-mono">Current Allowance: {sessionStorage.getItem('chekki_teacher_seats') || '10'} Seats</p>
                </div>
              </div>
              <button 
                type="button"
                onClick={() => { setShowSeatExpansionModal(false); setSeatRequestSent(false); }}
                className="p-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-zinc-400 hover:text-white transition-colors cursor-pointer"
              >
                ✕
              </button>
            </div>

            {seatRequestSent ? (
              <div className="p-6 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-center space-y-3">
                <span className="text-3xl block">🎉</span>
                <h4 className="font-black text-emerald-400 text-base">교사 석 추가 청구서 발송 완료!</h4>
                <p className="text-xs text-zinc-300 leading-relaxed">
                  +{requestedExtraSeats}석 추가 세금계산서 청구서가 등록되었습니다.<br />
                  전자세금계산서 발행 후 즉시 추가 교사 계정 초대가 활성화됩니다.
                </p>
                <button
                  type="button"
                  onClick={() => { setShowSeatExpansionModal(false); setSeatRequestSent(false); }}
                  className="px-6 py-2.5 bg-emerald-500 hover:bg-emerald-600 text-white font-bold text-xs rounded-xl transition-all cursor-pointer"
                >
                  확인 완료
                </button>
              </div>
            ) : (
              <div className="space-y-4 text-xs">
                <p className={isNight ? 'text-zinc-300' : 'text-zinc-700'}>
                  원어민 강사(FT) 또는 한국인 코티처(KT)를 추가 등록하기 위해 교사 계정 석을 확장합니다. (석당 ₩19,000 / 월)
                </p>

                <div className="space-y-2">
                  <label className="font-bold text-zinc-400 block font-mono">추가 교사 석 수 선택:</label>
                  <div className="grid grid-cols-3 gap-2">
                    {[+1, +3, +5].map((count) => (
                      <button
                        key={count}
                        type="button"
                        onClick={() => setRequestedExtraSeats(count)}
                        className={`p-3 rounded-xl border text-xs font-black transition-all cursor-pointer ${
                          requestedExtraSeats === count
                            ? 'bg-orange-500 border-orange-500 text-white shadow-md'
                            : isNight ? 'bg-white/5 border-white/10 text-zinc-400' : 'bg-zinc-100 border-zinc-200 text-zinc-700'
                        }`}
                      >
                        +{count}석 추가
                      </button>
                    ))}
                  </div>
                </div>

                <div className={`p-4 rounded-2xl border ${isNight ? 'bg-white/5 border-white/10' : 'bg-zinc-50 border-zinc-200'}`}>
                  <div className="flex justify-between items-center text-xs font-mono">
                    <span className="text-zinc-400">추가 석 요금:</span>
                    <strong className="text-orange-400">₩{(requestedExtraSeats * 19000).toLocaleString()} / 월</strong>
                  </div>
                  <p className="text-[10px] text-zinc-500 mt-1">계좌이체 세금계산서로합산 청구됩니다.</p>
                </div>

                <button
                  type="button"
                  onClick={() => {
                    const current = Number(sessionStorage.getItem('chekki_teacher_seats') || '10');
                    sessionStorage.setItem('chekki_teacher_seats', (current + requestedExtraSeats).toString());
                    setSeatRequestSent(true);
                  }}
                  className="w-full py-3.5 bg-orange-500 hover:bg-orange-600 text-white font-black text-xs rounded-xl shadow-lg transition-all cursor-pointer"
                >
                  ⚡ +{requestedExtraSeats}석 추가 세금계산서 청구하기 →
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
