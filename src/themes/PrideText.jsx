// V2: pride rainbow rendering removed with the old theme system.
// Kept as a pass-through so the ~100 call sites need no immediate change.
export default function PrideText({ text }) {
  return <>{text}</>;
}

export function PrideTextWithDiv({ text }) {
  return <div>{text}</div>;
}
