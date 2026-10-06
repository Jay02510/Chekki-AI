// Runs against the Firestore emulator: `npm run test:rules` (needs Java).
// One case per access boundary that has actually been broken before.
import { readFileSync } from 'fs';
import { afterAll, beforeAll, beforeEach, describe, it } from 'vitest';
import {
  assertFails,
  assertSucceeds,
  initializeTestEnvironment,
  type RulesTestEnvironment,
} from '@firebase/rules-unit-testing';
import { collection, doc, getDoc, getDocs, query, setDoc, updateDoc, where, addDoc, deleteDoc } from 'firebase/firestore';

let env: RulesTestEnvironment;

const freeProfile = { plan: 'free', maxScansPerDay: 2, maxQuestionsPerDay: 5, schoolId: null, schoolName: null };

beforeAll(async () => {
  env = await initializeTestEnvironment({
    projectId: 'demo-chekki',
    firestore: { rules: readFileSync('firestore.rules', 'utf8') },
  });
});

afterAll(async () => {
  await env.cleanup();
});

beforeEach(async () => {
  await env.clearFirestore();
  await env.withSecurityRulesDisabled(async (ctx) => {
    const db = ctx.firestore();
    await setDoc(doc(db, 'schools/schoolA'), { name: 'A', ownerUid: 'directorA' });
    await setDoc(doc(db, 'users/directorA'), { role: 'director', schoolId: 'schoolA' });
    await setDoc(doc(db, 'users/ftA'), { role: 'teacher', educatorRole: 'ft', schoolId: 'schoolA' });
    await setDoc(doc(db, 'users/ktA'), { role: 'teacher', educatorRole: 'kt', schoolId: 'schoolA' });
    await setDoc(doc(db, 'users/parentA'), { ...freeProfile, plan: 'pro', schoolId: 'schoolA', classId: 'classA', classStatus: 'active' });
    await setDoc(doc(db, 'classes/classA'), { schoolId: 'schoolA', teacherUid: 'ftA', assignedTeacherUids: ['ftA', 'ktA'] });
    await setDoc(doc(db, 'classes/classB'), { schoolId: 'schoolB', teacherUid: 'ftB', assignedTeacherUids: ['ftB'] });
    await setDoc(doc(db, 'invites/inv1'), { schoolId: 'schoolA', role: 'kt', status: 'pending', email: null });
    await setDoc(doc(db, 'pendingStudents/ps1'), { schoolId: 'schoolA', classId: 'classA', name: 'Ella', parentEmail: 'p@x.com', inviteCode: 'ABC123' });
    await setDoc(doc(db, 'activityLog/a1'), { schoolId: 'schoolA', actorUid: 'directorA', type: 'student_approved' });
    await setDoc(doc(db, 'classes/classA/logs/log1'), { classId: 'classA', reviewStatus: 'pending_review' });
  });
});

const as = (uid: string, claims: Record<string, unknown> = {}) => env.authenticatedContext(uid, claims).firestore();
const parentA = () => as('parentA', { role: null, schoolId: 'schoolA' });
const directorA = () => as('directorA', { role: 'director', schoolId: 'schoolA' });
const ftA = () => as('ftA', { role: 'teacher', schoolId: 'schoolA' });
const ktA = () => as('ktA', { role: 'teacher', schoolId: 'schoolA' });

describe('signup: self-created user docs', () => {
  it('allows a plain free parent profile', async () => {
    await assertSucceeds(setDoc(doc(as('newbie'), 'users/newbie'), { ...freeProfile, name: 'N', role: 'parent' }));
  });
  it('rejects a self-stamped schoolId (director takeover)', async () => {
    await assertFails(setDoc(doc(as('evil'), 'users/evil'), { ...freeProfile, schoolId: 'schoolA' }));
  });
  it('rejects a self-assigned staff role', async () => {
    await assertFails(setDoc(doc(as('evil'), 'users/evil'), { ...freeProfile, role: 'director' }));
    await assertFails(setDoc(doc(as('evil'), 'users/evil'), { ...freeProfile, educatorRole: 'kt' }));
  });
  it('rejects self-enrolling into a class', async () => {
    await assertFails(setDoc(doc(as('evil'), 'users/evil'), { ...freeProfile, classId: 'classA', classStatus: 'active' }));
  });
});

describe('self-updates', () => {
  it('lets a parent edit their child name', async () => {
    await assertSucceeds(updateDoc(doc(parentA(), 'users/parentA'), { studentName: 'Ella' }));
  });
  it('blocks a parent from moving or re-approving themselves', async () => {
    await assertFails(updateDoc(doc(parentA(), 'users/parentA'), { classId: 'classB' }));
    await assertFails(updateDoc(doc(parentA(), 'users/parentA'), { classStatus: 'pending' }));
    await assertFails(updateDoc(doc(parentA(), 'users/parentA'), { plan: 'pro', maxScansPerDay: 9999 }));
  });
});

describe('school-wide staff data is not readable by parents', () => {
  it('invites: director only', async () => {
    await assertFails(getDocs(query(collection(parentA(), 'invites'), where('schoolId', '==', 'schoolA'))));
    await assertFails(getDocs(query(collection(ftA(), 'invites'), where('schoolId', '==', 'schoolA'))));
    await assertSucceeds(getDocs(query(collection(directorA(), 'invites'), where('schoolId', '==', 'schoolA'))));
  });
  it('pendingStudents: director by school, class teachers by class, never parents', async () => {
    await assertFails(getDocs(query(collection(parentA(), 'pendingStudents'), where('schoolId', '==', 'schoolA'))));
    await assertSucceeds(getDocs(query(collection(directorA(), 'pendingStudents'), where('schoolId', '==', 'schoolA'))));
    await assertSucceeds(getDocs(query(collection(ftA(), 'pendingStudents'), where('classId', '==', 'classA'))));
  });
  it('activityLog: director reads, parents cannot read or write', async () => {
    await assertFails(getDocs(query(collection(parentA(), 'activityLog'), where('schoolId', '==', 'schoolA'))));
    await assertSucceeds(getDocs(query(collection(directorA(), 'activityLog'), where('schoolId', '==', 'schoolA'))));
    await assertFails(addDoc(collection(parentA(), 'activityLog'), { schoolId: 'schoolA', actorUid: 'parentA', type: 'x' }));
    await assertSucceeds(addDoc(collection(ftA(), 'activityLog'), { schoolId: 'schoolA', actorUid: 'ftA', type: 'student_approved' }));
  });
});

describe('class boundaries', () => {
  it('a director cannot read another school\'s class', async () => {
    await assertFails(getDoc(doc(directorA(), 'classes/classB')));
  });
  it('only a KT can approve a class log', async () => {
    const approval = { reviewStatus: 'sent', approvedSummary: 'ok' };
    await assertFails(updateDoc(doc(ftA(), 'classes/classA/logs/log1'), approval));
    await assertSucceeds(updateDoc(doc(ktA(), 'classes/classA/logs/log1'), approval));
  });
  it('class deletes go through the API (which cleans up), not the client', async () => {
    await assertFails(deleteDoc(doc(directorA(), 'classes/classA')));
    await assertFails(deleteDoc(doc(ftA(), 'classes/classA')));
  });
  it('parents never read the class-wide log', async () => {
    await assertFails(getDoc(doc(parentA(), 'classes/classA/logs/log1')));
  });
});
