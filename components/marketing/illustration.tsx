import { cn } from "cn";

/**
 * Temporary stand-in art for the public site — design system §13 still asks for
 * real assets in `public/` later. Drawn rather than photographed because
 * FR-M15-06 forbids any image that implies a real client, and a stock photo
 * would suggest one.
 *
 * Inline SVG, not `next/image`: dark mode here is a class on `<html>`
 * (next-themes), which a file loaded through `<img>` cannot see. Inline, the
 * shapes inherit the same tokens as the rest of the page, so one drawing works
 * on the light card surface and on the navy brand panel.
 *
 * Every scene is assembled from cards — the same rounded surfaces the product
 * itself uses — with no text, no numbers and no logo, so nothing reads as a
 * claim about a real campaign.
 */
const TONES = {
  default: {
    frame: "border-border bg-muted/50",
    /** Card surfaces inside the drawing. */
    surface: "fill-card",
    /** Opaque base so a card in front hides the one behind it. */
    occluder: "fill-background",
    surfaceStroke: "stroke-border",
    /** Recessed areas: a video frame, a chart track. */
    well: "fill-muted-foreground/10",
    trackStroke: "stroke-muted-foreground/15",
    /** Skeleton copy: the heavier line stands in for a heading. */
    line: "fill-muted-foreground/40",
    lineSoft: "fill-muted-foreground/20",
    accent: "fill-info",
    accentSoft: "fill-info/25",
    accentStroke: "stroke-info",
    onAccent: "stroke-info-foreground",
    positive: "fill-success",
  },
  /**
   * On the navy panel a light card would punch a bright hole, so the brand tone
   * draws in the panel's own foreground at graded opacity instead.
   */
  brand: {
    frame: "border-brand-panel-foreground/20 bg-brand-panel-foreground/5",
    surface: "fill-brand-panel-foreground/10",
    occluder: "fill-brand-panel",
    surfaceStroke: "stroke-brand-panel-foreground/25",
    well: "fill-brand-panel-foreground/10",
    trackStroke: "stroke-brand-panel-foreground/15",
    line: "fill-brand-panel-foreground/45",
    lineSoft: "fill-brand-panel-foreground/25",
    accent: "fill-brand-panel-foreground/85",
    accentSoft: "fill-brand-panel-foreground/25",
    accentStroke: "stroke-brand-panel-foreground/85",
    onAccent: "stroke-brand-panel",
    positive: "fill-brand-panel-foreground/60",
  },
} as const;

type Tone = keyof typeof TONES;
type Palette = (typeof TONES)[Tone];

/** The card surface every scene is built from. */
function Surface({
  palette,
  x,
  y,
  width,
  height,
  radius = 12,
}: {
  palette: Palette;
  x: number;
  y: number;
  width: number;
  height: number;
  radius?: number;
}) {
  const box = { x, y, width, height, rx: radius };

  return (
    <g>
      {/* The brand surface is translucent, so without an opaque base the card
          behind it would show through wherever two cards overlap. */}
      <rect {...box} className={palette.occluder} />
      <rect {...box} strokeWidth={1.5} className={cn(palette.surface, palette.surfaceStroke)} />
    </g>
  );
}

/** Skeleton line: stands in for copy without inventing any. */
function Line({
  className,
  x,
  y,
  width,
  height = 6,
}: {
  className: string;
  x: number;
  y: number;
  width: number;
  height?: number;
}) {
  return <rect x={x} y={y} width={width} height={height} rx={height / 2} className={className} />;
}

/** Approved mark: the point where the team signs something off. */
function CheckBadge({
  palette,
  cx,
  cy,
  radius = 11,
}: {
  palette: Palette;
  cx: number;
  cy: number;
  radius?: number;
}) {
  const arm = radius * 0.42;

  return (
    <g>
      <circle cx={cx} cy={cy} r={radius} className={palette.accent} />
      <path
        d={`M${cx - arm} ${cy} l${arm * 0.75} ${arm * 0.75} l${arm * 1.25} ${-arm * 1.5}`}
        fill="none"
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
        className={palette.onAccent}
      />
    </g>
  );
}

