// ============================================================
// MathAthlone — SVG Visual Question Generators
// src/lib/competition/visual-generators.ts
//
// 12 generators for concepts requiring graphical questions.
// Each produces randomized SVG + question text + MC options.
// SVG renders inline in the browser at any resolution.
// © Mpingo Systems LLC
// ============================================================

export type DifficultyLevel = 1 | 2 | 3 | 4;

export interface VisualQuestion {
  concept_id: string;
  concept_name: string;
  question_text: string;
  question_svg: string;          // Inline SVG string
  options: string[];
  correct_answer: string;        // 'A', 'B', 'C', or 'D'
  correct_answer_index: number;
  explanation: string;
  difficulty: DifficultyLevel;
  category: string;
}

// ────────────────────────────────────────────────────────────
// UTILITY FUNCTIONS
// ────────────────────────────────────────────────────────────

function randInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function randNonZero(min: number, max: number): number {
  let n = 0;
  while (n === 0) n = randInt(min, max);
  return n;
}

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function pickCorrectIndex(options: string[], correct: string): number {
  return options.indexOf(correct);
}

const LETTERS = ['A', 'B', 'C', 'D'];

// ────────────────────────────────────────────────────────────
// SVG PRIMITIVES
// ────────────────────────────────────────────────────────────

const SVG_W = 360;
const SVG_H = 280;
const PAD = 40;
const GRID_COLOR = '#e2e8f0';
const AXIS_COLOR = '#334155';
const LINE_COLORS = ['#6366f1', '#ef4444', '#10b981', '#f59e0b'];
const POINT_COLOR = '#6366f1';

/** Coordinate plane with grid, axes, and tick labels */
function coordPlane(
  xMin: number, xMax: number, yMin: number, yMax: number,
  content: string
): string {
  const plotW = SVG_W - 2 * PAD;
  const plotH = SVG_H - 2 * PAD;

  const xScale = (x: number) => PAD + ((x - xMin) / (xMax - xMin)) * plotW;
  const yScale = (y: number) => PAD + ((yMax - y) / (yMax - yMin)) * plotH;

  let grid = '';

  // Vertical grid + x labels
  for (let x = xMin; x <= xMax; x++) {
    const px = xScale(x);
    grid += `<line x1="${px}" y1="${PAD}" x2="${px}" y2="${SVG_H - PAD}" stroke="${GRID_COLOR}" stroke-width="0.5"/>`;
    if (x % 2 === 0 || (xMax - xMin) <= 10) {
      grid += `<text x="${px}" y="${SVG_H - PAD + 16}" text-anchor="middle" font-size="10" fill="#94a3b8">${x}</text>`;
    }
  }

  // Horizontal grid + y labels
  for (let y = yMin; y <= yMax; y++) {
    const py = yScale(y);
    grid += `<line x1="${PAD}" y1="${py}" x2="${SVG_W - PAD}" y2="${py}" stroke="${GRID_COLOR}" stroke-width="0.5"/>`;
    if (y % 2 === 0 || (yMax - yMin) <= 10) {
      grid += `<text x="${PAD - 8}" y="${py + 4}" text-anchor="end" font-size="10" fill="#94a3b8">${y}</text>`;
    }
  }

  // Axes
  const x0 = xScale(0);
  const y0 = yScale(0);
  let axes = '';
  if (xMin <= 0 && xMax >= 0) {
    axes += `<line x1="${x0}" y1="${PAD}" x2="${x0}" y2="${SVG_H - PAD}" stroke="${AXIS_COLOR}" stroke-width="1.5"/>`;
  }
  if (yMin <= 0 && yMax >= 0) {
    axes += `<line x1="${PAD}" y1="${y0}" x2="${SVG_W - PAD}" y2="${y0}" stroke="${AXIS_COLOR}" stroke-width="1.5"/>`;
  }

  return `<svg viewBox="0 0 ${SVG_W} ${SVG_H}" xmlns="http://www.w3.org/2000/svg" style="max-width:100%;height:auto;background:#fff;border-radius:8px;border:1px solid #e2e8f0">${grid}${axes}${content}</svg>`;
}

/** Draw a line segment from (x1,y1) to (x2,y2) on coordinate plane */
function lineSegment(
  x1: number, y1: number, x2: number, y2: number,
  xMin: number, xMax: number, yMin: number, yMax: number,
  color: string = LINE_COLORS[0],
  dashed: boolean = false
): string {
  const plotW = SVG_W - 2 * PAD;
  const plotH = SVG_H - 2 * PAD;
  const sx = (x: number) => PAD + ((x - xMin) / (xMax - xMin)) * plotW;
  const sy = (y: number) => PAD + ((yMax - y) / (yMax - yMin)) * plotH;

  return `<line x1="${sx(x1)}" y1="${sy(y1)}" x2="${sx(x2)}" y2="${sy(y2)}" stroke="${color}" stroke-width="2.5" ${dashed ? 'stroke-dasharray="6,4"' : ''} stroke-linecap="round"/>`;
}

