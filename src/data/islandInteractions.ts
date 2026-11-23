export const islandAnimalActions = ["rabbit", "duck", "bird", "butterfly"] as const;
export type IslandAnimalAction = (typeof islandAnimalActions)[number];

export const islandAnimalInteraction = {
  rabbit: { label: "Cúi xuống gặp thỏ", response: "Thỏ tiến lại gần và ngửi tay bạn." },
  duck: { label: "Vẫy gọi vịt", response: "Đàn vịt bơi về phía bạn." },
  bird: { label: "Ra hiệu gọi chim", response: "Một chú chim hạ thấp vòng bay quanh bạn." },
  butterfly: { label: "Đưa tay đón bướm", response: "Bướm đậu nhẹ trên tay bạn." },
} satisfies Record<IslandAnimalAction, { label: string; response: string }>;

export type IslandWildlifePrompt = { nearby: readonly IslandAnimalAction[]; active: IslandAnimalAction | null };
