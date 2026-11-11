import React from 'react';

/**
 * RCS Fabrics logo. Files live in /public/brand:
 *  - logo.webp       maroon lettering, for light backgrounds
 *  - logo-dark.webp  ivory lettering, for dark backgrounds
 * variant="auto" switches with the site's dark mode.
 */
export default function BrandLogo({
  height = 44,
  variant = 'auto',
  className = '',
  priority = false,
}: {
  height?: number;
  variant?: 'auto' | 'light' | 'dark';
  className?: string;
  priority?: boolean;
}) {
  const width = Math.round(height * (446 / 176)); // intrinsic aspect ratio
  const common = {
    width,
    height,
    alt: 'RCS Fabrics',
    decoding: 'async' as const,
    loading: priority ? ('eager' as const) : ('lazy' as const),
    fetchPriority: priority ? ('high' as const) : undefined,
    style: { height, width: 'auto' },
  };
  if (variant === 'light') return <img src="/brand/logo.webp" {...common} className={className} />;
  if (variant === 'dark') return <img src="/brand/logo-dark.webp" {...common} className={className} />;
  return (
    <>
      <img src="/brand/logo.webp" {...common} className={`dark:hidden ${className}`} />
      <img src="/brand/logo-dark.webp" {...common} alt="" aria-hidden="true" className={`hidden dark:block ${className}`} />
    </>
  );
}