/** Draw a dot at (x, y) */
function dot(
  x: number, y: number,
  xMin: number, xMax: number, yMin: number, yMax: number,
  color: string = POINT_COLOR, radius: number = 4
): string {
  const plotW = SVG_W - 2 * PAD;
  const plotH = SVG_H - 2 * PAD;
  const sx = PAD + ((x - xMin) / (xMax - xMin)) * plotW;
  const sy = PAD + ((yMax - y) / (yMax - yMin)) * plotH;
  return `<circle cx="${sx}" cy="${sy}" r="${radius}" fill="${color}"/>`;
}

/** Open circle at (x, y) */
function openDot(
  x: number, y: number,
  xMin: number, xMax: number, yMin: number, yMax: number,
  color: string = POINT_COLOR
): string {
  const plotW = SVG_W - 2 * PAD;
  const plotH = SVG_H - 2 * PAD;
  const sx = PAD + ((x - xMin) / (xMax - xMin)) * plotW;
  const sy = PAD + ((yMax - y) / (yMax - yMin)) * plotH;
  return `<circle cx="${sx}" cy="${sy}" r="5" fill="#fff" stroke="${color}" stroke-width="2"/>`;
}

/** Number line SVG */
function numberLine(
  min: number, max: number, content: string
): string {
  const w = 360;
  const h = 60;
  const pad = 30;
  const lineY = 30;
  const lineW = w - 2 * pad;

  const sx = (x: number) => pad + ((x - min) / (max - min)) * lineW;

  let ticks = '';
  for (let x = min; x <= max; x++) {
    const px = sx(x);
    ticks += `<line x1="${px}" y1="${lineY - 6}" x2="${px}" y2="${lineY + 6}" stroke="${AXIS_COLOR}" stroke-width="1"/>`;
    ticks += `<text x="${px}" y="${lineY + 20}" text-anchor="middle" font-size="11" fill="#64748b">${x}</text>`;
  }

  const mainLine = `<line x1="${pad}" y1="${lineY}" x2="${w - pad}" y2="${lineY}" stroke="${AXIS_COLOR}" stroke-width="1.5"/>`;
  const arrows = `<polygon points="${pad - 6},${lineY} ${pad + 2},${lineY - 4} ${pad + 2},${lineY + 4}" fill="${AXIS_COLOR}"/>` +
    `<polygon points="${w - pad + 6},${lineY} ${w - pad - 2},${lineY - 4} ${w - pad - 2},${lineY + 4}" fill="${AXIS_COLOR}"/>`;

  return `<svg viewBox="0 0 ${w} ${h}" xmlns="http://www.w3.org/2000/svg" style="max-width:100%;height:auto;background:#fff;border-radius:8px;border:1px solid #e2e8f0">${mainLine}${arrows}${ticks}${content}</svg>`;
}

/** Shaded region on number line */
function nlShade(
  from: number, to: number, min: number, max: number,
  direction: 'left' | 'right'
): string {
  const w = 360;
  const pad = 30;
  const lineY = 30;
  const lineW = w - 2 * pad;
  const sx = (x: number) => pad + ((x - min) / (max - min)) * lineW;

  const startX = direction === 'right' ? sx(from) : pad;
  const endX = direction === 'right' ? w - pad : sx(to);
  return `<rect x="${startX}" y="${lineY - 4}" width="${endX - startX}" height="8" fill="${POINT_COLOR}" opacity="0.25"/>`;
}

/** Filled or open dot on number line */
function nlDot(
  x: number, min: number, max: number, filled: boolean
): string {
  const pad = 30;
  const lineW = 360 - 2 * pad;
  const lineY = 30;
  const sx = pad + ((x - min) / (max - min)) * lineW;
  if (filled) {
    return `<circle cx="${sx}" cy="${lineY}" r="5" fill="${POINT_COLOR}"/>`;
  }
  return `<circle cx="${sx}" cy="${lineY}" r="5" fill="#fff" stroke="${POINT_COLOR}" stroke-width="2"/>`;
}

// ────────────────────────────────────────────────────────────
// GENERATOR 1: Graphing Inequalities on Number Line
// M1.EQN.5.1
// ────────────────────────────────────────────────────────────

export function genInequalityNumberLine(): VisualQuestion {
  const val = randInt(-4, 4);
  const ops = ['<', '>', '≤', '≥'];
  const op = ops[randInt(0, 3)];
  const filled = op === '≤' || op === '≥';
  const dir: 'left' | 'right' = (op === '<' || op === '≤') ? 'left' : 'right';

  const svg = numberLine(-6, 6,
    nlShade(val, val, -6, 6, dir) +
    nlDot(val, -6, 6, filled)
  );

  const correct = `x ${op} ${val}`;
  const wrongOps = ops.filter(o => o !== op);
  const distractors = wrongOps.slice(0, 3).map(o => `x ${o} ${val}`);

  const allOptions = shuffle([correct, ...distractors]);
  const correctIdx = allOptions.indexOf(correct);

  return {
    concept_id: 'M1.EQN.5.1',
    concept_name: 'Graphing Inequalities',
    question_text: 'Which inequality matches the graph shown?',
    question_svg: svg,
    options: allOptions,
    correct_answer: LETTERS[correctIdx],
    correct_answer_index: correctIdx,
    explanation: `${filled ? 'Closed' : 'Open'} circle at ${val}, shaded ${dir}. This represents x ${op} ${val}.`,
    difficulty: 2,
    category: 'visual',
  };
}

