import type { CardSummary, YgoCard } from "@/lib/types";

const BASE = "https://db.ygoprodeck.com/api/v7/cardinfo.php";

async function fetchCards(params: URLSearchParams): Promise<YgoCard[]> {
  const response = await fetch(`${BASE}?${params.toString()}`, {
    headers: { Accept: "application/json" },
    next: { revalidate: 3600 },
  });

  if (response.status === 400) {
    return [];
  }

  if (!response.ok) {
    throw new Error(`YGOPRODeck request failed (${response.status})`);
  }

  const data = (await response.json()) as { data?: YgoCard[] };
  return data.data ?? [];
}

export function toCardSummary(card: YgoCard): CardSummary {
  const image = card.card_images?.[0];
  return {
    id: card.id,
    name: card.name,
    type: card.type,
    race: card.race,
    attribute: card.attribute,
    level: card.level,
    atk: card.atk,
    def: card.def,
    image: image?.image_url ?? "",
    imageSmall: image?.image_url_small ?? image?.image_url ?? "",
  };
}

export async function searchCards(query: string, limit = 12): Promise<YgoCard[]> {
  const trimmed = query.trim();
  if (!trimmed) return [];

  // Passcode search
  if (/^\d{4,9}$/.test(trimmed)) {
    return fetchCards(
      new URLSearchParams({
        id: trimmed,
        misc: "yes",
      }),
    );
  }

  // Prefer fuzzy name search; also try exact for short queries
  const fuzzy = await fetchCards(
    new URLSearchParams({
      fname: trimmed,
      num: String(limit),
      offset: "0",
      misc: "yes",
      sort: "name",
    }),
  );

  if (fuzzy.length > 0) return fuzzy;

  return fetchCards(
    new URLSearchParams({
      name: trimmed,
      misc: "yes",
    }),
  );
}

export async function getCardById(id: number): Promise<YgoCard | null> {
  const cards = await fetchCards(
    new URLSearchParams({
      id: String(id),
      misc: "yes",
    }),
  );
  return cards[0] ?? null;
}
