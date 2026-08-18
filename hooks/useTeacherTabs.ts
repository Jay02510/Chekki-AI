import { useState } from 'react';

export type TabId =
  | 'overview'
  | 'insights'
  | 'syllabus'
  | 'homework'
  | 'students'
  | 'history'
  | 'curriculum'
  | 'director_hq'
  | 'kt_script'
  | 'kt_log';

// Director/KT/FT used to share one activeTab state — since they're all
// rendered from the same TeacherPage switchboard with role-gated JSX rather
// than separate pages, a shared tab id (e.g. both KT and FT using 'overview')
// meant switching to one role's tab silently also selected the other role's
// content underneath. Splitting the state per role kills that collision
// without needing a full separate-pages route split (Phase 5 of the
// buzzing-nibbling-hearth TeacherPage-split plan).
//
// confirmDiscardKtDraft/setKtDraftDirty are injected rather than owned here
// — they're genuinely useKtReviewQueue's state (the unsaved-edit guard on a
// KT navigating away from kt_script), not this hook's.
export function useTeacherTabs(
  isDirectorUser: boolean,
  educatorRole: 'ft' | 'kt',
  confirmDiscardKtDraft: () => boolean,
  setKtDraftDirty: (dirty: boolean) => void
) {
  const [directorActiveTab, setDirectorActiveTab] = useState<TabId>('director_hq');
  const [ktActiveTab, setKtActiveTab] = useState<TabId>('kt_script');
  const [ftActiveTab, setFtActiveTab] = useState<TabId>('overview');

  const activeTab: TabId = isDirectorUser ? directorActiveTab : (educatorRole === 'kt' ? ktActiveTab : ftActiveTab);

  const setActiveTab = (tab: TabId) => {
    if (educatorRole === 'kt' && ktActiveTab === 'kt_script' && tab !== 'kt_script' && !confirmDiscardKtDraft()) {
      return;
    }
    if (isDirectorUser) setDirectorActiveTab(tab);
    else if (educatorRole === 'kt') { setKtActiveTab(tab); setKtDraftDirty(false); }
    else setFtActiveTab(tab);
  };

  return { activeTab, setActiveTab };
}
