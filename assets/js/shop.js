const shopOffers = new Map();
let shopLoaded = false;
let shopHistory;

export async function loadShop() {
  try {
    const response = await fetch('https://fortnite-api.com/v2/shop', {
      signal: AbortSignal.timeout(3000)
    });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);

    const { data } = await response.json();
    const offers = new Map();
    const now = Date.now();

    for (const entry of data.entries) {
      if (entry.bundle || entry.tracks?.length !== 1 || !Number.isFinite(entry.finalPrice)) continue;
      const id = entry.tracks[0].devName;
      const startsAt = Date.parse(entry.inDate);
      const endsAt = Date.parse(entry.outDate);
      if (!id || !(startsAt <= now && now < endsAt)) continue;

      const existing = offers.get(id);
      if (!existing || endsAt > existing.endsAt) {
        offers.set(id, { endsAt });
      }
    }

    shopOffers.clear();
    for (const [id, offer] of offers) shopOffers.set(id, offer);
    shopLoaded = true;
  } catch (error) {
    shopOffers.clear();
    shopLoaded = false;
    console.warn('Unable to load Fortnite shop availability:', error);
  }
}

export function isShopLoaded() {
  return shopLoaded;
}

export function getShopOffer(track) {
  const offer = shopOffers.get(track.id);
  return offer && Date.now() < offer.endsAt ? offer : null;
}

export async function getLastShopAppearance(track) {
  shopHistory ??= loadShopHistory().catch(error => {
    shopHistory = undefined;
    throw error;
  });
  const lastSeenByTrack = await shopHistory;
  return lastSeenByTrack.get(track.id);
}

async function loadShopHistory() {
  const response = await fetch('https://fortnite-api.com/v2/cosmetics/tracks?responseFlags=4', {
    signal: AbortSignal.timeout(10000)
  });
  if (!response.ok) throw new Error(`HTTP ${response.status}`);

  const { data } = await response.json();
  const lastSeenByTrack = new Map();

  for (const track of data) {
    let latest = 0;
    for (const entry of track.shopHistory ?? []) {
      const date = Date.parse(entry);
      if (date > latest && date <= Date.now()) latest = date;
    }
    if (latest) lastSeenByTrack.set(track.devName, latest);
  }

  return lastSeenByTrack;
}
