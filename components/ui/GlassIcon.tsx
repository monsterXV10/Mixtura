import { SVGProps } from 'react';

const GLASS_PATHS: Record<string, string> = {
  'Martini':         'M3 3L21 3L12 17M12 17L12 21M8 21L16 21',
  'Coupe':           'M3 7Q12 17 21 7M12 15L12 21M8 21L16 21',
  'Nick & Nora':     'M5 7Q12 16 19 7M12 14L12 21M8 21L16 21',
  'Wine Glass':      'M9 4C6 9 6 14 12 18C18 14 18 9 15 4M9 4L15 4M12 18L12 21M8 21L16 21',
  'Champagne Flute': 'M10 3L10 20L14 20L14 3M10 3L14 3M12 20L12 22M9 22L15 22',
  'Highball':        'M7 4L7 21L17 21L17 4',
  'Old Fashioned':   'M5 11L5 21L19 21L19 11',
  'Collins':         'M8 2L8 22L16 22L16 2',
  'Hurricane':       'M4 3L20 3L16 12L19 21L5 21L8 12Z',
  'Tiki':            'M7 6Q7 3 12 3Q17 3 17 6L17 21L7 21Z',
  'Sling':           'M6 3L18 3L17 21L7 21Z',
  'Shot':            'M8 15L8 22L16 22L16 15',
  'Mule Cup':        'M6 8L6 21L18 21L18 8M18 11Q22 11 22 15Q22 19 18 19',
};

const DEFAULT_PATH = 'M7 4L7 21L17 21L17 4';

interface Props extends SVGProps<SVGSVGElement> {
  glass: string;
  size?: number;
}

export function GlassIcon({ glass, size = 24, ...props }: Props) {
  const d = GLASS_PATHS[glass] ?? DEFAULT_PATH;
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
    >
      <path d={d} />
    </svg>
  );
}
