// =============================================================================
// CountryFlag.tsx — Flag emoji + country name display component
// =============================================================================
// Used in:
//   - HeatRoom lobby participant list
//   - Live leaderboard
//   - Post-heat results table
//   - User profile pages
// =============================================================================

import React from 'react';
import { countryCodeToFlag, getCountryName } from '@/lib/countries';

interface CountryFlagProps {
  /** ISO 3166-1 alpha-2 country code, e.g. "US", "NG", "ZW" */
  code: string;
  /** Whether to show the country name next to the flag */
  showName?: boolean;
  /** Size variant */
  size?: 'sm' | 'md' | 'lg';
  /** Additional CSS classes */
  className?: string;
}

const SIZE_CLASSES: Record<string, string> = {
  sm: 'text-base',
  md: 'text-xl',
  lg: 'text-3xl',
};

const NAME_SIZE_CLASSES: Record<string, string> = {
  sm: 'text-xs',
  md: 'text-sm',
  lg: 'text-base',
};

export function CountryFlag({
  code,
  showName = false,
  size = 'md',
  className = '',
}: CountryFlagProps) {
  const flag = countryCodeToFlag(code);
  const name = getCountryName(code);

  return (
    <span
      className={`inline-flex items-center gap-1 ${className}`}
      title={name}
      aria-label={`Flag of ${name}`}
    >
      <span className={SIZE_CLASSES[size]} role="img" aria-hidden="true">
        {flag}
      </span>
      {showName && (
        <span className={`${NAME_SIZE_CLASSES[size]} text-gray-600`}>
          {name}
        </span>
      )}
    </span>
  );
}

export default CountryFlag;
