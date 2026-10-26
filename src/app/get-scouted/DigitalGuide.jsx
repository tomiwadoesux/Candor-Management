// Framing illustrations, rather than presenting the roster's placeholder art
// as example application photographs. The accompanying text is the instruction.
export default function DigitalGuide({ pose }) {
  return (
    <svg viewBox="0 0 180 210" fill="none" aria-hidden="true" className="scout-pose">
      <g stroke="currentColor" strokeWidth="1.15" strokeLinecap="round" strokeLinejoin="round">
        <path d="M18 38V18h20m104 0h20v20M18 172v20h20m104 0h20v-20" opacity=".25" />
        {pose === 0 && <><path d="M64 83c0-23 11-37 26-37s26 14 26 37v13c0 20-12 35-26 35S64 116 64 96V83Z" /><path d="M76 126v16l-31 13c-9 4-14 14-14 28m73-57v16l31 13c9 4 14 14 14 28M77 85h7m12 0h7m-13 6-3 14h7m-12 10c5 3 11 3 16 0M64 80c17-4 26-13 32-23 4 13 11 20 20 23" /></>}
        {pose === 1 && <><path d="M65 139v-20c-10-12-16-27-16-43 0-20 13-32 33-32 19 0 30 15 30 31l12 19-13 5v16c-1 10-10 13-23 11v14l29 15c10 5 14 15 14 28M65 139l-27 16c-7 5-10 15-10 28M102 79h7m-1 29h8M82 83c-11-6-13 10-2 13" /></>}
        {pose === 2 && <><path d="M60 82c0-23 12-37 29-37 19 0 31 15 31 37v10c0 23-14 40-29 40-13 0-31-16-31-38V82Z" /><path d="M76 126v16l-32 14c-8 4-13 14-13 27m74-57v16l28 14c8 4 13 14 13 27M84 86h7m17 0h5m-13 4 5 15-9 1m-7 10c6 3 12 3 17-1M60 80c22-7 36-17 43-28m-30 35c-9-6-13 9-3 14" /></>}
        {pose === 3 && <><ellipse cx="90" cy="43" rx="12" ry="16" /><path d="M83 58v9l-21 7-15 61 7 3 20-48-3 35 5 57h11l3-46 3 46h11l5-57-3-35 20 48 7-3-15-61-21-7v-9M76 182l-5 6h16v-6m6 0v6h16l-5-6M72 120h36" /></>}
        {pose === 4 && <><path d="M82 56c-7-7-9-15-6-23 3-9 16-9 21-2l3 12 5 4-7 4-1 7-10 1v9c14 12 17 26 12 47l-2 11 3 56H89l-8-55-3-18c-7-17-6-29 4-42v-11ZM87 80l-4 26 9 31 6-3-4-28 4-20M89 182l-2 6h20l-7-6" /></>}
        {pose === 5 && <><path d="M46 165v-20c-12-14-19-29-19-37 0-6 6-7 9-1l8 12-4-46c0-6 6-7 8-1l5 29-1-45c0-6 7-7 8-1l5 44 2-48c1-6 7-5 7 1l1 50 6-35c1-6 7-4 6 2l-4 60c-1 9-5 14-12 19v17M109 165v-17c-7-5-11-10-12-19l-4-60c-1-6 5-8 6-2l6 35 1-50c0-6 6-7 7-1l2 48 5-44c1-6 8-5 8 1l-1 45 5-29c2-6 8-5 8 1l-4 46 8-12c3-6 9-5 9 1 0 8-7 23-19 37v20" /></>}
      </g>
    </svg>
  );
}
