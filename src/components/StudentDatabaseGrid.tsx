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
import { ArrowClockwise, Warning, MagnifyingGlass, DownloadSimple, CaretUp, CaretDown, CaretUpDown } from '@phosphor-icons/react';
import { downloadCSV } from '../utils/csvExport';
import { staffUi } from './staffUi';

interface Props {
  isKo: boolean;
  activeRoster: any[];
  pendingRoster: any[];
  invitedOnlyRosterRows?: any[];
  isLoadingRoster: boolean;
  fetchRosterAndMistakes: () => void;
  classes: any[];
  selectedClass: any;
  /** Omit both for a read-only roster (KT): only Details stays. */
  handleMoveStudent?: (uid: string, targetClassId: string) => void;
  handleRemoveStudent?: (uid: string) => void;
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
      lastScanDate: String(s.lastScanDate || '').slice(0, 10), // ISO timestamp -> date
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

  const actionsFor = (row: Row) => {
    if (row.status !== 'active') return null;
    if (row.isInvitedOnly) {
      if (!handleRemoveStudent) return null;
      return (
        <span className="text-[13px] text-ink-3">
          {isKo ? '위 초대 목록에서 관리' : 'Manage in Invite Students above'}
        </span>
      );
    }
    return (
      <div className="flex items-center justify-end gap-2">
        {handleMoveStudent && (
        <select
          onChange={(e) => e.target.value && runAction(() => handleMoveStudent(row.uid, e.target.value))}
          value=""
          disabled={isActionBusy}
          aria-label={isKo ? `${row.studentName} 반 이동` : `Move ${row.studentName} to another class`}
          className={`${staffUi.quietBtn} w-28 bg-surface pr-2 outline-none`}
        >
          <option value="">{isKo ? '반 이동' : 'Move'}</option>
          {classes.filter((c) => c.id !== row.classId).map((c) => (
            <option key={c.id} value={c.id}>{c.name}</option>
          ))}
        </select>
        )}
        {handleRemoveStudent && (
        <button
          onClick={() => runAction(() => handleRemoveStudent(row.uid))}
          disabled={isActionBusy}
          type="button"
          className={`${staffUi.quietBtn} text-wrong`}
        >
          {isKo ? '삭제' : 'Remove'}
        </button>
        )}
        <button
          onClick={() => setSelectedStudentDetails(row.raw)}
          type="button"
          className={staffUi.quietBtn}
        >
          {isKo ? '상세' : 'Details'}
        </button>
      </div>
    );
  };