// ────────────────────────────────────────────────────────────
// GENERATOR 2: Vertical Line Test
// M1.FLF.1.2
// ────────────────────────────────────────────────────────────

export function genVerticalLineTest(): VisualQuestion {
  // Generate 4 small graphs, one fails the VLT
  const xMin = -5, xMax = 5, yMin = -5, yMax = 5;
  const plotSize = 140;

  function miniPlane(content: string, label: string, xOff: number, yOff: number): string {
    return `<g transform="translate(${xOff},${yOff})">
      <rect x="0" y="0" width="${plotSize}" height="${plotSize}" rx="6" fill="#f8fafc" stroke="#e2e8f0"/>
      <text x="${plotSize / 2}" y="${plotSize + 16}" text-anchor="middle" font-size="13" font-weight="600" fill="#475569">${label}</text>
      ${content}
    </g>`;
  }

  // Line (passes)
  const line = `<line x1="20" y1="120" x2="120" y2="20" stroke="${LINE_COLORS[0]}" stroke-width="2.5"/>`;
  // Parabola (passes)
  const parabola = `<path d="M 20,120 Q 70,10 120,120" fill="none" stroke="${LINE_COLORS[1]}" stroke-width="2.5"/>`;
  // Circle (fails!)
  const circle = `<circle cx="70" cy="70" r="45" fill="none" stroke="${LINE_COLORS[2]}" stroke-width="2.5"/>`;
  // V-shape (passes)
  const vshape = `<polyline points="20,30 70,120 120,30" fill="none" stroke="${LINE_COLORS[3]}" stroke-width="2.5"/>`;

  const graphs = [
    { content: line, label: 'A', passes: true },
    { content: parabola, label: 'B', passes: true },
    { content: circle, label: 'C', passes: false },
    { content: vshape, label: 'D', passes: true },
  ];

  const shuffled = shuffle(graphs);
  shuffled.forEach((g, i) => g.label = LETTERS[i]);

  const failGraph = shuffled.find(g => !g.passes)!;

  const svgContent = shuffled.map((g, i) => {
    const col = i % 2;
    const row = Math.floor(i / 2);
    return miniPlane(g.content, g.label, 20 + col * 170, 10 + row * 170);
  }).join('');

  const svg = `<svg viewBox="0 0 360 370" xmlns="http://www.w3.org/2000/svg" style="max-width:100%;height:auto;background:#fff;border-radius:8px;border:1px solid #e2e8f0">${svgContent}</svg>`;

  return {
    concept_id: 'M1.FLF.1.2',
    concept_name: 'Vertical Line Test',
    question_text: 'Which graph does NOT represent a function?',
    question_svg: svg,
    options: shuffled.map(g => g.label),
    correct_answer: failGraph.label,
    correct_answer_index: shuffled.indexOf(failGraph),
    explanation: 'A circle fails the vertical line test — most vertical lines cross it at two points.',
    difficulty: 2,
    category: 'visual',
  };
}

// ────────────────────────────────────────────────────────────
// GENERATOR 3: Graphing Slope-Intercept
// M1.FLF.2.2
// ────────────────────────────────────────────────────────────

export function genSlopeInterceptGraph(): VisualQuestion {
  const m = randNonZero(-3, 3);
  const b = randInt(-4, 4);
  const xMin = -6, xMax = 6, yMin = -8, yMax = 8;

  // Draw the line
  const x1 = xMin, y1 = m * xMin + b;
  const x2 = xMax, y2 = m * xMax + b;

  const content = lineSegment(x1, y1, x2, y2, xMin, xMax, yMin, yMax) +
    dot(0, b, xMin, xMax, yMin, yMax, '#ef4444', 5);

  const svg = coordPlane(xMin, xMax, yMin, yMax, content);

  const correct = `y = ${m === 1 ? '' : m === -1 ? '-' : m}x ${b >= 0 ? '+ ' + b : '- ' + Math.abs(b)}`;

  // Distractors: wrong slope or wrong intercept
  const d1 = `y = ${-m === 1 ? '' : -m === -1 ? '-' : -m}x ${b >= 0 ? '+ ' + b : '- ' + Math.abs(b)}`;
  const d2 = `y = ${m === 1 ? '' : m === -1 ? '-' : m}x ${-b >= 0 ? '+ ' + (-b) : '- ' + Math.abs(b)}`;
  const wrongM = m + (m > 0 ? 1 : -1);
  const d3 = `y = ${wrongM === 1 ? '' : wrongM === -1 ? '-' : wrongM}x ${b >= 0 ? '+ ' + b : '- ' + Math.abs(b)}`;

  const allOptions = shuffle([correct, d1, d2, d3]);
  const correctIdx = allOptions.indexOf(correct);

  return {
    concept_id: 'M1.FLF.2.2',
    concept_name: 'Graphing Slope-Intercept',
    question_text: 'Which equation matches the line shown?',
    question_svg: svg,
    options: allOptions,
    correct_answer: LETTERS[correctIdx],
    correct_answer_index: correctIdx,
    explanation: `The line crosses the y-axis at ${b} (y-intercept) and rises/falls ${Math.abs(m)} for every 1 unit right (slope = ${m}).`,
    difficulty: 2,
    category: 'visual',
  };
}

