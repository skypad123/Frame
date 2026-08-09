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

async function fetchNameIndex(lang: "en" | "ja") {
  const response = await fetch(
    `https://db.ygorganization.com/data/idx/card/name/${lang}`,
    {
      headers: { Accept: "application/json" },
      next: { revalidate: 86400 },
    },
  );

  if (!response.ok) return null;
  return (await response.json()) as Record<string, number[]>;
}

export async function getEnglishNameByKonamiId(
  konamiId: number,
): Promise<string | null> {
  const response = await fetch(
    `https://db.ygorganization.com/data/card/${konamiId}`,
    {
      headers: { Accept: "application/json" },
      next: { revalidate: 86400 },
    },
  );

  if (!response.ok) return null;
  const data = (await response.json()) as YgoOrgCard;
  return data.cardData?.en?.name ?? null;
}

export async function searchJapaneseNames(
  query: string,
  limit = 12,
): Promise<Array<{ japaneseName: string; englishName: string; konamiId: number }>> {
  const index = await fetchNameIndex("ja");
  if (!index) return [];

  const exact = index[query]?.[0];
  const matches: Array<{ japaneseName: string; konamiId: number }> = [];

  if (exact) {
    matches.push({ japaneseName: query, konamiId: exact });
  } else {
    for (const [name, ids] of Object.entries(index)) {
      if (!name.includes(query) || !ids[0]) continue;
      matches.push({ japaneseName: name, konamiId: ids[0] });
      if (matches.length >= limit) break;
    }
  }

  const resolved = await Promise.all(
    matches.slice(0, limit).map(async (match) => {
      const englishName = await getEnglishNameByKonamiId(match.konamiId);
      if (!englishName) return null;
      return {
        japaneseName: match.japaneseName,
        englishName,
        konamiId: match.konamiId,
      };
    }),
  );

  return resolved.filter((item): item is NonNullable<typeof item> => Boolean(item));
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

  const index = await fetchNameIndex("en");
  if (!index) return null;

  const ids = index[options.englishName];
  if (!ids?.length) return null;

  return getJapaneseNameByKonamiId(ids[0]);
}
