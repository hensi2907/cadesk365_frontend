import { getDoctypeList } from "../api/doctype";

interface QueueItem {
  name: string;
  resolve: (value: string) => void;
  reject: (reason?: any) => void;
}

const queueMap = new Map<string, { queue: QueueItem[]; timer: NodeJS.Timeout | null }>();
const cache = new Map<string, string>(); // key: "doctype:name:titleField"

/**
 * Batches requests for fetching a title_field value of a document name.
 * Resolves with the title (if found) or falls back to the original name.
 */
export async function resolveDocumentTitle(
  doctype: string,
  name: string,
  titleField: string
): Promise<string> {
  if (!name || !titleField || titleField === "name") return name;
  
  const cacheKey = `${doctype}:${name}:${titleField}`;
  if (cache.has(cacheKey)) {
    return cache.get(cacheKey)!;
  }

  return new Promise((resolve, reject) => {
    const queueKey = `${doctype}:${titleField}`;
    
    if (!queueMap.has(queueKey)) {
      queueMap.set(queueKey, { queue: [], timer: null });
    }
    
    const batch = queueMap.get(queueKey)!;
    batch.queue.push({ name, resolve, reject });
    
    if (batch.timer) clearTimeout(batch.timer);
    
    batch.timer = setTimeout(async () => {
      const currentQueue = batch.queue;
      queueMap.delete(queueKey); // Reset for next batch
      
      const namesToFetch = Array.from(new Set(currentQueue.map(q => q.name)));
      
      try {
        const results = await getDoctypeList(
          doctype,
          ["name", titleField],
          [["name", "in", namesToFetch]],
          0,
          namesToFetch.length
        );
        
        const resultMap = new Map(results.map((r: any) => [r.name, r[titleField]]));
        
        currentQueue.forEach(item => {
          const title = resultMap.get(item.name) || item.name;
          cache.set(`${doctype}:${item.name}:${titleField}`, title);
          item.resolve(title);
        });
        
      } catch (error) {
        console.error(`[TitleResolver] Failed to batch fetch titles for ${doctype}`, error);
        currentQueue.forEach(item => {
          // On error, resolve with name as fallback
          cache.set(`${doctype}:${item.name}:${titleField}`, item.name);
          item.resolve(item.name);
        });
      }
    }, 50); // 50ms batch window
  });
}

/**
 * Clear the cache entirely or for a specific document
 */
export function clearTitleCache(doctype?: string, name?: string, titleField?: string) {
  if (!doctype) {
    cache.clear();
    return;
  }
  if (name && titleField) {
    cache.delete(`${doctype}:${name}:${titleField}`);
  }
}
