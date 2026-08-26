import React, { useMemo, useState } from 'react';
import {
  useReactTable,
  getCoreRowModel,
  getSortedRowModel,
  getFilteredRowModel,
  createColumnHelper,
  flexRender,
  type SortingState,
} from '@tanstack/react-table';
import { Warning, MagnifyingGlass, DownloadSimple, CaretUp, CaretDown, CaretUpDown, CheckCircle } from '@phosphor-icons/react';
import { downloadCSV } from '../utils/csvExport';
import { StatTile } from './ui/StatTile';

interface Props {
  isNight: boolean;
  isKo: boolean;
  activeRoster: any[];
  pendingRoster: any[];
  invitedOnlyRosterRows?: any[];
  isLoadingRoster: boolean;
  fetchRosterAndMistakes: () => void;
  classes: any[];
  selectedClass: any;
  handleMoveStudent: (uid: string, targetClassId: string) => void;
  handleRemoveStudent: (uid: string) => void;
  setSelectedStudentDetails: (student: any) => void;
}

type Row = {
  uid: string;
  studentName: string;
  parentName: string;
  parentEmail: string;
  className: string;
  classId: string;
  status: string;
  lastScanDate: string;
  weeklyMistakesCount: number;
  flagged: boolean;
  isInvitedOnly: boolean;
  raw: any;
};

const columnHelper = createColumnHelper<Row>();

/**
 * Director's "Student Database" — an Airtable-style view over the same
 * roster data NativeDirectorStudentsTab already fetches (activeRoster +
 * pendingRoster), added as a sibling view rather than a replacement: that
 * tab stays the approval workflow (pending approve/decline), this one is
 * for scanning/searching/sorting the whole roster at once. Mutations
 * (move/remove) call the same handlers TeacherPage already wires up —
 * no new Firestore writes introduced here.
 */
