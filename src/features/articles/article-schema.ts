import { z } from 'zod';
import { SOURCE_IDS } from '@/domain/article';
import { CATEGORIES } from '@/domain/category';

/**
 * Runtime shape of an `Article`, for data that doesn't come through an
 * adapter (e.g. a preview restored from browser history, which can outlive a
 * deploy). Anything that fails is ignored rather than crashing the page.
 */
export const articleSchema = z.object({
  id: z.string(),
  sourceId: z.enum(SOURCE_IDS),
  publisher: z.string(),
  title: z.string(),
  summary: z.string().optional(),
  url: z.url({ protocol: /^https?$/ }),
  imageUrl: z.string().optional(),
  authors: z.array(z.string()),
  category: z.enum(CATEGORIES).optional(),
  publishedAt: z.string().refine((value) => !Number.isNaN(Date.parse(value))),
});
