export class AssetService {
  constructor(private assets: any) {}

  async serveAsset(path: string): Promise<Response> {
    try {
      // Skip API routes
      if (path.startsWith('/api/')) {
        throw new Error('API route requested');
      }
      
      // Ensure path is properly formatted
      const assetPath = path.startsWith('/') ? path : `/${path}`;
      
      const response = await this.assets.fetch(assetPath);
      
      if (response.status === 404) {
        // If file not found, serve index.html for SPA routing
        return this.serveIndexHtml();
      }
      
      // Add cache-busting headers for JavaScript and CSS files
      if (path.endsWith('.js') || path.endsWith('.css')) {
        return this.addCacheHeaders(response);
      }
      
      return response;
    } catch (error) {
      console.error('Error serving asset:', path, error);
      // If any error, try to serve index.html as fallback
      return this.serveIndexHtml();
    }
  }

  private async serveIndexHtml(): Promise<Response> {
    try {
      const response = await this.assets.fetch('/index.html');
      if (response.status === 404) {
        throw new Error('index.html not found in assets');
      }
      return this.addCacheHeaders(response);
    } catch (error) {
      console.error('Error serving index.html:', error);
      throw error;
    }
  }

  private addCacheHeaders(response: Response): Response {
    const newResponse = new Response(response.body, response);
    newResponse.headers.set('Cache-Control', 'no-cache, no-store, must-revalidate');
    newResponse.headers.set('Pragma', 'no-cache');
    newResponse.headers.set('Expires', '0');
    return newResponse;
  }
}
