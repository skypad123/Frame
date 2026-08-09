type YgoOrgCard = {
  cardData?: {
    en?: { name?: string };
    ja?: { name?: string; nameRuby?: string };
  };
};

const cardCache = new Map<number, { name: string | null; fetchedAt: number }>();
const CACHE_TTL_MS = 1000 * 60 * 60 * 12;

export async function getJapaneseNameByKonamiId(
  konamiId: number,
): Promise<string | null> {
  const cached = cardCache.get(konamiId);
  if (cached && Date.now() - cached.fetchedAt < CACHE_TTL_MS) {
    return cached.name;
  }

  const response = await fetch(
    `https://db.ygorganization.com/data/card/${konamiId}`,
    {
      headers: { Accept: "application/json" },
      next: { revalidate: 86400 },
    },
  );

  if (!response.ok) {
    cardCache.set(konamiId, { name: null, fetchedAt: Date.now() });
    return null;
  }

  const data = (await response.json()) as YgoOrgCard;
  const name = data.cardData?.ja?.name ?? null;
  cardCache.set(konamiId, { name, fetchedAt: Date.now() });
  return name;
}

export async function resolveJapaneseName(options: {
  konamiId?: number | null;
  englishName?: string;
  fallbackJapanese?: string | null;
}): Promise<string | null> {
  if (options.fallbackJapanese) return options.fallbackJapanese;

  if (options.konamiId) {
    const byId = await getJapaneseNameByKonamiId(options.konamiId);
    if (byId) return byId;
  }

  if (!options.englishName) return null;

  // Last-resort index lookup (large payload; cached by Next fetch)
  const indexResponse = await fetch(
    "https://db.ygorganization.com/data/idx/card/name/en",
    {
      headers: { Accept: "application/json" },
      next: { revalidate: 86400 },
    },
  );

  if (!indexResponse.ok) return null;

  const index = (await indexResponse.json()) as Record<string, number[]>;
  const ids = index[options.englishName];
  if (!ids?.length) return null;

  return getJapaneseNameByKonamiId(ids[0]);
}