// ────────────────────────────────────────────────────────────
// GENERATOR 4: Horizontal/Vertical Lines
// M1.FLF.2.4
// ────────────────────────────────────────────────────────────

export function genHorizVertLines(): VisualQuestion {
  const isHoriz = Math.random() > 0.5;
  const val = randNonZero(-4, 4);
  const xMin = -6, xMax = 6, yMin = -6, yMax = 6;

  let content: string;
  let correct: string;
  let slopeAns: string;

  if (isHoriz) {
    content = lineSegment(xMin, val, xMax, val, xMin, xMax, yMin, yMax);
    correct = `y = ${val}`;
    slopeAns = '0';
  } else {
    content = lineSegment(val, yMin, val, yMax, xMin, xMax, yMin, yMax);
    correct = `x = ${val}`;
    slopeAns = 'undefined';
  }

  const svg = coordPlane(xMin, xMax, yMin, yMax, content);

  const distractors = [
    isHoriz ? `x = ${val}` : `y = ${val}`,
    `y = ${-val}`,
    `x = ${-val}`,
  ];

  const allOptions = shuffle([correct, ...distractors.slice(0, 3)]);
  const correctIdx = allOptions.indexOf(correct);

  return {
    concept_id: 'M1.FLF.2.4',
    concept_name: 'Horizontal/Vertical Lines',
    question_text: 'Which equation represents the line shown?',
    question_svg: svg,
    options: allOptions,
    correct_answer: LETTERS[correctIdx],
    correct_answer_index: correctIdx,
    explanation: `${isHoriz ? 'Horizontal' : 'Vertical'} line at ${val}. Equation: ${correct}. Slope is ${slopeAns}.`,
    difficulty: 2,
    category: 'visual',
  };
}

// ────────────────────────────────────────────────────────────
// GENERATOR 5: Graphing 2-Variable Inequalities
// M1.FLF.5.1
// ────────────────────────────────────────────────────────────

export function genTwoVarInequality(): VisualQuestion {
  const m = randNonZero(-2, 2);
  const b = randInt(-3, 3);
  const ops = ['<', '>', '≤', '≥'] as const;
  const op = ops[randInt(0, 3)];
  const dashed = op === '<' || op === '>';
  const above = op === '>' || op === '≥';

  const xMin = -6, xMax = 6, yMin = -8, yMax = 8;
  const plotW = SVG_W - 2 * PAD;
  const plotH = SVG_H - 2 * PAD;
  const sx = (x: number) => PAD + ((x - xMin) / (xMax - xMin)) * plotW;
  const sy = (y: number) => PAD + ((yMax - y) / (yMax - yMin)) * plotH;

  // Shaded region
  const pts: string[] = [];
  for (let x = xMin; x <= xMax; x += 0.5) {
    const y = m * x + b;
    pts.push(`${sx(x)},${sy(y)}`);
  }

  let shadePath: string;
  if (above) {
    shadePath = `<polygon points="${pts.join(' ')} ${sx(xMax)},${PAD} ${sx(xMin)},${PAD}" fill="${POINT_COLOR}" opacity="0.15"/>`;
  } else {
    shadePath = `<polygon points="${pts.join(' ')} ${sx(xMax)},${SVG_H - PAD} ${sx(xMin)},${SVG_H - PAD}" fill="${POINT_COLOR}" opacity="0.15"/>`;
  }

  const line = lineSegment(xMin, m * xMin + b, xMax, m * xMax + b, xMin, xMax, yMin, yMax, POINT_COLOR, dashed);

  const svg = coordPlane(xMin, xMax, yMin, yMax, shadePath + line);

  const mStr = m === 1 ? '' : m === -1 ? '-' : `${m}`;
  const bStr = b >= 0 ? ` + ${b}` : ` - ${Math.abs(b)}`;
  const correct = `y ${op} ${mStr}x${b === 0 ? '' : bStr}`;

  const wrongOps = ops.filter(o => o !== op);
  const distractors = wrongOps.slice(0, 3).map(o => {
    return `y ${o} ${mStr}x${b === 0 ? '' : bStr}`;
  });

  const allOptions = shuffle([correct, ...distractors]);
  const correctIdx = allOptions.indexOf(correct);

  return {
    concept_id: 'M1.FLF.5.1',
    concept_name: 'Graphing 2-var Inequalities',
    question_text: 'Which inequality matches the graph?',
    question_svg: svg,
    options: allOptions,
    correct_answer: LETTERS[correctIdx],
    correct_answer_index: correctIdx,
    explanation: `${dashed ? 'Dashed' : 'Solid'} line (${dashed ? 'strict' : 'inclusive'} inequality), shaded ${above ? 'above' : 'below'} → y ${op} ${mStr}x${b === 0 ? '' : bStr}.`,
    difficulty: 3,
    category: 'visual',
  };
}

// ────────────────────────────────────────────────────────────
// GENERATOR 6: Compare Functions (table vs equation)
// M1.FLF.7.1
// ────────────────────────────────────────────────────────────

