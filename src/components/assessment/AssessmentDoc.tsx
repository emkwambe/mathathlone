'use client';

// =============================================================================
// MathAthlone — Printable Take-Home Assessment Document
// =============================================================================
// Renders an AssessmentDocument as a clean, print-ready page. PDFs are produced
// via window.print() → "Save as PDF" (no Puppeteer / server-side PDF). All math
// is rendered with KaTeX via renderMathText().
// =============================================================================

import 'katex/dist/katex.min.css';
import { renderMathText } from '@/lib/assessment/katex-helpers';
import type { AssessmentDocument, AssessmentQuestion } from '@/lib/assessment/assembler';

const MC_LETTERS = ['A', 'B', 'C', 'D'];

function Math({ text, className }: { text: string; className?: string }) {
  return (
    <span
      className={className}
      dangerouslySetInnerHTML={{ __html: renderMathText(text) }}
    />
  );
}

export default function AssessmentDoc({ doc }: { doc: AssessmentDocument }) {
  const sectionA = doc.sections.A;
  const sectionB = doc.sections.B;
  // A saved preview from a deployment before announcedSkills exists can still
  // open safely; new competition-preparation documents are server-validated.
  const announcedSkills = doc.announcedSkills ?? [];
  const mcPts = sectionA[0]?.points ?? 0;
  const frPts = sectionB[0]?.points ?? 0;

  return (
    <>
      {/* ── Toolbar (never prints) ─────────────────────────────────────────── */}
      <div className="print-hide print:hidden sticky top-0 z-20 flex flex-wrap items-center gap-3 border-b border-gray-200 bg-gray-50 px-6 py-3">
        <button
          type="button"
          onClick={() => window.print()}
          className="inline-flex items-center gap-2 rounded-lg bg-gray-900 px-4 py-2 text-sm font-semibold text-white hover:bg-gray-700"
        >
          🖨 Print / Save PDF
        </button>
        <a
          href={doc.returnHref ?? '/assessment/generate'}
          className="inline-flex items-center gap-2 rounded-lg border border-gray-300 px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
        >
          ← {doc.returnHref ? 'Return to Heat Builder' : 'Back to Practice Worksheet Builder'}
        </a>
        <p className="text-xs text-gray-500">
          After printing, choose &lsquo;Save as PDF&rsquo; in the print dialog.
        </p>
      </div>

      {/* ── Document (prints cleanly) ──────────────────────────────────────── */}
      <div
        className="mx-auto max-w-[8.5in] bg-white p-8 text-black print:p-0"
        style={{ fontFamily: "Georgia, 'Times New Roman', serif" }}
      >
        {/* Student copy. This wrapper deliberately owns the only forced
            boundary between the student document and the teacher copy. */}
        <div className={`assessment-student-copy${doc.showAnswerKey ? ' has-answer-key' : ''}`}>
          {/* Header */}
          <header>
          <div className="flex items-center justify-between">
            <span className="text-[18pt] font-bold">MathAthlone</span>
            <span className="text-[18pt]">🔥</span>
          </div>
          <h1 className="mt-1 text-[20pt] font-bold leading-tight">{doc.title}</h1>
          <div className="mt-1 flex flex-wrap justify-between gap-2 text-[11pt]">
            <span className="font-semibold">{doc.course}</span>
            <span>{doc.topics.join(' · ')}</span>
          </div>

          <div className="mt-3 flex flex-wrap justify-between gap-x-8 gap-y-1 text-[11pt]">
            <span>Student Name: ________________________</span>
            <span>Date: _____________</span>
          </div>
          <div className="mt-1 flex flex-wrap justify-between gap-x-8 gap-y-1 text-[11pt]">
            <span>Period: _______</span>
            <span>Score: _______ / {doc.totalPoints} points</span>
          </div>

          <hr className="my-2 border-t-2 border-black" />
          </header>

          {doc.purpose === 'competition_preparation' && (
            <section className="mb-3 rounded border border-slate-400 bg-slate-50 px-3 py-2 text-[10pt] leading-snug">
              <p className="font-bold">Skills you will practice</p>
              <p><span className="font-semibold">Topics:</span> {doc.topics.join(' · ') || 'Selected course skills'}</p>
              {announcedSkills.length > 0 && (
                <div className="mt-1">
                  <p className="font-semibold">Skills:</p>
                  <ul className="ml-5 list-disc space-y-0.5">
                    {announcedSkills.map((skill) => (
                      <li key={skill}>{skill}</li>
                    ))}
                  </ul>
                </div>
              )}
              <p className="mt-1 italic">{doc.preparationNote ?? 'Your Heat will assess these skills using new question instances.'}</p>
            </section>
          )}

          {/* ── Section A — Multiple Choice ──────────────────────────────────── */}
        {sectionA.length > 0 && (
          <section>
            <h2 className="text-[14pt] font-bold">
              SECTION A — MULTIPLE CHOICE ({mcPts} points each)
            </h2>
            <p className="mb-2 text-sm italic">
              Choose the best answer. Write the letter in the box provided.
            </p>

            {sectionA.map((q) => (
              <div key={`A-${q.number}`} className="break-inside-avoid mb-3">
                <div className="flex gap-2 text-[11pt]">
                  <span className="min-w-[24px] font-bold">{q.number}.</span>
                  <Math text={q.question} />
                </div>
                <div className="ml-8 mt-1 grid grid-cols-2 gap-x-8 gap-y-0.5 text-[11pt]">
                  {q.options?.map((opt, i) => (
                    <div key={i} className="flex gap-2">
                      <span className="min-w-[20px] font-medium">{MC_LETTERS[i]})</span>
                      <Math text={opt} />
                    </div>
                  ))}
                </div>
                <div className="ml-8 mt-1 flex items-center gap-2">
                  <span className="text-xs">Answer:</span>
                  <span className="inline-block h-6 w-6 border-2 border-black" />
                </div>
              </div>
            ))}
          </section>
        )}

        {/* ── Section B — Free Response ────────────────────────────────────── */}
        {sectionB.length > 0 && (
          <section>
            <h2
              className={`text-[14pt] font-bold${
                sectionA.length > 6 ? ' break-before-page' : ''
              }`}
            >
              SECTION B — FREE RESPONSE ({frPts} points each)
            </h2>
            <p className="mb-2 text-sm italic">Show all work. Box your final answer.</p>

            {sectionB.map((q, index) => (
              <div key={`B-${q.number}`} className="break-inside-avoid mb-4">
                <div className="mb-1 flex gap-2 text-[11pt]">
                  {/* Continue numbering from Section A. */}
                  <span className="min-w-[24px] font-bold">{sectionA.length + index + 1}.</span>
                  <Math text={q.question} />
                </div>
                <div className="ml-6">
                  {Array.from({ length: q.workspaceLines }).map((_, i) => (
                    <div key={i} className="my-0.5 h-5 border-b border-gray-400" />
                  ))}
                  <div className="mt-2 flex items-center gap-2">
                    <span className="text-xs font-medium">Answer:</span>
                    <div className="h-6 flex-1 border-b-2 border-black" />
                  </div>
                </div>
              </div>
            ))}
          </section>
        )}

        </div>{/* end assessment-student-copy */}

        {/* ── Answer Key (teacher copy) — quiz/test only ───────────────────── */}
        {doc.showAnswerKey && (
          <div className="assessment-answer-key">
            <h2 className="mb-1 text-[14pt] font-bold">
              Answer Key — {doc.title} (Teacher Copy)
            </h2>
            <p className="mb-4 text-xs italic text-gray-500">
              Do not distribute to students.
            </p>
            <div className="grid grid-cols-2 gap-4">
              {sectionA.length > 0 && (
                <div>
                  <h3 className="mb-2 text-[12pt] font-semibold">Section A — Multiple Choice</h3>
                  <ol className="space-y-1 text-[11pt]">
                    {sectionA.map((q) => (
                      <li key={`KA-${q.number}`} className="flex gap-2">
                        <span className="min-w-[28px] font-medium">{q.number}.</span>
                        <span className="font-bold">{q.correctOption}</span>
                        <span className="text-gray-500">—</span>
                        <Math text={q.answer} />
                      </li>
                    ))}
                  </ol>
                </div>
              )}
              {sectionB.length > 0 && (
                <div>
                  <h3 className="mb-2 text-[12pt] font-semibold">Section B — Free Response</h3>
                  <ol className="space-y-2 text-[11pt]">
                    {sectionB.map((q, index) => (
                      <AnswerKeyFR key={`KB-${q.number}`} q={q} num={sectionA.length + index + 1} />
                    ))}
                  </ol>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* ── Print CSS ──────────────────────────────────────────────────────── */}
      <style jsx global>{`
        @media print {
          .print-hide {
            display: none !important;
          }
          nav,
          header.sidebar,
          footer,
          .sidebar {
            display: none !important;
          }
          /*
           * Suppress the browser's built-in page header/footer (URL, date,
           * page number) that some browsers inject via @page margin boxes.
           * Setting all margin boxes to empty strings removes them.
           */
          @page {
            size: letter portrait;
            margin: 0.75in;
            /* Chrome/Edge: clear all margin-box content */
            @top-left   { content: ''; }
            @top-center { content: ''; }
            @top-right  { content: ''; }
            @bottom-left   { content: ''; }
            @bottom-center { content: ''; }
            @bottom-right  { content: ''; }
          }
          body {
            font-size: 11pt;
            font-family: Georgia, 'Times New Roman', serif;
            color: black;
            background: white;
            /* Prevent any inherited counter from adding page numbers */
            counter-reset: none;
          }
          .break-inside-avoid {
            page-break-inside: avoid;
            break-inside: avoid;
          }
          /*
           * The complete student document is one print-flow region. Its forced
           * break occurs only after the final student question, so the answer
           * key cannot share the final worksheet page. Applying the break to
           * this wrapper (rather than to the answer-key heading) is reliable
           * in Chrome's PDF engine even when a free-response question ends near
           * the bottom of a page.
           */
          .assessment-student-copy.has-answer-key {
            page-break-after: always !important;
            break-after: page !important;
          }
          .assessment-answer-key {
            page-break-before: auto;
            break-before: auto;
          }
          .break-before-page {
            page-break-before: always;
            break-before: page;
          }
        }
      `}</style>
    </>
  );
}

function AnswerKeyFR({ q, num }: { q: AssessmentQuestion; num: number }) {
  return (
    <li>
      <div className="flex gap-2">
        <span className="min-w-[28px] font-medium">{num}.</span>
        <Math text={q.answer} className="font-bold" />
      </div>
      {q.solutionSteps.length > 0 && (
        <ol className="ml-7 mt-1 list-decimal space-y-0.5 text-[9pt] text-gray-600">
          {q.solutionSteps.map((step, i) => (
            <li key={i}>
              <Math text={step} />
            </li>
          ))}
        </ol>
      )}
    </li>
  );
}