/** Campaign report: a checkpoint chart and an approved creator row. */
function CampaignScene(palette: Palette) {
  const baseline = 150;
  const bars = [
    { x: 44, height: 26 },
    { x: 70, height: 38 },
    { x: 96, height: 30 },
    { x: 122, height: 52 },
    { x: 148, height: 64 },
  ];

  return (
    <>
      <Surface palette={palette} x={176} y={22} width={120} height={64} />
      <Line className={palette.line} x={192} y={40} width={58} height={7} />
      <Line className={palette.lineSoft} x={192} y={55} width={88} />
      <Line className={palette.lineSoft} x={192} y={69} width={44} />

      <Surface palette={palette} x={22} y={44} width={196} height={124} radius={14} />
      <circle cx={44} cy={68} r={11} className={palette.accentSoft} />
      <Line className={palette.line} x={64} y={61} width={68} height={8} />
      <Line className={palette.lineSoft} x={64} y={76} width={44} />

      {bars.map((bar, index) => (
        <rect
          key={bar.x}
          x={bar.x}
          y={baseline - bar.height}
          width={14}
          height={bar.height}
          rx={4}
          className={index === bars.length - 1 ? palette.accent : palette.lineSoft}
        />
      ))}
      <Line className={palette.lineSoft} x={40} y={baseline} width={122} height={2} />

      <Surface palette={palette} x={168} y={116} width={128} height={58} />
      <circle cx={192} cy={145} r={12} className={palette.accentSoft} />
      <Line className={palette.line} x={212} y={136} width={52} height={7} />
      <Line className={palette.lineSoft} x={212} y={150} width={36} />
      <CheckBadge palette={palette} cx={284} cy={128} />
    </>
  );
}

/** Content production: a vertical video draft waiting for review. */
function ContentScene(palette: Palette) {
  return (
    <>
      <Surface palette={palette} x={210} y={22} width={88} height={54} />
      <Line className={palette.lineSoft} x={226} y={38} width={44} />
      <Line className={palette.lineSoft} x={226} y={52} width={58} />

      <Surface palette={palette} x={16} y={26} width={196} height={140} radius={14} />
      <rect x={30} y={40} width={68} height={112} rx={10} className={palette.well} />
      <path d="M58 86 L58 106 L78 96 Z" className={palette.accent} />

      <Line className={palette.line} x={112} y={48} width={72} height={8} />
      <Line className={palette.lineSoft} x={112} y={66} width={56} />
      <Line className={palette.lineSoft} x={112} y={82} width={68} />
      <Line className={palette.lineSoft} x={112} y={98} width={38} />
      <rect x={112} y={118} width={36} height={16} rx={8} className={palette.accentSoft} />
      <rect x={154} y={118} width={28} height={16} rx={8} className={palette.lineSoft} />

      <Surface palette={palette} x={196} y={96} width={104} height={74} />
      <CheckBadge palette={palette} cx={218} cy={120} />
      <Line className={palette.line} x={236} y={114} width={48} height={7} />
      <Line className={palette.lineSoft} x={236} y={128} width={30} />
      <Line className={palette.lineSoft} x={212} y={146} width={72} />
      <Line className={palette.lineSoft} x={212} y={158} width={48} />
    </>
  );
}