export function genCompareFunctions(): VisualQuestion {
  const m1 = randNonZero(-3, 3);
  const b1 = randInt(-4, 4);
  const m2 = m1 + randNonZero(-2, 2);
  const b2 = randInt(-4, 4);

  // f(x) shown as equation
  // g(x) shown as table
  const tableX = [0, 1, 2, 3];
  const tableY = tableX.map(x => m2 * x + b2);

  const tableRows = tableX.map((x, i) =>
    `<tr><td style="padding:4px 12px;text-align:center;border:1px solid #e2e8f0">${x}</td><td style="padding:4px 12px;text-align:center;border:1px solid #e2e8f0">${tableY[i]}</td></tr>`
  ).join('');

  // Use HTML table inside foreignObject
  const tableSvg = `<foreignObject x="20" y="20" width="320" height="200">
    <div xmlns="http://www.w3.org/1999/xhtml" style="font-family:sans-serif;font-size:13px">
      <p style="margin:0 0 8px;font-weight:600;color:#334155">f(x) = ${m1 === 1 ? '' : m1 === -1 ? '-' : m1}x ${b1 >= 0 ? '+ ' + b1 : '- ' + Math.abs(b1)}</p>
      <p style="margin:0 0 4px;font-weight:600;color:#334155">g(x):</p>
      <table style="border-collapse:collapse;font-size:12px">
        <tr style="background:#f1f5f9"><th style="padding:4px 12px;border:1px solid #e2e8f0">x</th><th style="padding:4px 12px;border:1px solid #e2e8f0">g(x)</th></tr>
        ${tableRows}
      </table>
    </div>
  </foreignObject>`;

  const svg = `<svg viewBox="0 0 360 220" xmlns="http://www.w3.org/2000/svg" style="max-width:100%;height:auto;background:#fff;border-radius:8px;border:1px solid #e2e8f0">${tableSvg}</svg>`;

  const greaterSlope = Math.abs(m1) > Math.abs(m2) ? 'f(x)' :
    Math.abs(m2) > Math.abs(m1) ? 'g(x)' : 'They are equal';
  const greaterIntercept = b1 > b2 ? 'f(x)' : b2 > b1 ? 'g(x)' : 'They are equal';

  // Ask about rate of change (slope)
  const correct = `f(x) has slope ${m1}, g(x) has slope ${m2}`;
  const options = [
    `f(x) has slope ${m1}, g(x) has slope ${m2}`,
    `f(x) has slope ${m1}, g(x) has slope ${m2 + 1}`,
    `f(x) has slope ${b1}, g(x) has slope ${b2}`,
    `f(x) has slope ${m2}, g(x) has slope ${m1}`,
  ];

  const allOptions = shuffle(options);
  const correctIdx = allOptions.indexOf(correct);

  return {
    concept_id: 'M1.FLF.7.1',
    concept_name: 'Compare Functions',
    question_text: 'Compare the rates of change (slopes) of f(x) and g(x).',
    question_svg: svg,
    options: allOptions,
    correct_answer: LETTERS[correctIdx],
    correct_answer_index: correctIdx,
    explanation: `f(x) slope = ${m1} (from equation). g(x) slope = (${tableY[1]} - ${tableY[0]}) / (1 - 0) = ${m2} (from table).`,
    difficulty: 3,
    category: 'analysis',
  };
}

// ────────────────────────────────────────────────────────────
// GENERATOR 7: Solve Systems by Graphing
// M1.SYS.1.2
// ────────────────────────────────────────────────────────────

export function genSystemGraphing(): VisualQuestion {
  // Create two lines that intersect at integer point
  const ix = randInt(-3, 3);
  const iy = randInt(-3, 3);
  const m1 = randNonZero(-2, 2);
  let m2 = randNonZero(-2, 2);
  while (m2 === m1) m2 = randNonZero(-2, 2);

  const b1 = iy - m1 * ix;
  const b2 = iy - m2 * ix;

  const xMin = -6, xMax = 6, yMin = -8, yMax = 8;

  const line1 = lineSegment(xMin, m1 * xMin + b1, xMax, m1 * xMax + b1, xMin, xMax, yMin, yMax, LINE_COLORS[0]);
  const line2 = lineSegment(xMin, m2 * xMin + b2, xMax, m2 * xMax + b2, xMin, xMax, yMin, yMax, LINE_COLORS[1]);
  const point = dot(ix, iy, xMin, xMax, yMin, yMax, '#000', 5);

  const svg = coordPlane(xMin, xMax, yMin, yMax, line1 + line2 + point);

  const correct = `(${ix}, ${iy})`;
  const distractors = [
    `(${iy}, ${ix})`,
    `(${ix + 1}, ${iy - 1})`,
    `(${ix - 1}, ${iy + 1})`,
  ];

  const allOptions = shuffle([correct, ...distractors]);
  const correctIdx = allOptions.indexOf(correct);

  return {
    concept_id: 'M1.SYS.1.2',
    concept_name: 'Solve by Graphing',
    question_text: 'What is the solution to the system shown?',
    question_svg: svg,
    options: allOptions,
    correct_answer: LETTERS[correctIdx],
    correct_answer_index: correctIdx,
    explanation: `The two lines intersect at the point (${ix}, ${iy}). This is the solution that satisfies both equations.`,
    difficulty: 2,
    category: 'visual',
  };
}

// ────────────────────────────────────────────────────────────
// GENERATOR 8: System of Inequalities
// M1.SYS.5.1
// ────────────────────────────────────────────────────────────

