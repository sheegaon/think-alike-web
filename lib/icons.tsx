import type React from "react"
export const CheckIcon = ({ className, ...props }: React.SVGProps<SVGSVGElement>) => (
  <svg className={className} fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" {...props}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
  </svg>
)

export const ChevronDownIcon = ({ className, ...props }: React.SVGProps<SVGSVGElement>) => (
  <svg className={className} fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" {...props}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
  </svg>
)

export const ChevronUpIcon = ({ className, ...props }: React.SVGProps<SVGSVGElement>) => (
  <svg className={className} fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" {...props}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M5 15l7-7 7 7" />
  </svg>
)

export const XIcon = ({ className, ...props }: React.SVGProps<SVGSVGElement>) => (
  <svg className={className} fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" {...props}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
  </svg>
)

export const ArrowLeft = ({ className, ...props }: React.SVGProps<SVGSVGElement>) => (
  <svg className={className} fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" {...props}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M19 12H5m7-7l-7 7 7 7" />
  </svg>
)

export const ArrowRight = ({ className, ...props }: React.SVGProps<SVGSVGElement>) => (
  <svg className={className} fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" {...props}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M5 12h14m-7-7l7 7-7 7" />
  </svg>
)

export const Icons = {
  Users: () => (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z"
      />
    </svg>
  ),
  Coins: () => (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1"
      />
    </svg>
  ),
  Clock: () => (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
      />
    </svg>
  ),
  Eye: () => (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
      />
    </svg>
  ),
  Play: () => (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M14.828 14.828a4 4 0 01-5.656 0M9 10h1.586a1 1 0 01.707.293l2.414 2.414a1 1 0 00.707.293H15"
      />
    </svg>
  ),
  Gear: () => (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
      />
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
    </svg>
  ),
  Info: () => (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
      />
    </svg>
  ),
  Home: () => (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"
      />
    </svg>
  ),
  Refresh: () => (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h5" />
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 20v-5h-5" />
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 9a9 9 0 0114.65-4.65l1.35 1.35" />
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 15a9 9 0 01-14.65 4.65l-1.35-1.35" />
    </svg>
  ),
  // Think Alike Game Icons
  Logout: () => (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"
      />
      <polyline
        points="16,17 21,12 16,7"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
      />
      <line x1="21" y1="12" x2="9" y2="12" strokeLinecap="round" strokeWidth={2} />
    </svg>
  ),
  Leaderboard: () => (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <rect x="4" y="14" width="4" height="6" fill="currentColor" />
      <rect x="10" y="10" width="4" height="10" fill="currentColor" />
      <rect x="16" y="12" width="4" height="8" fill="currentColor" />
      <polygon
        points="12,2 13.5,6 18,6 14.5,9 16,13 12,10.5 8,13 9.5,9 6,6 10.5,6"
        fill="currentColor"
      />
    </svg>
  ),
  Rewards: () => (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <rect x="4" y="12" width="16" height="8" rx="1" strokeWidth={2} fill="none" />
    <path d="M4 12V8a8 8 0 0 1 16 0v4" strokeWidth={2} fill="none" strokeLinecap="round" />
    <rect x="10" y="14" width="4" height="3" rx="0.5" fill="currentColor" />
    <circle cx="12" cy="15.5" r="0.8" fill="white" stroke="none" />
    <rect x="11.7" y="16" width="0.6" height="0.8" fill="white" stroke="none" />
    <circle cx="7" cy="16" r="0.8" fill="currentColor" opacity="0.6" />
    <circle cx="17" cy="16" r="0.8" fill="currentColor" opacity="0.6" />
    <circle cx="8.5" cy="18" r="0.6" fill="currentColor" opacity="0.4" />
    <circle cx="15.5" cy="18" r="0.6" fill="currentColor" opacity="0.4" />
    <rect x="3" y="11" width="2" height="2" rx="0.5" fill="currentColor" />
    <rect x="19" y="11" width="2" height="2" rx="0.5" fill="currentColor" />
  </svg>
),
  Settings: () => (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <circle cx="12" cy="12" r="3" strokeWidth={2} />
      <path
        strokeWidth={2}
        d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1 1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"
      />
    </svg>
  ),
  Start: () => (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <polygon
        points="5,3 19,12 5,21"
        fill="currentColor"
        strokeLinejoin="round"
        strokeWidth={2}
      />
    </svg>
  ),
  Lobby: () => (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <rect x="6" y="2" width="12" height="18" rx="1" strokeWidth={2} />
      <circle cx="16" cy="12" r="1" fill="currentColor" />
      <circle cx="3" cy="8" r="1.5" fill="currentColor" />
      <circle cx="21" cy="8" r="1.5" fill="currentColor" />
      <line x1="3" y1="10" x2="3" y2="14" strokeWidth={1} />
      <line x1="21" y1="10" x2="21" y2="14" strokeWidth={1} />
    </svg>
  ),
  Username: () => (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"
      />
      <circle cx="12" cy="7" r="4" strokeWidth={2} />
    </svg>
  ),
  SyncCoins: () => (
  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <circle
      cx="9"
      cy="10"
      r="6"
      strokeWidth={2}
      fill="none"
    />

    <circle
      cx="15"
      cy="14"
      r="6"
      strokeWidth={2}
      fill="white"
      stroke="currentColor"
    />

    <path
      d="M13 12v6M17 12v6M15 10.5v1.5a1.5 1.5 0 0 1-1.5 1.5M15 17.5v-1.5a1.5 1.5 0 0 1 1.5-1.5"
      strokeWidth={1.5}
      strokeLinecap="round"
    />
  </svg>
  ),
  Players: () => (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <circle cx="6" cy="6" r="3" strokeWidth={1.5} />
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={1.5}
        d="M2 18v-1.5a3 3 0 0 1 3-3h2a3 3 0 0 1 3 3V18"
      />
      <circle cx="12" cy="6" r="3" strokeWidth={1.5} />
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={1.5}
        d="M8 18v-1.5a3 3 0 0 1 3-3h2a3 3 0 0 1 3 3V18"
      />
      <circle cx="18" cy="6" r="3" strokeWidth={1.5} />
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={1.5}
        d="M14 18v-1.5a3 3 0 0 1 3-3h2a3 3 0 0 1 3 3V18"
      />
    </svg>
  ),
  Continue: () => (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <polyline
        points="9,18 15,12 9,6"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2.5}
      />
      <path d="M15 12H3" strokeLinecap="round" strokeWidth={2.5} />
    </svg>
  ),
  ThinkAlike: () => (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path
        strokeWidth={2}
        d="M8 4a4 4 0 0 1 8 0v1a4 4 0 0 1-2 3.46V12a2 2 0 0 1-4 0V8.46A4 4 0 0 1 8 5V4z"
      />
      <circle cx="6" cy="18" r="2" fill="currentColor" />
      <circle cx="12" cy="18" r="2" fill="currentColor" />
      <circle cx="18" cy="18" r="2" fill="currentColor" />
      <line x1="8" y1="18" x2="10" y2="18" strokeWidth={2} />
      <line x1="14" y1="18" x2="16" y2="18" strokeWidth={2} />
      <line
        x1="12"
        y1="14"
        x2="12"
        y2="16"
        strokeWidth={1}
        strokeDasharray="2,2"
      />
    </svg>
  ),
  Cards: () => (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <rect
        x="6"
        y="8"
        width="12"
        height="16"
        rx="2"
        fill="currentColor"
        opacity="0.3"
        transform="rotate(-5 12 16)"
      />
      <rect
        x="6"
        y="6"
        width="12"
        height="16"
        rx="2"
        fill="currentColor"
        opacity="0.6"
        transform="rotate(-2 12 14)"
      />
      <rect x="6" y="4" width="12" height="16" rx="2" strokeWidth={1} />
      <circle cx="12" cy="10" r="1.5" fill="currentColor" />
      <line x1="9" y1="14" x2="15" y2="14" strokeLinecap="round" strokeWidth={1} />
      <line x1="10" y1="16" x2="14" y2="16" strokeLinecap="round" strokeWidth={1} />
    </svg>
  ),
}
