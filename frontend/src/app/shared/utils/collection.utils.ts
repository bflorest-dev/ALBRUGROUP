export function upsertById<T extends { id: number }>(
  collection: T[],
  incoming: T,
  options?: { prependIfNew?: boolean }
): T[] {
  const index = collection.findIndex((item) => item.id === incoming.id);

  if (index === -1) {
    return options?.prependIfNew ? [incoming, ...collection] : [...collection, incoming];
  }

  const copy = [...collection];
  copy[index] = incoming;
  return copy;
}