export function genSystemInequalities(): VisualQuestion {
  // Two inequalities, ask which point is in the solution region
  const m1 = 1, b1 = randInt(-2, 2);
  const m2 = -1, b2 = randInt(-2, 2);

  const xMin = -6, xMax = 6, yMin = -6, yMax = 6;
  const plotW = SVG_W - 2 * PAD;
  const plotH = SVG_H - 2 * PAD;
  const sx = (x: number) => PAD + ((x - xMin) / (xMax - xMin)) * plotW;
  const sy = (y: number) => PAD + ((yMax - y) / (yMax - yMin)) * plotH;

  // Shade above line1 and below line2 (overlap region)
  const line1svg = lineSegment(xMin, m1 * xMin + b1, xMax, m1 * xMax + b1, xMin, xMax, yMin, yMax, LINE_COLORS[0], true);
  const line2svg = lineSegment(xMin, m2 * xMin + b2, xMax, m2 * xMax + b2, xMin, xMax, yMin, yMax, LINE_COLORS[1], true);

  // Find test points
  const testPoints = [
    { x: 0, y: b1 + b2 + 2 },      // likely in overlap
    { x: 3, y: -5 },                // likely outside
    { x: -3, y: 5 },                // likely outside
    { x: 0, y: -b1 - 3 },          // likely outside
  ];

  // Check which satisfies both: y > x + b1 AND y < -x + b2
  const validPoints = testPoints.map(p => ({
    ...p,
    valid: (p.y > m1 * p.x + b1) && (p.y < m2 * p.x + b2)
  }));

  // Ensure at least one valid point
  let correctPt = validPoints.find(p => p.valid);
  if (!correctPt) {
    // Compute intersection and pick above
    const ix = (b2 - b1) / 2;
    const iy = ix + b1 + 0.5;
    correctPt = { x: Math.round(ix), y: Math.round(iy), valid: true };
    validPoints[0] = correctPt;
  }

  const dots = testPoints.map((p, i) =>
    dot(p.x, p.y, xMin, xMax, yMin, yMax, validPoints[i].valid ? '#10b981' : '#ef4444', 5)
  ).join('');

  const labels = testPoints.map((p, i) => {
    const plotW2 = SVG_W - 2 * PAD;
    const plotH2 = SVG_H - 2 * PAD;
    const px = PAD + ((p.x - xMin) / (xMax - xMin)) * plotW2;
    const py = PAD + ((yMax - p.y) / (yMax - yMin)) * plotH2;
    return `<text x="${px + 8}" y="${py - 8}" font-size="11" font-weight="600" fill="#334155">${LETTERS[i]}</text>`;
  }).join('');

  const svg = coordPlane(xMin, xMax, yMin, yMax, line1svg + line2svg + dots + labels);

  const correctIdx = validPoints.findIndex(p => p.valid);

  return {
    concept_id: 'M1.SYS.5.1',
    concept_name: 'System of Inequalities',
    question_text: 'Which point is in the solution region of the system?',
    question_svg: svg,
    options: testPoints.map((p, i) => `${LETTERS[i]}: (${p.x}, ${p.y})`),
    correct_answer: LETTERS[correctIdx],
    correct_answer_index: correctIdx,
    explanation: `Point (${correctPt.x}, ${correctPt.y}) satisfies both inequalities. It lies in the overlapping shaded region.`,
    difficulty: 3,
    category: 'visual',
  };
}

// ────────────────────────────────────────────────────────────
// GENERATOR 9: Interpret Scatter Plots
// M1.DAS.3.2
// ────────────────────────────────────────────────────────────

export function genScatterPlot(): VisualQuestion {
  const correlations = ['positive', 'negative', 'none'] as const;
  const type = correlations[randInt(0, 2)];
  const xMin = 0, xMax = 10, yMin = 0, yMax = 10;

  // Generate points
  const points: Array<{ x: number; y: number }> = [];
  for (let i = 0; i < 12; i++) {
    const x = randInt(1, 9) + Math.random();
    let y: number;
    if (type === 'positive') {
      y = x * 0.8 + randInt(-2, 2) + Math.random();
    } else if (type === 'negative') {
      y = 10 - x * 0.8 + randInt(-2, 2) + Math.random();
    } else {
      y = randInt(1, 9) + Math.random();
    }
    y = Math.max(0.5, Math.min(9.5, y));
    points.push({ x: Math.round(x * 10) / 10, y: Math.round(y * 10) / 10 });
  }

  const dots = points.map(p =>
    dot(p.x, p.y, xMin, xMax, yMin, yMax, POINT_COLOR, 4)
  ).join('');

  const svg = coordPlane(xMin, xMax, yMin, yMax, dots);

  const correct = type === 'positive' ? 'Positive correlation' :
    type === 'negative' ? 'Negative correlation' : 'No correlation';

  const options = shuffle([
    'Positive correlation',
    'Negative correlation',
    'No correlation',
    'Perfect correlation',
  ]);
  const correctIdx = options.indexOf(correct);

  return {
    concept_id: 'M1.DAS.3.2',
    concept_name: 'Interpret Scatter Plots',
    question_text: 'What type of correlation does the scatter plot show?',
    question_svg: svg,
    options,
    correct_answer: LETTERS[correctIdx],
    correct_answer_index: correctIdx,
    explanation: `Points trend ${type === 'positive' ? 'upward from left to right' : type === 'negative' ? 'downward from left to right' : 'without a clear pattern'}, indicating ${correct.toLowerCase()}.`,
    difficulty: 2,
    category: 'visual',
  };
}

