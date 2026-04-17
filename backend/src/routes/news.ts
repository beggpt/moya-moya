import { Router } from 'express';
import { prisma } from '../utils/prisma';
import { authMiddleware, AuthRequest } from '../middleware/auth';

const router = Router();
router.use(authMiddleware);

/**
 * Fetch recent moyamoya papers from PubMed E-utilities.
 * Free, no auth required. Returns PMIDs → then fetches summaries.
 */
async function fetchPubMed(query = 'moyamoya', maxResults = 20): Promise<any[]> {
  try {
    // Step 1: Search for PMIDs
    const searchUrl = `https://eutils.ncbi.nlm.nih.gov/entrez/eutils/esearch.fcgi?db=pubmed&term=${encodeURIComponent(query)}&retmode=json&retmax=${maxResults}&sort=date`;
    const searchRes = await fetch(searchUrl);
    const searchData: any = await searchRes.json();
    const ids: string[] = searchData?.esearchresult?.idlist || [];
    if (!ids.length) return [];

    // Step 2: Fetch summaries
    const summaryUrl = `https://eutils.ncbi.nlm.nih.gov/entrez/eutils/esummary.fcgi?db=pubmed&id=${ids.join(',')}&retmode=json`;
    const summaryRes = await fetch(summaryUrl);
    const summaryData: any = await summaryRes.json();
    const result = summaryData?.result || {};

    return ids.map((id) => {
      const item = result[id];
      if (!item) return null;
      const authors = (item.authors || []).slice(0, 3).map((a: any) => a.name).join(', ');
      const pubDate = item.pubdate || item.epubdate || '';
      let publishedAt = new Date(pubDate);
      if (isNaN(publishedAt.getTime())) publishedAt = new Date();

      return {
        externalId: id,
        title: item.title || '(Untitled)',
        summary: authors ? `${authors}${item.source ? ' — ' + item.source : ''}` : item.source || '',
        source: item.source || 'PubMed',
        url: `https://pubmed.ncbi.nlm.nih.gov/${id}/`,
        publishedAt,
        tags: ['moyamoya', 'research'],
      };
    }).filter(Boolean);
  } catch (err) {
    console.error('PubMed fetch error:', err);
    return [];
  }
}

// List cached news
router.get('/', async (req: AuthRequest, res) => {
  try {
    const news = await prisma.news.findMany({
      orderBy: { publishedAt: 'desc' },
      take: 30,
    });
    res.json(news);
  } catch (error) {
    res.status(500).json({ error: 'Failed to load news' });
  }
});

// Trigger refresh from PubMed (any authenticated user can trigger, cached in DB)
router.post('/refresh', async (req: AuthRequest, res) => {
  try {
    const papers = await fetchPubMed('moyamoya', 20);
    let added = 0;
    for (const p of papers) {
      if (!p) continue;
      const existing = await prisma.news.findUnique({ where: { externalId: p.externalId } });
      if (existing) continue;
      await prisma.news.create({ data: p });
      added++;
    }
    const news = await prisma.news.findMany({
      orderBy: { publishedAt: 'desc' },
      take: 30,
    });
    res.json({ added, total: news.length, news });
  } catch (error) {
    console.error('News refresh error:', error);
    res.status(500).json({ error: 'Failed to refresh news' });
  }
});

export default router;
