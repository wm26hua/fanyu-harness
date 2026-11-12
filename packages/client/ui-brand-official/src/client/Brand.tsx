import { useId } from 'react'
import type { SidebarBrandMarkOwnerProps } from '@deepseek-ai/dsh-client-ui-sidebar/client'

/** Native viewBox of the brand mark, in the artwork's own user units. */
const MARK = { width: 41, height: 32 } as const

/** One linear gradient of the mark, in the mark's user units. */
interface MarkGradient {
  readonly x1: string
  readonly y1: string
  readonly x2: string
  readonly y2: string
  /** `[offset, colour]` pairs in declaration order. */
  readonly stops: readonly (readonly [string, string])[]
}

/** Gradients the mark's outlines reference, in declaration order. */
const MARK_GRADIENTS: readonly MarkGradient[] = [
  {
    x1: '2.5', y1: '5', x2: '20.5', y2: '32',
    stops: [
      ['0', '#99D6FE'],
      ['0.5', '#719DFF'],
      ['1', '#C19FFD'],
    ],
  },
  {
    x1: '16', y1: '20', x2: '22.6961', y2: '2.67676',
    stops: [
      ['0', '#A19DF8'],
      ['0.629808', '#736AEC'],
      ['1', '#3424D9'],
    ],
  },
  {
    x1: '16', y1: '20', x2: '22.6961', y2: '2.67676',
    stops: [
      ['0', '#BFA3FC'],
      ['0.355769', '#ADA9FE'],
      ['0.692308', '#96B4FF'],
      ['1', '#9AD6FF'],
    ],
  },
  {
    x1: '30.8772', y1: '0.0675401', x2: '34.9092', y2: '8.22264',
    stops: [
      ['0', '#A0DAFF'],
      ['1', '#BFA3FC'],
    ],
  },
  {
    x1: '31.7356', y1: '8.20881', x2: '46.3507', y2: '17.2222',
    stops: [
      ['0', '#DEEEF9'],
      ['0.5', '#96B7FF'],
      ['1', '#C19FFD'],
    ],
  },
]

/** Mark outlines paired with the index of the gradient each one fills. */
const MARK_OUTLINES: readonly (readonly [string, number])[] = [
  ['M5 16.0058C4.09342 9.39927 1.86207 5.51962 0 5.00563C9.2 3.00563 11 13.5054 12 19.0054C13.5455 27.5058 23.3793 30.6719 28.5 24.504C19 36.974 7.26421 32.5058 5 16.0058Z', 0],
  ['M14.5 21.504C9.75776 7.71748 20.8859 -0.543632 28 0.0278442V8.00399C21.1702 8.92298 15 14.004 14.5 21.504Z', 1],
  ['M14.5 21.504C9.75776 7.71748 20.8859 -0.543632 28 0.0278442V8.00399C21.1702 8.92298 15 14.004 14.5 21.504Z', 2],
  ['M30.3191 2.943C29.7412 3.56016 30.0783 4.28976 30.3191 4.57742L31.567 6.40793C32.0623 7.27963 33.066 7.0429 33.7081 6.65637C37.8419 4.16769 38.63 3.23511 39.317 2.66837C40.4834 1.70602 39.8911 1.43737 39.4746 1.60927C36.2433 2.943 35.9635 1.40884 35.4814 0.105639C35.3199 -0.552522 31.0416 2.17155 30.3191 2.943Z', 3],
  ['M35.7774 8.37349L31.0759 12.2871C31.0303 12.3251 31.0039 12.3786 31.0038 12.438C30.9886 20.0003 29.1146 36.3719 40.0918 28.4586C40.2575 28.3392 40.1644 28.0558 39.9601 28.0586C33.2604 28.1493 34.4771 16.4663 36.1034 8.56689C36.1417 8.38094 35.9233 8.25202 35.7774 8.37349Z', 4],
]

/** Height of the text wordmark artwork, matching the mark slot's default size. */
const WORDMARK = { width: 126, height: 24 } as const

/** The product wordmark as text, in the bundled brand face. */
const WORDMARK_TEXT = 'Fanyu harness'

/** Advance width the wordmark text is pinned to, in viewBox units. */
const WORDMARK_ADVANCE = 126

/**
 * Render the brand mark with the presentation requested by its host surface.
 * The mark keeps the brand's own gradient fills, so it reads on both the light
 * and the dark shell without a theme-specific variant.
 * @param props - Host-supplied mark presentation.
 * @returns the brand mark.
 */
export function OfficialBrandMark({ size }: SidebarBrandMarkOwnerProps) {
  // Gradient ids must be unique per mounted instance: the sidebar renders the
  // mark twice (expanded row and collapsed rail), and duplicate ids would make
  // the second instance resolve the first instance's paint server.
  const prefix = `fyh-brand-${useId().replace(/[^a-zA-Z0-9_-]/gu, '')}`
  return (
    <svg
      width={size}
      height={(size * MARK.height) / MARK.width}
      viewBox={`0 0 ${String(MARK.width)} ${String(MARK.height)}`}
      fill="none"
      aria-hidden="true"
    >
      <defs>
        {MARK_GRADIENTS.map((gradient, index) => (
          <linearGradient
            key={index}
            id={`${prefix}-${String(index)}`}
            x1={gradient.x1}
            y1={gradient.y1}
            x2={gradient.x2}
            y2={gradient.y2}
            gradientUnits="userSpaceOnUse"
          >
            {gradient.stops.map(([offset, color], stop) => <stop key={stop} offset={offset} stopColor={color} />)}
          </linearGradient>
        ))}
      </defs>
      {MARK_OUTLINES.map(([d, gradient]) => (
        <path key={d} d={d} fill={`url(#${prefix}-${String(gradient)})`} />
      ))}
    </svg>
  )
}

/**
 * Render the product wordmark as brand text rather than artwork.
 * Set in the bundled Montserrat face so no runtime font dependency is added.
 * @returns the wordmark svg.
 */
export function OfficialBrandName() {
  return (
    <svg
      width={(24 * WORDMARK.width) / WORDMARK.height}
      height={24}
      viewBox={`0 0 ${String(WORDMARK.width)} ${String(WORDMARK.height)}`}
      fill="none"
      aria-hidden="true"
    >
      <text
        x="0"
        y="17.8"
        fill="currentColor"
        style={{ fontFamily: 'var(--dsw-font-family-brand, Montserrat), system-ui, sans-serif' }}
        fontSize="18"
        fontWeight="500"
        letterSpacing="-0.2"
        textLength={WORDMARK_ADVANCE}
        lengthAdjust="spacing"
      >
        {WORDMARK_TEXT}
      </text>
    </svg>
  )
}