// ────────────────────────────────────────────────────────────
// GENERATOR 10: Transformations Intro
// M1.GEO.TRANS.1.1
// ────────────────────────────────────────────────────────────

export function genTransformationType(): VisualQuestion {
  const types = ['translation', 'reflection', 'rotation', 'dilation'] as const;
  const type = types[randInt(0, 3)];

  // Original triangle
  const origPts = [
    { x: 1, y: 1 },
    { x: 3, y: 1 },
    { x: 2, y: 3 },
  ];

  let transPts: typeof origPts;
  const xMin = -6, xMax = 8, yMin = -4, yMax = 6;

  switch (type) {
    case 'translation':
      const dx = randInt(2, 4), dy = randInt(1, 3);
      transPts = origPts.map(p => ({ x: p.x + dx, y: p.y + dy }));
      break;
    case 'reflection':
      transPts = origPts.map(p => ({ x: -p.x, y: p.y }));
      break;
    case 'rotation':
      transPts = origPts.map(p => ({ x: -p.y, y: p.x })); // 90° CCW about origin
      break;
    case 'dilation':
      transPts = origPts.map(p => ({ x: p.x * 2, y: p.y * 2 }));
      break;
  }

  const plotW = SVG_W - 2 * PAD;
  const plotH = SVG_H - 2 * PAD;
  const sx = (x: number) => PAD + ((x - xMin) / (xMax - xMin)) * plotW;
  const sy = (y: number) => PAD + ((yMax - y) / (yMax - yMin)) * plotH;

  const origPath = `<polygon points="${origPts.map(p => `${sx(p.x)},${sy(p.y)}`).join(' ')}" fill="${LINE_COLORS[0]}33" stroke="${LINE_COLORS[0]}" stroke-width="2"/>`;
  const transPath = `<polygon points="${transPts.map(p => `${sx(p.x)},${sy(p.y)}`).join(' ')}" fill="${LINE_COLORS[1]}33" stroke="${LINE_COLORS[1]}" stroke-width="2"/>`;

  const svg = coordPlane(xMin, xMax, yMin, yMax, origPath + transPath);

  const correct = type.charAt(0).toUpperCase() + type.slice(1);
  const options = shuffle(['Translation', 'Reflection', 'Rotation', 'Dilation']);
  const correctIdx = options.indexOf(correct);

  return {
    concept_id: 'M1.GEO.TRANS.1.1',
    concept_name: 'Transformations Intro',
    question_text: 'What type of transformation maps the blue triangle to the red triangle?',
    question_svg: svg,
    options,
    correct_answer: LETTERS[correctIdx],
    correct_answer_index: correctIdx,
    explanation: `${correct}: ${type === 'translation' ? 'slides without changing size/shape' : type === 'reflection' ? 'flips across a line' : type === 'rotation' ? 'turns around a point' : 'changes size but keeps shape'}.`,
    difficulty: 2,
    category: 'visual',
  };
}

// ────────────────────────────────────────────────────────────
// GENERATOR 11: Line Symmetry
// M1.GEO.TRANS.8.1
// ────────────────────────────────────────────────────────────

export function genLineSymmetry(): VisualQuestion {
  const shapes = [
    { name: 'Equilateral triangle', lines: 3, pts: [[180, 40], [100, 180], [260, 180]] },
    { name: 'Square', lines: 4, pts: [[110, 60], [250, 60], [250, 200], [110, 200]] },
    { name: 'Regular pentagon', lines: 5, pts: [[180, 40], [260, 110], [230, 200], [130, 200], [100, 110]] },
    { name: 'Circle', lines: -1, pts: [] }, // infinite — use circle element
    { name: 'Rectangle (non-square)', lines: 2, pts: [[90, 80], [270, 80], [270, 180], [90, 180]] },
    { name: 'Parallelogram', lines: 0, pts: [[120, 80], [280, 80], [240, 180], [80, 180]] },
  ];

  const shape = shapes[randInt(0, shapes.length - 1)];

  let shapeEl: string;
  if (shape.name === 'Circle') {
    shapeEl = `<circle cx="180" cy="130" r="80" fill="#6366f120" stroke="#6366f1" stroke-width="2"/>`;
  } else {
    shapeEl = `<polygon points="${shape.pts.map(p => p.join(',')).join(' ')}" fill="#6366f120" stroke="#6366f1" stroke-width="2"/>`;
  }

  const svg = `<svg viewBox="0 0 360 240" xmlns="http://www.w3.org/2000/svg" style="max-width:100%;height:auto;background:#fff;border-radius:8px;border:1px solid #e2e8f0">
    ${shapeEl}
    <text x="180" y="230" text-anchor="middle" font-size="13" fill="#64748b" font-weight="500">${shape.name}</text>
  </svg>`;

  const linesStr = shape.lines === -1 ? 'Infinite' : `${shape.lines}`;
  const correct = linesStr;

  let options: string[];
  if (shape.lines === -1) {
    options = shuffle(['0', '2', '4', 'Infinite']);
  } else {
    const wrong = [0, 1, 2, 3, 4, 5, 6].filter(n => n !== shape.lines).slice(0, 3);
    options = shuffle([linesStr, ...wrong.map(String)]);
  }

  const correctIdx = options.indexOf(correct);

  return {
    concept_id: 'M1.GEO.TRANS.8.1',
    concept_name: 'Line Symmetry',
    question_text: `How many lines of symmetry does this shape have?`,
    question_svg: svg,
    options,
    correct_answer: LETTERS[correctIdx],
    correct_answer_index: correctIdx,
    explanation: `A ${shape.name.toLowerCase()} has ${linesStr === 'Infinite' ? 'infinite' : linesStr} line(s) of symmetry.`,
    difficulty: 2,
    category: 'visual',
  };
}

