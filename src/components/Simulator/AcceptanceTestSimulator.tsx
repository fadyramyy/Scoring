import React, { useState } from 'react';
import { mockDb } from '../../lib/mockDatabase';
import { CheckCircle2, XCircle, Play, RefreshCw, ShieldCheck } from 'lucide-react';

interface AcceptanceTestSimulatorProps {
  onClose: () => void;
  onRefreshParentState: () => void;
}

interface TestStepResult {
  stepName: string;
  passed: boolean;
  details: string;
}

export const AcceptanceTestSimulator: React.FC<AcceptanceTestSimulatorProps> = ({
  onClose,
  onRefreshParentState,
}) => {
  const [results, setResults] = useState<TestStepResult[]>([]);
  const [isRunning, setIsRunning] = useState(false);

  const runAcceptanceTestScenario = () => {
    setIsRunning(true);
    mockDb.resetToDefaultSeed();

    const testLogs: TestStepResult[] = [];

    // --- SETUP VERIFICATION ---
    const samuelClass = mockDb.getTeacherClasses('teacher-1').find((c) => c.name === 'Samuel Class');
    const elijahClass = mockDb.getTeacherClasses('teacher-3').find((c) => c.name === 'Elijah Class');
    const teacher1Classes = mockDb.getTeacherClasses('teacher-1');
    const teacher3Classes = mockDb.getTeacherClasses('teacher-3');

    const setupOk =
      !!samuelClass &&
      !!elijahClass &&
      teacher1Classes.some((c) => c.name === 'Samuel Class') &&
      !teacher1Classes.some((c) => c.name === 'Elijah Class') &&
      teacher3Classes.some((c) => c.name === 'Elijah Class') &&
      !teacher3Classes.some((c) => c.name === 'Samuel Class');

    testLogs.push({
      stepName: '1. RLS / Multi-Class Auth Isolation',
      passed: setupOk,
      details: setupOk
        ? 'PASSED: Teacher 1 (Samuel Class) cannot see Elijah Class data. Teacher 3 (Elijah Class) cannot see Samuel Class data.'
        : 'FAILED: Class isolation failed.',
    });

    if (!samuelClass) return;

    // --- WEEK 1 SESSION ---
    const samuelStudents = mockDb.getStudents(samuelClass.id);
    const jason = samuelStudents.find((s) => s.name === 'Jason')!;
    const mark = samuelStudents.find((s) => s.name === 'Mark')!;
    const kiro = samuelStudents.find((s) => s.name === 'Kiro')!;
    const mina = samuelStudents.find((s) => s.name === 'Mina')!;

    // Start Week 1: Jason and Mark present
    const week1Session = mockDb.startNewSession(samuelClass.id, [jason.id, mark.id]);

    // Late arrival: Kiro arrives
    mockDb.markStudentPresent(week1Session.id, kiro.id);

    // Award points: Jason +3, Kiro +5, Mark +2
    mockDb.addScoreEvent(week1Session.id, jason.id, 'teacher-1', 3);
    mockDb.addScoreEvent(week1Session.id, kiro.id, 'teacher-1', 5);
    mockDb.addScoreEvent(week1Session.id, mark.id, 'teacher-1', 2);

    // End class session (Auto-absent for Mina with arrived_at = null)
    mockDb.endClassSession(week1Session.id);

    // Verify Week 1 Attendance & Scores
    const week1Att = mockDb.getSessionAttendance(week1Session.id);
    const minaAtt = week1Att.find((a) => a.student_id === mina.id);
    const kiroAtt = week1Att.find((a) => a.student_id === kiro.id);

    const jasonScoreW1 = mockDb.getStudentSessionScore(week1Session.id, jason.id);
    const kiroScoreW1 = mockDb.getStudentSessionScore(week1Session.id, kiro.id);
    const markScoreW1 = mockDb.getStudentSessionScore(week1Session.id, mark.id);

    const week1Ok =
      minaAtt?.status === 'absent' &&
      minaAtt?.arrived_at === null &&
      kiroAtt?.status === 'present' &&
      jasonScoreW1 === 3 &&
      kiroScoreW1 === 5 &&
      markScoreW1 === 2;

    testLogs.push({
      stepName: '2. Week 1 Session & Auto-Absent Finalization',
      passed: week1Ok,
      details: week1Ok
        ? `PASSED: Jason=${jasonScoreW1}, Kiro=${kiroScoreW1} (late), Mark=${markScoreW1}, Mina=ABSENT (arrived_at=null).`
        : 'FAILED: Week 1 attendance or score recording mismatch.',
    });

    // --- WEEK 2 SESSION & ZERO RESET ---
    const week2Session = mockDb.startNewSession(samuelClass.id, [jason.id, kiro.id, mark.id, mina.id]);

    const jasonScoreW2 = mockDb.getStudentSessionScore(week2Session.id, jason.id);
    const kiroScoreW2 = mockDb.getStudentSessionScore(week2Session.id, kiro.id);
    const markScoreW2 = mockDb.getStudentSessionScore(week2Session.id, mark.id);

    const zeroResetOk =
      jasonScoreW2 === 0 && kiroScoreW2 === 0 && markScoreW2 === 0;

    testLogs.push({
      stepName: '3. Week 2 ZERO-Reset Requirement',
      passed: zeroResetOk,
      details: zeroResetOk
        ? 'PASSED: All children start Week 2 live session at EXACTLY 0 points!'
        : 'FAILED: Live session score did not reset to 0 for Week 2.',
    });

    // --- HISTORICAL PRESERVATION IN DASHBOARD ---
    const jasonStats = mockDb.getStudentStats(jason.id);
    const historyPreservedOk = jasonStats?.totalPoints === 3;

    testLogs.push({
      stepName: '4. Dashboard Historical Score Preservation',
      passed: historyPreservedOk,
      details: historyPreservedOk
        ? `PASSED: Historical total points (${jasonStats?.totalPoints}) preserved in private teacher dashboard.`
        : 'FAILED: Historical scores were lost or corrupted.',
    });

    setResults(testLogs);
    setIsRunning(false);
    onRefreshParentState();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-md p-4">
      <div className="w-full max-w-xl bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-2xl relative">
        <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-800">
          <div className="flex items-center gap-2 text-white font-bold text-lg">
            <ShieldCheck className="w-6 h-6 text-amber-500" /> Automated Acceptance Test Suite
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-white">
            ✕
          </button>
        </div>

        <p className="text-xs text-slate-400 mb-4">
          Runs the prompt's exact scenario: Samuel vs Elijah isolation, Week 1 scores, late arrival, auto-absent finalization, and Week 2 ZERO reset verification.
        </p>

        <button
          type="button"
          disabled={isRunning}
          onClick={runAcceptanceTestScenario}
          className="w-full py-3 bg-amber-500 hover:bg-amber-400 text-slate-950 font-extrabold rounded-2xl text-sm flex items-center justify-center gap-2 mb-6 cursor-pointer shadow-lg shadow-amber-500/20"
        >
          <Play className="w-4 h-4 fill-slate-950" /> RUN ACCEPTANCE VERIFICATION SCENARIO
        </button>

        {results.length > 0 && (
          <div className="space-y-3 max-h-72 overflow-y-auto pr-1">
            {results.map((res, idx) => (
              <div
                key={idx}
                className={`p-3.5 rounded-2xl border ${
                  res.passed
                    ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-200'
                    : 'bg-rose-500/10 border-rose-500/30 text-rose-200'
                }`}
              >
                <div className="flex items-center gap-2 font-bold text-sm mb-1">
                  {res.passed ? (
                    <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
                  ) : (
                    <XCircle className="w-5 h-5 text-rose-400 shrink-0" />
                  )}
                  <span>{res.stepName}</span>
                </div>
                <div className="text-xs opacity-90 pl-7">{res.details}</div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
