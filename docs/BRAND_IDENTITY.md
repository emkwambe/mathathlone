# MathAthlone Brand Identity

**Status:** Draft for owner review — not committed or deployed

## Canonical Heat symbol

`public/brand/mathathlone-heat-flame.png` is the **exact owner-selected Heat symbol**.

It is used unchanged on white and print surfaces (`SHA-256: a37ec5cadff42c836d723590977425ba57e0f5c24dce1030a4fe7cc9c6b7ffe3`). It retains the original competition-gold flame, white internal sweep, and MathAthlone-indigo circle.

## Background-specific flame colorways

The Heat symbol's **geometry, transparency, and white sweep** remain unchanged. Only colors that lose separation against their assigned background are adjusted.

| Background | Symbol asset | Base treatment | Flame treatment | Purpose |
|---|---|---|---|---|
| **White** | `mathathlone-heat-flame.png` | Original MathAthlone indigo | Original competition-gold flame | Established primary treatment. |
| **Indigo / violet** | `mathathlone-heat-flame-violet-contrast.png` | Ink black `#0a0f1e` | Competition gold at the base fading vertically to warm brown `#78350f` at the tip | The darker base makes the cracked-circle form distinct against the hero gradient; the brown tip also separates from violet. |
| **Competition gold** | `mathathlone-heat-flame-gold-bg.png` | Original MathAthlone indigo | Black `#000000` | Prevents a gold flame from disappearing against the gold field. |
| **Print / PDF / worksheet** | `mathathlone-heat-flame-print-black.png` | Black `#000000` | Black `#000000` | Entire symbol and wordmark are all black for clear, low-ink printing. |

### Deterministic derivation disclosure

The violet-contrast and gold assets are deterministic color-only derivatives of the owner-selected original PNG. They preserve all other pixels, transparency, and geometry. No AI image generation, tracing, redrawing, cropping, or compositing was used.

| Colorway | Modified pixels | SHA-256 |
|---|---:|---|
| Violet contrast | 622,105 original indigo-base pixels changed to ink black; 334,206 original warm-flame pixels changed to a gold-to-brown vertical gradient | `8985ae81e1fe045aa93b97c860378bd48d1a8e2c8c1d84d97fabebb6049dea63` |
| Gold | 334,206 original warm-flame pixels changed to black | `b7e07bc3604b0fb32eb51b51b602523806b04bcb6606ceb67006b35e0dcd070e` |
| Print | 1,027,173 nontransparent pixels changed to black; original transparency and geometry retained | `e32c8e96e35c28cd0e880ae8c69e4031f730a13852fa3aad65edd8856b863976` |

## Wordmark color system

The shared component selects the correct mark and wordmark colors through `surface="white"`, `surface="indigo"`, `surface="gold"`, and `surface="print"`.

| Background | `Math` text | `Athlone` text |
|---|---|---|
| **White** | Wordmark blue `#2563eb` | Competition gold `#fbbf24` |
| **Indigo / violet hero** | White `#ffffff` | Competition gold `#fbbf24` |
| **Competition gold** | Black `#000000` | MathAthlone indigo `#312e81` |
| **Print / PDF** | Black `#000000` | Black `#000000` |

## Established MathAthlone colors

| Token | Value | Existing role |
|---|---:|---|
| MathAthlone indigo | `#312e81` | Hero gradient origin; original Heat circle |
| Arena indigo | `#4338ca` | Hero gradient core |
| Progress violet | `#6366f1` | Hero gradient lift |
| Wordmark blue | `#2563eb` | Existing white-surface `Math` lettering |
| Competition gold | `#fbbf24` | “a sport.” emphasis, CTA, original Heat flame |
| Warm brown | `#78350f` | Violet-background flame tip only |
| Ink black | `#0a0f1e` | Violet-background cracked-circle base only |
| White | `#ffffff` | Hero typography and original Heat sweep |
| Black | `#000000` | Gold-background Heat flame and print wordmark |

```css
linear-gradient(135deg, #312e81 0%, #4338ca 40%, #6366f1 100%)
```

## Guardrails

- Use `mathathlone-heat-flame.png` on white backgrounds.
- Use `mathathlone-heat-flame-violet-contrast.png` only on indigo/violet backgrounds.
- Use `mathathlone-heat-flame-gold-bg.png` only on competition-gold backgrounds.
- Use `mathathlone-heat-flame-print-black.png` on all worksheets and print/PDF documents.
- Do not create other variants, vector substitutes, redraws, crops, or alternate flame marks without owner review.
- Keep the Heat symbol and wordmark together in product headers.
- Do not use a generic flame emoji as the product logo.