/** Creator profile: audience verified before any assignment. */
function CreatorScene(palette: Palette) {
  const chips = [
    { x: 60, width: 52 },
    { x: 120, width: 40 },
    { x: 168, width: 46 },
  ];
  const stats = [60, 122, 184];

  return (
    <>
      <Line className={palette.lineSoft} x={72} y={14} width={136} height={12} />

      <Surface palette={palette} x={40} y={28} width={200} height={144} radius={14} />
      <circle cx={72} cy={64} r={20} className={palette.accentSoft} />
      <circle cx={72} cy={58} r={8} className={palette.line} />
      <path d="M56 80 a16 14 0 0 1 32 0 Z" className={palette.line} />
      <CheckBadge palette={palette} cx={90} cy={80} radius={10} />

      <Line className={palette.line} x={104} y={50} width={80} height={9} />
      <Line className={palette.lineSoft} x={104} y={68} width={56} />

      {chips.map((chip) => (
        <rect
          key={chip.x}
          x={chip.x}
          y={100}
          width={chip.width}
          height={18}
          rx={9}
          className={palette.lineSoft}
        />
      ))}

      {stats.map((x, index) => (
        <g key={x}>
          <rect x={x} y={128} width={52} height={32} rx={8} className={palette.well} />
          <Line
            className={index === 0 ? palette.positive : palette.lineSoft}
            x={x + 10}
            y={136}
            width={20}
          />
          <Line className={palette.lineSoft} x={x + 10} y={147} width={32} />
        </g>
      ))}

      <Surface palette={palette} x={244} y={56} width={60} height={58} />
      <Line className={palette.lineSoft} x={258} y={72} width={32} />
      <Line className={palette.lineSoft} x={258} y={86} width={22} />
    </>
  );
}

/** Audience verification: the split the team checks before assigning work. */
function VerificationScene(palette: Palette) {
  const radius = 32;
  const circumference = 2 * Math.PI * radius;
  const legend = [74, 94, 114];

  return (
    <>
      <Surface palette={palette} x={196} y={24} width={100} height={64} />
      <Line className={palette.lineSoft} x={212} y={42} width={44} />
      <Line className={palette.lineSoft} x={212} y={56} width={66} />
      <Line className={palette.lineSoft} x={212} y={70} width={32} />

      <Surface palette={palette} x={22} y={32} width={186} height={136} radius={14} />
      <circle
        cx={76}
        cy={98}
        r={radius}
        fill="none"
        strokeWidth={14}
        className={palette.trackStroke}
      />
      <circle
        cx={76}
        cy={98}
        r={radius}
        fill="none"
        strokeWidth={14}
        strokeLinecap="round"
        strokeDasharray={`${circumference * 0.62} ${circumference}`}
        transform="rotate(-90 76 98)"
        className={palette.accentStroke}
      />

      {legend.map((y, index) => (
        <g key={y}>
          <circle
            cx={132}
            cy={y}
            r={5}
            className={index === 0 ? palette.accent : palette.lineSoft}
          />
          <Line className={palette.lineSoft} x={146} y={y - 3} width={[52, 42, 28][index]} />
        </g>
      ))}

      <Surface palette={palette} x={178} y={110} width={118} height={64} />
      <CheckBadge palette={palette} cx={202} cy={142} />
      <Line className={palette.line} x={220} y={136} width={52} height={7} />
      <Line className={palette.lineSoft} x={220} y={150} width={36} />
    </>
  );
}

const SCENES = {
  /** Home hero — a campaign reported back to the institution. */
  kampanye: CampaignScene,
  /** Home, creator section — a creator producing content. */
  konten: ContentScene,
  /** Creator page hero — a local creator's profile. */
  kreator: CreatorScene,
  /** Creator page, stages — audience verification. */
  verifikasi: VerificationScene,
} as const;

/**
 * Decorative by design: each scene only repeats what the copy beside it already
 * says, so it stays out of the accessibility tree instead of making a screen
 * reader hear the same thing twice.
 */
export function MarketingIllustration({
  name,
  tone = "default",
  className,
}: {
  name: keyof typeof SCENES;
  tone?: Tone;
  className?: string;
}) {
  const palette = TONES[tone];

  return (
    <div aria-hidden className={cn("overflow-hidden rounded-xl border", palette.frame, className)}>
      {/* 16:10 like the placeholder it replaces, so dropping in a real asset
          later shifts nothing. */}
      <svg viewBox="0 0 320 200" className="block aspect-16/10 size-full" focusable="false">
        {SCENES[name](palette)}
      </svg>
    </div>
  );
}