  const columns = useMemo(
    () => [
      columnHelper.accessor('studentName', {
        header: isKo ? '학생 이름' : 'Student',
        cell: (info) => (
          <span className="flex items-center gap-1.5 font-bold">
            {info.getValue()}
            {info.row.original.flagged && (
              <span title={isKo ? '주의' : 'Flagged'}><Warning size={16} weight="fill" className="text-line-ink" aria-label={isKo ? '주의' : 'Flagged'} /></span>
            )}
          </span>
        ),
      }),
      columnHelper.accessor('parentName', {
        header: isKo ? '학부모' : 'Parent',
        cell: (info) => info.row.original.isInvitedOnly ? (
          <span className={staffUi.pill.neutral}>
            {isKo ? '미가입 (초대됨)' : 'Not yet joined'}
          </span>
        ) : (
          <div>
            <p className="font-semibold">{info.getValue()}</p>
            <p className="text-[13px] text-ink-3">{info.row.original.parentEmail}</p>
          </div>
        ),
      }),
      columnHelper.accessor('className', {
        header: isKo ? '반' : 'Class',
        cell: (info) => <span className="whitespace-nowrap">{info.getValue()}</span>,
      }),
      columnHelper.accessor('status', {
        header: isKo ? '상태' : 'Status',
        cell: (info) => (
          <span className={info.getValue() === 'active' ? staffUi.pill.good : staffUi.pill.warm}>
            {info.getValue() === 'active' ? (isKo ? '활동중' : 'Active') : (isKo ? '대기중' : 'Pending')}
          </span>
        ),
      }),
      columnHelper.accessor('lastScanDate', {
        header: isKo ? '마지막 스캔일' : 'Last scan',
        cell: (info) => <span className="whitespace-nowrap text-[14px] tabular-nums text-ink-2">{info.getValue() || '—'}</span>,
      }),
      columnHelper.accessor('weeklyMistakesCount', {
        header: isKo ? '주간 오답' : 'Mistakes',
        cell: (info) => <span className="tabular-nums">{info.getValue()}</span>,
      }),
      columnHelper.display({
        id: 'actions',
        header: () => <span className="sr-only">{isKo ? '관리' : 'Actions'}</span>,
        cell: (info) => actionsFor(info.row.original),
      }),
    ],
    [isKo, classes, handleMoveStudent, handleRemoveStudent, setSelectedStudentDetails, isActionBusy]
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

  const scannedCount = activeRoster.filter((s) => s.hasScannedThisWeek).length;

  return (
    <section className="space-y-4 text-left text-ink">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <h3 className={staffUi.h3}>{isKo ? '학생 명단' : 'Roster'}</h3>
        {!isLoadingRoster && activeRoster.length > 0 && (
          <p className="text-[14px] font-semibold text-ink-3 tabular-nums">
            {isKo
              ? `이번 주 ${activeRoster.length}명 중 ${scannedCount}명 스캔`
              : `${scannedCount} of ${activeRoster.length} scanned this week`}
          </p>
        )}
      </div>

      <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
        <div className="flex flex-1 flex-col gap-2 sm:flex-row">
          <div className="relative max-w-xs flex-1">
            <MagnifyingGlass size={18} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-ink-3" aria-hidden="true" />
            <input
              type="search"
              value={globalFilter}
              onChange={(e) => setGlobalFilter(e.target.value)}
              placeholder={isKo ? '학생 검색' : 'Search students'}
              aria-label={isKo ? '학생 검색' : 'Search students'}
              className={`${staffUi.field} pl-10`}
            />
          </div>
          <select
            value={classFilter}
            onChange={(e) => setClassFilter(e.target.value)}
            aria-label={isKo ? '반 필터' : 'Filter by class'}
            className={`${staffUi.field} font-semibold sm:w-auto`}
          >
            <option value="">{isKo ? '모든 반' : 'All classes'}</option>
            {classes.map((c) => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>
        </div>
        <div className="flex items-center gap-2">
          <button type="button" onClick={fetchRosterAndMistakes} className={staffUi.quietBtn}>
            <ArrowClockwise size={16} weight="bold" aria-hidden="true" />
            {isKo ? '새로고침' : 'Refresh'}
          </button>
          <button type="button" onClick={exportCSV} className={staffUi.quietBtn}>
            <DownloadSimple size={16} weight="bold" aria-hidden="true" />
            {isKo ? 'CSV 내보내기' : 'Export CSV'}
          </button>
        </div>
      </div>

      {isLoadingRoster ? (
        <div className="flex min-h-[30vh] items-center justify-center">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-line/30 border-t-line" aria-label={isKo ? '불러오는 중' : 'Loading'} />
        </div>
      ) : filteredByClass.length === 0 ? (
        <p className="rounded-lg bg-surface p-10 text-center ring-1 ring-inset ring-rule text-[15px] text-ink-3">
          {isKo ? '표시할 학생이 없습니다.' : 'No students match this view.'}
        </p>
      ) : (
        <>
          {/* Phones: one row per student — as a table, the actions column
              sat off-screen to the right. */}
          <ul className={`${staffUi.rows} md:hidden`}>
            {table.getRowModel().rows.map(({ original: r }) => (
              <li key={r.uid} className="space-y-2 py-3">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="flex items-center gap-1.5 text-[16px] font-bold">
                      {r.studentName}
                      {r.flagged && <Warning size={16} weight="fill" className="text-line-ink" aria-label={isKo ? '주의' : 'Flagged'} />}
                    </p>
                    <p className="break-all text-[13px] text-ink-3">
                      {r.isInvitedOnly ? (isKo ? '미가입 (초대됨)' : 'Not yet joined') : [r.parentName, r.parentEmail].filter(Boolean).join(' · ')}
                    </p>
                  </div>
                  {r.status !== 'active' && <span className={staffUi.pill.warm}>{isKo ? '대기중' : 'Pending'}</span>}
                </div>
                <p className="text-[13px] text-ink-3">
                  {[r.className, r.lastScanDate && `${isKo ? '마지막 스캔' : 'Last scan'} ${r.lastScanDate}`].filter(Boolean).join(' · ')}
                </p>
                <div className="flex justify-start">{actionsFor(r)}</div>
              </li>
            ))}
          </ul>
          <div className="hidden overflow-x-auto md:block">
            <table className="w-full border-collapse text-left text-[15px]">
              <thead>
                {table.getHeaderGroups().map((headerGroup) => (
                  <tr key={headerGroup.id} className="border-b border-rule">
                    {headerGroup.headers.map((header) => {
                      const sorted = header.column.getIsSorted();
                      return (
                        <th
                          key={header.id}
                          className={staffUi.th}
                          aria-sort={sorted === 'asc' ? 'ascending' : sorted === 'desc' ? 'descending' : undefined}
                        >
                          {header.column.getCanSort() ? (
                            <button type="button" onClick={header.column.getToggleSortingHandler()} className="inline-flex cursor-pointer items-center gap-1 hover:text-ink">
                              {flexRender(header.column.columnDef.header, header.getContext())}
                              {sorted === 'asc' ? <CaretUp size={12} weight="bold" /> : sorted === 'desc' ? <CaretDown size={12} weight="bold" /> : <CaretUpDown size={12} weight="bold" className="opacity-40" />}
                            </button>
                          ) : (
                            flexRender(header.column.columnDef.header, header.getContext())
                          )}
                        </th>
                      );
                    })}
                  </tr>
                ))}
              </thead>
              <tbody className="divide-y divide-rule border-b border-rule">
                {table.getRowModel().rows.map((row) => (
                  <tr key={row.id}>
                    {row.getVisibleCells().map((cell) => (
                      <td key={cell.id} className="py-3 pr-3">
                        {flexRender(cell.column.columnDef.cell, cell.getContext())}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </section>
  );
}
