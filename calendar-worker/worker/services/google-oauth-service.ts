import { GoogleOAuthTokens } from '../types';

export class GoogleOAuthService {
  private db: any;

  constructor(db: any) {
    this.db = db;
  }

  /**
   * Store OAuth tokens for a user in the database (simple key-value storage)
   */
  async storeTokens(userId: string, tokens: GoogleOAuthTokens): Promise<void> {
    // Store tokens in a simple table structure
    const query = `
      INSERT OR REPLACE INTO google_oauth_tokens 
      (user_id, access_token, refresh_token, expiry, scope, token_type, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, datetime('now'), datetime('now'))
    `;

    await this.db.prepare(query).bind(
      userId,
      tokens.access_token,
      tokens.refresh_token || null,
      tokens.expiry || null,
      tokens.scope,
      tokens.token_type
    ).run();
  }

  /**
   * Retrieve OAuth tokens for a user
   */
  async getTokens(userId: string): Promise<GoogleOAuthTokens | null> {
    const query = `
      SELECT access_token, refresh_token, expiry, scope, token_type
      FROM google_oauth_tokens
      WHERE user_id = ?
    `;

    const result = await this.db.prepare(query).bind(userId).first();
    
    if (!result) {
      return null;
    }

    return {
      access_token: result.access_token,
      refresh_token: result.refresh_token,
      expiry: result.expiry,
      scope: result.scope,
      token_type: result.token_type,
    };
  }

  /**
   * Update OAuth tokens for a user (for token refresh)
   */
  async updateTokens(userId: string, tokens: Partial<GoogleOAuthTokens>): Promise<void> {
    const query = `
      UPDATE google_oauth_tokens 
      SET 
        access_token = COALESCE(?, access_token),
        refresh_token = COALESCE(?, refresh_token),
        expiry = COALESCE(?, expiry),
        scope = COALESCE(?, scope),
        token_type = COALESCE(?, token_type),
        updated_at = datetime('now')
      WHERE user_id = ?
    `;

    await this.db.prepare(query).bind(
      tokens.access_token || null,
      tokens.refresh_token || null,
      tokens.expiry || null,
      tokens.scope || null,
      tokens.token_type || null,
      userId
    ).run();
  }

  /**
   * Check if user has valid OAuth tokens
   */
  async hasValidTokens(userId: string): Promise<boolean> {
    const tokens = await this.getTokens(userId);
    if (!tokens) return false;
    
    // Check if token is expired
    if (tokens.expiry) {
      return new Date(tokens.expiry) > new Date();
    }
    
    return true;
  }

  /**
   * Delete OAuth tokens for a user
   */
  async deleteTokens(userId: string): Promise<void> {
    const query = `DELETE FROM google_oauth_tokens WHERE user_id = ?`;
    await this.db.prepare(query).run(userId);
  }
}
