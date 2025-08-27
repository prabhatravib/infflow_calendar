import { Hono } from 'hono';
import { GoogleCalendarService } from '../services/google-calendar-service';
import { GoogleOAuthService } from '../services/google-oauth-service';
import { createErrorResponse, createSuccessResponse } from '../middleware/error-handler';
import { Env } from '../types';

export const googleOAuthRouter = new Hono<{ Bindings: Env }>();

// GET /oauth/google/start - Start OAuth flow
googleOAuthRouter.get('/oauth/google/start', async (c) => {
  try {
    // Generate a random state parameter for security
    const state = crypto.randomUUID();
    
    // Store the state in a cookie for security
    c.header('Set-Cookie', `oauth_state=${state}; HttpOnly; Secure; SameSite=Strict; Max-Age=300`);
    
    const googleService = new GoogleCalendarService(c.env);
    const authUrl = googleService.generateAuthUrl(state);
    
    // Redirect to Google OAuth
    return c.redirect(authUrl);
  } catch (error) {
    console.error('Error starting OAuth flow:', error);
    return createErrorResponse(c, 'Failed to start OAuth flow', 500);
  }
});

// GET /oauth/google/callback - Handle OAuth callback
googleOAuthRouter.get('/oauth/google/callback', async (c) => {
  try {
    const code = c.req.query('code');
    const state = c.req.query('state');
    const error = c.req.query('error');
    
    // Check for OAuth errors
    if (error) {
      return createErrorResponse(c, `OAuth error: ${error}`, 400);
    }
    
    if (!code || !state) {
      return createErrorResponse(c, 'Missing required OAuth parameters', 400);
    }
    
    // Verify state parameter from cookie
    const cookies = c.req.header('Cookie') || '';
    const stateCookie = cookies.split(';').find(cookie => cookie.trim().startsWith('oauth_state='));
    const storedState = stateCookie ? stateCookie.split('=')[1] : '';
    
    if (state !== storedState) {
      return createErrorResponse(c, 'Invalid state parameter', 400);
    }
    
    // Exchange code for tokens
    const googleService = new GoogleCalendarService(c.env);
    const tokens = await googleService.exchangeCodeForTokens(code);
    
    // Store tokens (we'll use a simple approach - store for 'default' user)
    const oauthService = new GoogleOAuthService(c.env.DB);
    await oauthService.storeTokens('default', tokens);
    
    // Clear the state cookie
    c.header('Set-Cookie', 'oauth_state=; HttpOnly; Secure; SameSite=Strict; Max-Age=0');
    
    // Redirect back to the calendar with success indicator
    return c.redirect('/?google_import=success');
  } catch (error) {
    console.error('Error in OAuth callback:', error);
    return createErrorResponse(c, 'OAuth callback failed', 500);
  }
});

// GET /oauth/google/status - Check OAuth status
googleOAuthRouter.get('/oauth/google/status', async (c) => {
  try {
    const oauthService = new GoogleOAuthService(c.env.DB);
    const tokens = await oauthService.getTokens('default');
    
    if (tokens && !oauthService.isTokenExpired(tokens)) {
      return createSuccessResponse(c, { connected: true, expires_at: tokens.expiry });
    } else {
      return createSuccessResponse(c, { connected: false });
    }
  } catch (error) {
    console.error('Error checking OAuth status:', error);
    return createSuccessResponse(c, { connected: false });
  }
});

// POST /oauth/google/disconnect - Disconnect Google Calendar
googleOAuthRouter.post('/oauth/google/disconnect', async (c) => {
  try {
    const userId = c.env.USER_ID;
    
    const oauthService = new GoogleOAuthService(c.env.DB);
    await oauthService.deleteTokens(userId);
    
    return createSuccessResponse(c, { 
      message: 'Google Calendar disconnected successfully' 
    });
  } catch (error) {
    console.error('Error disconnecting Google Calendar:', error);
    return createErrorResponse(c, 'Failed to disconnect Google Calendar');
  }
});

// POST /oauth/google/refresh - Refresh access token
googleOAuthRouter.post('/oauth/google/refresh', async (c) => {
  try {
    const userId = c.env.USER_ID;
    
    const oauthService = new GoogleOAuthService(c.env.DB);
    const tokens = await oauthService.getTokens(userId);
    
    if (!tokens || !tokens.refresh_token) {
      return createErrorResponse(c, 'No refresh token available', 400);
    }
    
    const googleService = new GoogleCalendarService(c.env);
    const newTokens = await googleService.refreshAccessToken(tokens.refresh_token);
    
    // Update tokens in database
    await oauthService.updateTokens(userId, newTokens);
    
    return createSuccessResponse(c, { 
      message: 'Access token refreshed successfully' 
    });
  } catch (error) {
    console.error('Error refreshing access token:', error);
    return createErrorResponse(c, 'Failed to refresh access token');
  }
});
