// This runs on Vercel's servers, bypassing browser security blocks
export default async function handler(req, res) {
    // Enable CORS so your GitHub frontend can safely talk to this API
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }

    const { url } = req.query;
    if (!url) {
        return res.status(400).json({ error: 'Missing URL parameter' });
    }

    try {
        // Fetch the raw HTML of the target product page
        const response = await fetch(url, {
            headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)' }
        });
        const html = await response.text();

        // Simple, lightweight regex extraction for Open Graph tags
        const titleMatch = html.match(/<meta[^>]*property=["']og:title["'][^>]*content=["']([^"']+)["']/i) ||
                           html.match(/<meta[^>]*content=["']([^"']+)["'][^>]*property=["']og:title["']/i);
        
        const imageMatch = html.match(/<meta[^>]*property=["']og:image["'][^>]*content=["']([^"']+)["']/i) ||
                           html.match(/<meta[^>]*content=["']([^"']+)["'][^>]*property=["']og:image["']/i);

        // Fallback to standard HTML tags if Open Graph tags aren't present
        const pageTitle = titleMatch ? titleMatch : (html.match(/<title>([^<]+)<\/title>/i)?. || 'Product Link');
        const pageImage = imageMatch ? imageMatch : 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=500';

        // Clean up HTML character entities (like &amp; or &#39;)
        const cleanTitle = pageTitle.replace(/&amp;/g, '&').replace(/&#39;/g, "'").replace(/&quot;/g, '"');

        // Send the real details back to your frontend
        return res.status(200).json({
            title: cleanTitle,
            image: pageImage,
            url: url
        });
    } catch (error) {
        return res.status(500).json({ error: 'Failed to scrape metadata', details: error.message });
    }
}