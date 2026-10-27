import React from 'react';
import { Plus } from '@phosphor-icons/react';
import { useDialogA11y } from '../../hooks/useDialogA11y';

interface Props {
  isKo: boolean;
  setShowCreateClassModal: React.Dispatch<React.SetStateAction<boolean>>;
  handleCreateClass: (e: React.FormEvent) => Promise<void>;
  newClassName: string;
  setNewClassName: React.Dispatch<React.SetStateAction<string>>;
  newClassLevel: string;
  setNewClassLevel: React.Dispatch<React.SetStateAction<string>>;
  isCreatingClass: boolean;
}

// New-class form. Mounted only while open; the submit handler and field
// state stay in TeacherPage, which owns the class list.
export function CreateClassModal({
  isKo,
  setShowCreateClassModal,
  handleCreateClass,
  newClassName,
  setNewClassName,
  newClassLevel,
  setNewClassLevel,
  isCreatingClass,
}: Props) {
  const createClassDialogRef = useDialogA11y<HTMLDivElement>({
    isOpen: true,
    onClose: () => setShowCreateClassModal(false),
  });

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
      <div 
        className="absolute inset-0 bg-[#2b211a]/55" 
        onClick={() => setShowCreateClassModal(false)} 
     />
      <div
        ref={createClassDialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="create-class-title"
        tabIndex={-1}
        className={`relative p-1 border rounded-lg flex flex-col w-full max-w-md mx-4 animate-fade-in ${
        'bg-surface border-rule'
      }`}>
        <div className={`relative w-full h-full rounded-lg p-8 overflow-hidden transition-colors ${
          'bg-surface text-ink'
        }`}>
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-lg bg-line-soft border border-rule text-line-ink flex items-center justify-center">
              <Plus size={22} weight="bold" />
            </div>
            <h3 id="create-class-title" className={`text-xl font-extrabold text-ink`}>
              {isKo ? '새 학급반 추가' : 'Add New Class'}
            </h3>
          </div>
          
          <p className="text-ink-3 text-xs mb-6 leading-relaxed">
            {isKo 
              ? '관리할 학급의 이름과 대상 학년을 설정해 학급을 개설하세요.'
              : 'Specify the class details to expand your school roster.'}
          </p>

          <form onSubmit={handleCreateClass} className="space-y-4">
            <div className="space-y-2 text-left">
              <label htmlFor="new-class-name" className="text-xs font-bold text-ink-3 pl-1">
                {isKo ? '반 이름' : 'Class Name'}
              </label>
              <input
                id="new-class-name"
                type="text"
                required
                value={newClassName}
                onChange={(e) => setNewClassName(e.target.value)}
                placeholder="E.g. 7-Mercury"
                className={`w-full border outline-none text-sm p-4 rounded-lg transition-[color,background-color,border-color,box-shadow,transform] ${
                  'bg-surface border-rule focus:border-line text-ink placeholder:text-ink-3'
                }`}
             />
            </div>

            <div className="space-y-2 text-left">
              <label htmlFor="new-class-level" className="text-xs font-bold text-ink-3 pl-1">
                {isKo ? '대상 학년' : 'Class Level'}
              </label>
              <select
                id="new-class-level"
                value={newClassLevel}
                onChange={(e) => setNewClassLevel(e.target.value)}
                className={`w-full border outline-none text-sm p-4 rounded-lg transition-[color,background-color,border-color,box-shadow,transform] cursor-pointer ${
                  'bg-surface border-rule focus:border-line text-ink'
                }`}
              >
                <option value="5-year-old">{isKo ? '5세반' : '5-year-old'}</option>
                <option value="6-year-old">{isKo ? '6세반' : '6-year-old'}</option>
                <option value="7-year-old">{isKo ? '7세반' : '7-year-old'}</option>
                <option value="Elementary Grade 1">{isKo ? '초등 1학년' : 'Elementary Grade 1'}</option>
                <option value="Elementary Grade 2">{isKo ? '초등 2학년' : 'Elementary Grade 2'}</option>
              </select>
            </div>

            <div className="pt-4 flex gap-3">
              <button
                type="button"
                onClick={() => setShowCreateClassModal(false)}
                className={`flex-1 py-4 font-bold text-xs rounded-lg border transition-[color,background-color,border-color,box-shadow,transform] active:scale-[0.98] cursor-pointer ${
                  'bg-sunken hover:bg-sunken text-ink-2 border-rule'
                }`}
              >
                {isKo ? '취소' : 'Cancel'}
              </button>
              <button
                type="submit"
                disabled={isCreatingClass}
                className="flex-1 py-4 bg-line hover:bg-line text-on-line font-bold text-xs rounded-lg transition-[color,background-color,border-color,box-shadow,transform] active:scale-[0.98] flex items-center justify-center gap-1.5 cursor-pointer"
              >
                {isCreatingClass ? (
                  <div className="w-4 h-4 border-2 border-rule border-t-white rounded-full animate-spin" />
                ) : (
                  <span>{isKo ? '개설하기' : 'Create Class'}</span>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
