import { useState } from "react";

const LEAF_PATH =
  "M17 8C8 10 5.9 16.17 3.82 21.34L5.71 22L6.66 19.7C7.14 19.87 7.64 20 8 20C19 20 22 3 22 3C21 5 14 5.25 9 6.25C4 7.25 2 11.5 2 13.5C2 15.5 3.75 17.25 3.75 17.25C7 8 17 8 17 8Z";

interface Leaf {
  id: number;
  left: number;
  duration: number;
  delay: number;
  size: number;
}

function createLeaves(): Leaf[] {
  return Array.from({ length: 9 }, (_, id) => ({
    id,
    left: Math.random() * 95,
    duration: 10 + Math.random() * 10,
    delay: Math.random() * 8,
    size: Math.round(18 * (0.6 + Math.random() * 0.6)),
  }));
}

export function FallingLeaves({ enabled }: { enabled: boolean }) {
  const [leaves] = useState(createLeaves);

  if (!enabled) return null;

  return (
    <div aria-hidden="true">
      {leaves.map((leaf) => (
        <div
          key={leaf.id}
          className="tea-leaf-particle"
          style={{
            left: `${leaf.left}vw`,
            animationDuration: `${leaf.duration}s`,
            animationDelay: `${leaf.delay}s`,
          }}
        >
          <svg
            width={leaf.size}
            height={leaf.size}
            viewBox="0 0 24 24"
            fill="#22c55e"
          >
            <path d={LEAF_PATH} />
          </svg>
        </div>
      ))}
    </div>
  );
}