export function StudentDatabaseGrid({
  isNight,
  isKo,
  activeRoster,
  pendingRoster,
  invitedOnlyRosterRows = [],
  isLoadingRoster,
  fetchRosterAndMistakes,
  classes,
  selectedClass,
  handleMoveStudent,
  handleRemoveStudent,
  setSelectedStudentDetails,
}: Props) {
  const [globalFilter, setGlobalFilter] = useState('');
  const [classFilter, setClassFilter] = useState('');
  const [sorting, setSorting] = useState<SortingState>([]);
  // Neither handler is guarded against a rapid double-action (e.g. two Move
  // requests for the same student fired before the first roster refresh
  // lands) — one shared busy flag blocks a second mutation until the first
  // one's Firestore round-trip finishes.
  const [isActionBusy, setIsActionBusy] = useState(false);
  const runAction = async (action: () => void) => {
    if (isActionBusy) return;
    setIsActionBusy(true);
    try {
      await action();
    } finally {
      setIsActionBusy(false);
    }
  };

  const classNameById = useMemo(() => {
    const map = new Map<string, string>();
    classes.forEach((c) => map.set(c.id, c.name));
    return map;
  }, [classes]);

  const data = useMemo<Row[]>(() => {
    const combined = [
      ...pendingRoster.map((s) => ({ ...s, __status: 'pending' })),
      ...activeRoster.map((s) => ({ ...s, __status: 'active' })),
      // Invited-by-director students with no parent redemption yet have no
      // classId of their own (see useRosterAnalytics.ts's invitedOnlyRosterRows)
      // — this roster is already scoped to a single selectedClass, so it's safe
      // to attribute them to it directly.
      ...invitedOnlyRosterRows.map((s) => ({ ...s, __status: 'active', classId: selectedClass?.id })),
    ];
    return combined.map((s) => ({
      uid: s.uid,
      studentName: s.studentName || 'Unnamed',
      parentName: s.name || '',
      parentEmail: s.email || '',
      className: classNameById.get(s.classId) || '',
      classId: s.classId || '',
      status: s.__status,
      lastScanDate: s.lastScanDate || '',
      weeklyMistakesCount: s.weeklyMistakesCount || 0,
      flagged: !!s.flaggedException,
      isInvitedOnly: !!s.isInvitedOnly,
      raw: s,
    }));
  }, [activeRoster, pendingRoster, invitedOnlyRosterRows, classNameById, selectedClass?.id]);

  const filteredByClass = useMemo(
    () => (classFilter ? data.filter((r) => r.classId === classFilter) : data),
    [data, classFilter]
  );

  const columns = useMemo(
    () => [
      columnHelper.accessor('studentName', {
        header: isKo ? '학생 이름' : 'Student Name',
        cell: (info) => (
          <span className="flex items-center gap-1.5 font-black text-sm">
            {info.getValue()}
            {info.row.original.flagged && (
              <span title="Flagged"><Warning size={14} weight="fill" className="text-amber-500" /></span>
            )}
          </span>
        ),
      }),
      columnHelper.accessor('parentName', {
        header: isKo ? '학부모' : 'Parent',
        cell: (info) => info.row.original.isInvitedOnly ? (
          <span className="px-3 py-1.5 rounded-full text-[10px] font-bold bg-sky-500/10 border border-sky-500/20 text-sky-400 w-fit inline-block">
            {isKo ? '미가입 (초대됨)' : 'Not yet joined'}
          </span>
        ) : (
          <div>
            <p className="font-bold">{info.getValue()}</p>
            <p className="text-[10px] text-zinc-400 font-mono">{info.row.original.parentEmail}</p>
          </div>
        ),
      }),
      columnHelper.accessor('className', {
        header: isKo ? '반' : 'Class',
      }),
      columnHelper.accessor('status', {
        header: isKo ? '상태' : 'Status',
        cell: (info) => (
          <span
            className={`px-2.5 py-1 rounded-full text-[10px] font-bold border ${
              info.getValue() === 'active'
                ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400'
                : 'bg-orange-500/10 border-orange-500/20 text-orange-500'
            }`}
          >
            {info.getValue() === 'active' ? (isKo ? '활동중' : 'Active') : (isKo ? '대기중' : 'Pending')}
          </span>
        ),
      }),
      columnHelper.accessor('lastScanDate', {
        header: isKo ? '마지막 스캔일' : 'Last Active',
        cell: (info) => <span className="font-mono text-[10px] text-zinc-400">{info.getValue() || '-'}</span>,
      }),
      columnHelper.accessor('weeklyMistakesCount', {
        header: isKo ? '주간 오답' : 'Weekly Mistakes',
        cell: (info) => <span className="font-mono">{info.getValue()}</span>,
      }),
      columnHelper.display({
        id: 'actions',
        header: isKo ? '관리' : 'Actions',
        cell: (info) => {
          const row = info.row.original;
          if (row.status !== 'active') return null;
          if (row.isInvitedOnly) {
            return (
              <span className="text-[10px] text-zinc-500 italic">
                {isKo ? '위 초대 목록에서 관리' : 'Manage in Invite Students above'}
              </span>
            );
          }
          return (
            <div className="flex items-center justify-end gap-2">
              <select
                onChange={(e) => e.target.value && runAction(() => handleMoveStudent(row.uid, e.target.value))}
                value=""
                disabled={isActionBusy}
                className={`text-[10px] font-bold px-2.5 py-1.5 rounded-lg cursor-pointer outline-none appearance-none disabled:opacity-40 disabled:cursor-not-allowed ${
                  isNight ? 'bg-brand-dark border border-white/10 text-zinc-400' : 'bg-zinc-100 border border-zinc-300 text-zinc-700'
                }`}
              >
                <option value="">{isKo ? '반 이동' : 'Move'}</option>
                {classes.filter((c) => c.id !== row.classId).map((c) => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
              <button
                onClick={() => runAction(() => handleRemoveStudent(row.uid))}
                disabled={isActionBusy}
                className="px-3 py-1.5 border border-red-500/20 bg-red-500/5 hover:bg-red-500/10 text-red-400 font-bold rounded-lg text-[10px] active:scale-[0.95] cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
              >
                {isKo ? '삭제' : 'Remove'}
              </button>
              <button
                onClick={() => setSelectedStudentDetails(row.raw)}
                className={`px-3 py-1.5 border font-bold rounded-lg text-[10px] active:scale-[0.95] cursor-pointer ${
                  isNight ? 'border-white/10 bg-brand-dark hover:bg-white/5 text-orange-400' : 'border-zinc-300 bg-zinc-100 hover:bg-zinc-200 text-orange-600'
                }`}
              >
                {isKo ? '상세' : 'Details'}
              </button>
            </div>
          );
        },
      }),
    ],
    [isKo, isNight, classes, handleMoveStudent, handleRemoveStudent, setSelectedStudentDetails, isActionBusy]
  );

  const table = useReactTable({
    data: filteredByClass,
    columns,
    state: { sorting, globalFilter },
    onSortingChange: setSorting,
    onGlobalFilterChange: setGlobalFilter,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
  });

  const exportCSV = () => {
    const header = ['Student Name', 'Parent Name', 'Parent Email', 'Class', 'Status', 'Last Scan Date', 'Weekly Mistakes', 'Flagged'];
    const rows = table.getFilteredRowModel().rows.map((r) => [
      r.original.studentName,
      r.original.parentName,
      r.original.parentEmail,
      r.original.className,
      r.original.status,
      r.original.lastScanDate,
      r.original.weeklyMistakesCount,
      r.original.flagged ? 'Yes' : 'No',
    ]);
    downloadCSV(header, rows, 'student-database');
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center gap-3 justify-between">
        <div className="flex flex-col sm:flex-row gap-3 flex-1">
          <div className={`relative flex-1 max-w-xs`}>
            <MagnifyingGlass size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" />
            <input
              type="text"
              value={globalFilter}
              onChange={(e) => setGlobalFilter(e.target.value)}
              placeholder={isKo ? '학생 검색...' : 'Search students...'}
              className={`w-full pl-8 pr-3 py-2 rounded-xl text-xs outline-none border ${
                isNight ? 'bg-white/5 border-white/10 text-white placeholder:text-zinc-500' : 'bg-zinc-50 border-zinc-200 text-zinc-900'
              }`}
            />
          </div>
          <select
            value={classFilter}
            onChange={(e) => setClassFilter(e.target.value)}
            className={`px-3 py-2 rounded-xl text-xs font-bold outline-none border ${
              isNight ? 'bg-white/5 border-white/10 text-zinc-300' : 'bg-zinc-50 border-zinc-200 text-zinc-700'
            }`}
          >
            <option value="">{isKo ? '모든 반' : 'All Classes'}</option>
            {classes.map((c) => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={fetchRosterAndMistakes}
            className={`px-4 py-2 border rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer active:scale-[0.97] ${
              isNight ? 'bg-white/5 border-white/10 text-zinc-300 hover:text-white' : 'bg-zinc-100 border-zinc-300 text-zinc-700 hover:text-zinc-900'
            }`}
            title="Refresh parent scans & roster"
          >
            <span>🔄</span>
            <span>{isKo ? '동기화 새로고침' : 'Refresh Live Sync'}</span>
          </button>
          <button
            type="button"
            onClick={exportCSV}
            className={`px-4 py-2 border rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer active:scale-[0.97] ${
              isNight ? 'bg-white/5 border-white/10 text-zinc-300 hover:text-white' : 'bg-zinc-100 border-zinc-300 text-zinc-700 hover:text-zinc-900'
            }`}
          >
            <DownloadSimple size={14} weight="bold" />
            <span>{isKo ? 'CSV 내보내기' : 'Export CSV'}</span>
          </button>
        </div>
      </div>

      {!isLoadingRoster && activeRoster.length > 0 && (
        <div className="max-w-xs">
          <StatTile
            isNight={isNight}
            label={isKo ? '이번 주 스캔 완료' : 'Scanned This Week'}
            icon={<CheckCircle size={14} weight="bold" className="text-orange-500" />}
            ring={{
              value: Math.round(
                (activeRoster.filter((s) => s.hasScannedThisWeek).length / activeRoster.length) * 100
              ),
            }}
            value={
              <>
                {activeRoster.filter((s) => s.hasScannedThisWeek).length}
                <span className="text-sm font-normal text-zinc-400"> / {activeRoster.length}</span>
              </>
            }
          />
        </div>
      )}

      <div className={`p-1 rounded-[2.5rem] ${isNight ? 'bg-white/5 border border-white/10 shadow-2xl' : 'bg-white border border-zinc-200 shadow-md'}`}>
        <div className={`rounded-[calc(2.5rem-0.25rem)] p-6 sm:p-8 ${isNight ? 'bg-brand-dark text-white' : 'bg-white text-zinc-900'}`}>
          {isLoadingRoster ? (
            <div className="flex items-center justify-center min-h-[30vh]">
              <div className="w-8 h-8 border-2 border-orange-500/30 border-t-orange-500 rounded-full animate-spin" />
            </div>
          ) : filteredByClass.length === 0 ? (
            <div className="py-16 text-center text-zinc-400 text-xs">
              {isKo ? '표시할 학생이 없습니다.' : 'No students match this view.'}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left border-collapse">
                <thead>
                  {table.getHeaderGroups().map((headerGroup) => (
                    <tr key={headerGroup.id} className={`border-b text-zinc-500 font-bold uppercase tracking-wider text-[10px] ${isNight ? 'border-white/5' : 'border-zinc-200'}`}>
                      {headerGroup.headers.map((header) => (
                        <th
                          key={header.id}
                          className="pb-4 pl-2 first:pl-2 cursor-pointer select-none"
                          onClick={header.column.getToggleSortingHandler()}
                        >
                          <span className="flex items-center gap-1">
                            {flexRender(header.column.columnDef.header, header.getContext())}
                            {header.column.getCanSort() && (
                              header.column.getIsSorted() === 'asc' ? <CaretUp size={10} weight="bold" /> :
                              header.column.getIsSorted() === 'desc' ? <CaretDown size={10} weight="bold" /> :
                              <CaretUpDown size={10} weight="bold" className="opacity-30" />
                            )}
                          </span>
                        </th>
                      ))}
                    </tr>
                  ))}
                </thead>
                <tbody className={`divide-y ${isNight ? 'divide-white/5' : 'divide-zinc-200'}`}>
                  {table.getRowModel().rows.map((row) => (
                    <tr key={row.id} className={`transition-colors ${isNight ? 'hover:bg-white/[0.02]' : 'hover:bg-zinc-50'}`}>
                      {row.getVisibleCells().map((cell) => (
                        <td key={cell.id} className="py-4 pl-2 first:pl-2">
                          {flexRender(cell.column.columnDef.cell, cell.getContext())}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