// ────────────────────────────────────────────────────────────
// GENERATOR 12: Rotational Symmetry
// M1.GEO.TRANS.8.2
// ────────────────────────────────────────────────────────────

export function genRotationalSymmetry(): VisualQuestion {
  const shapes = [
    { name: 'Equilateral triangle', order: 3, angle: 120 },
    { name: 'Square', order: 4, angle: 90 },
    { name: 'Regular pentagon', order: 5, angle: 72 },
    { name: 'Regular hexagon', order: 6, angle: 60 },
  ];

  const shape = shapes[randInt(0, shapes.length - 1)];
  const n = shape.order;
  const cx = 180, cy = 120, r = 80;

  // Generate regular polygon vertices
  const vertices: string[] = [];
  for (let i = 0; i < n; i++) {
    const angle = (Math.PI * 2 * i) / n - Math.PI / 2;
    vertices.push(`${cx + r * Math.cos(angle)},${cy + r * Math.sin(angle)}`);
  }

  const poly = `<polygon points="${vertices.join(' ')}" fill="#6366f120" stroke="#6366f1" stroke-width="2"/>`;

  // Mark one vertex to show rotation
  const firstAngle = -Math.PI / 2;
  const markX = cx + r * Math.cos(firstAngle);
  const markY = cy + r * Math.sin(firstAngle);
  const marker = `<circle cx="${markX}" cy="${markY}" r="5" fill="#ef4444"/>`;

  const svg = `<svg viewBox="0 0 360 240" xmlns="http://www.w3.org/2000/svg" style="max-width:100%;height:auto;background:#fff;border-radius:8px;border:1px solid #e2e8f0">
    ${poly}${marker}
    <text x="180" y="225" text-anchor="middle" font-size="13" fill="#64748b" font-weight="500">${shape.name}</text>
  </svg>`;

  const correct = `${shape.angle}°`;
  const wrongAngles = [45, 60, 72, 90, 120, 180].filter(a => a !== shape.angle).slice(0, 3);
  const options = shuffle([correct, ...wrongAngles.map(a => `${a}°`)]);
  const correctIdx = options.indexOf(correct);

  return {
    concept_id: 'M1.GEO.TRANS.8.2',
    concept_name: 'Rotational Symmetry',
    question_text: `What is the smallest angle of rotation that maps this ${shape.name.toLowerCase()} onto itself?`,
    question_svg: svg,
    options,
    correct_answer: LETTERS[correctIdx],
    correct_answer_index: correctIdx,
    explanation: `A ${shape.name.toLowerCase()} has rotational symmetry of order ${n}. The smallest angle is 360° ÷ ${n} = ${shape.angle}°.`,
    difficulty: 2,
    category: 'visual',
  };
}

// ────────────────────────────────────────────────────────────
// REGISTRY — All visual generators
// ────────────────────────────────────────────────────────────

export const VISUAL_GENERATORS: Record<string, () => VisualQuestion> = {
  'inequality_number_line': genInequalityNumberLine,
  'vertical_line_test': genVerticalLineTest,
  'slope_intercept_graph': genSlopeInterceptGraph,
  'horiz_vert_lines': genHorizVertLines,
  'two_var_inequality': genTwoVarInequality,
  'compare_functions': genCompareFunctions,
  'system_graphing': genSystemGraphing,
  'system_inequalities': genSystemInequalities,
  'scatter_plot': genScatterPlot,
  'transformation_type': genTransformationType,
  'line_symmetry': genLineSymmetry,
  'rotational_symmetry': genRotationalSymmetry,
};

/**
 * Generate a random visual question from any generator.
 */
export function generateVisualQuestion(generatorKey?: string): VisualQuestion {
  if (generatorKey && VISUAL_GENERATORS[generatorKey]) {
    return VISUAL_GENERATORS[generatorKey]();
  }
  const keys = Object.keys(VISUAL_GENERATORS);
  const key = keys[Math.floor(Math.random() * keys.length)];
  return VISUAL_GENERATORS[key]();
}

/**
 * Generate N visual questions, cycling through generators.
 */
export function generateVisualQuestionSet(count: number): VisualQuestion[] {
  const keys = Object.keys(VISUAL_GENERATORS);
  const questions: VisualQuestion[] = [];
  const shuffledKeys = shuffle(keys);

  for (let i = 0; i < count; i++) {
    const key = shuffledKeys[i % shuffledKeys.length];
    questions.push(VISUAL_GENERATORS[key]());
  }

  return questions;
}
