import { DefaultTreeAdapterMap, parse } from 'parse5';
import { z } from 'zod';

const TOKEN_URL =
  'https://uoapool.auth.ap-southeast-2.amazoncognito.com/oauth2/token';
const CLIENT_ID = 'tc5hvltsfk72akef7urq0hh72';
const REDIRECT_URI = 'https://www.auckland.ac.nz/en.html';

const authorizationCodeResponse = z.object({
  id_token: z.string(),
  access_token: z.string(),
  refresh_token: z.string(),
});

const refreshTokenResponse = z.object({
  id_token: z.string(),
  access_token: z.string(),
  expires_in: z.number(),
  token_type: z.literal('Bearer'),
});

export interface Tokens {
  idToken: string;
  accessToken: string;
}

/**
 * Extract cookies from response and add to cookieArray.
 * @param response
 * @param cookieArray
 */
const addCookies = (response: Response, cookieArray: string[]) =>
  response.headers.getSetCookie().forEach((c) => {
    // Overwrite existing cookies
    const cookie = c.split(';')[0];
    const name = cookie.split('=')[0];

    const existingIndex = cookieArray.findIndex((c) => c.startsWith(name));
    if (existingIndex !== -1) cookieArray.splice(existingIndex, 1);
    cookieArray.push(cookie);
  });

/**
 * Find the child nodes with the given tag name.
 * @param childNodes parse5 childNodes.
 * @param tagName
 * @returns
 */
const getChildNodesByTagName = (
  childNodes: DefaultTreeAdapterMap['childNode'][],
  tagName: string,
) =>
  childNodes.filter((n) => ('tagName' in n ? n.tagName === tagName : false)) as
    | DefaultTreeAdapterMap['element'][]
    | DefaultTreeAdapterMap['template'][];

/**
 * Find the first child node with the given tag name.
 * @param childNodes parse5 childNodes.
 * @param tagName
 * @returns
 */
const getChildNodeByTagName = (
  childNodes: DefaultTreeAdapterMap['childNode'][] | undefined,
  tagName: string,
) =>
  (childNodes === undefined
    ? undefined
    : getChildNodesByTagName(childNodes, tagName)[0]) as
    | DefaultTreeAdapterMap['element']
    | DefaultTreeAdapterMap['template']
    | undefined;

/**
 * Find the child node with the given attribute name and value.
 * @param childNodes parse5 childNodes.
 * @param attrName Attribute name to search for.
 * @param attrValue Attribute value to search for.
 * @returns
 */
const getChildNodeByAttr = (
  childNodes: DefaultTreeAdapterMap['childNode'][] | undefined,
  attrName: string,
  attrValue: string,
) =>
  (childNodes === undefined
    ? undefined
    : childNodes.find(
        (n) =>
          'attrs' in n &&
          n.attrs.some((a) => a.name === attrName && a.value === attrValue),
      )) as
    | DefaultTreeAdapterMap['element']
    | DefaultTreeAdapterMap['template']
    | undefined;

/**
 * Get the value of an attribute from a parse5 element.
 * @param element
 * @param attrName
 * @returns
 */
const getAttrValue = (
  element:
    | DefaultTreeAdapterMap['element']
    | DefaultTreeAdapterMap['template']
    | undefined,
  attrName: string,
) => element?.attrs.find((a) => a.name === attrName)?.value;

/**
 * Parse SSO S2 form response to get action, relayState and samlResponse.
 * @param html
 * @returns The action, relayState and samlResponse if found, otherwise undefined.
 */
const parseSsoS2FormResponse = (html: string) => {
  const parsed = parse(html);

  // Get form action URL
  const form = getChildNodeByTagName(
    getChildNodeByTagName(
      getChildNodeByTagName(parsed.childNodes, 'html')?.childNodes,
      'body',
    )?.childNodes,
    'form',
  );
  if (form === undefined) return undefined;

  const action = form.attrs.find(({ name }) => name === 'action')?.value;

  // Get form inputs
  const formDiv = getChildNodeByTagName(form.childNodes, 'div');
  if (formDiv === undefined) return undefined;
  const inputs = getChildNodesByTagName(formDiv.childNodes, 'input');
  if (inputs === undefined) return undefined;

  const relayState = getAttrValue(
    getChildNodeByAttr(inputs, 'name', 'RelayState'),
    'value',
  );
  const samlResponse = getAttrValue(
    getChildNodeByAttr(inputs, 'name', 'SAMLResponse'),
    'value',
  );

  // Return undefined if any of the values are undefined
  if (
    action === undefined ||
    relayState === undefined ||
    samlResponse === undefined
  )
    return undefined;

  return {
    action,
    relayState,
    samlResponse,
  };
};

/**
 * Generate a random string of alphanumeric characters.
 * @returns
 */
export const generateRandomString = () => {
  const STRING_POSSIBLE =
    'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  const STRING_LENGTH = 32;

  let text = '';

  for (let i = 0; i < STRING_LENGTH; i++)
    text += STRING_POSSIBLE.charAt(
      Math.floor(Math.random() * STRING_POSSIBLE.length),
    );

  return text;
};

/**
 * Generate a code challenge from a code verifier.
 * @param codeVerifier A random string.
 * @returns A base64 URL encoded string.
 */
const generateCodeChallenge = async (codeVerifier: string) => {
  const digest = await crypto.subtle.digest(
    'SHA-256',
    new TextEncoder().encode(codeVerifier),
  );

  return btoa(String.fromCharCode(...new Uint8Array(digest)))
    .replace(/=/g, '')
    .replace(/\+/g, '-')
    .replace(/\//g, '_');
};

/**
 * Get a PKCE authorization code from the Cognito login flow.
 * @param codeVerifier A random string.
 * @param username
 * @param password
 * @param token A current two factor authentication token.
 * @returns The authorization code if successful, otherwise undefined.
 */
export const getAuthorizationCode = async (
  codeVerifier: string,
  username: string,
  password: string,
  token: string,
) => {
  try {
    const cognitoCookies: string[] = [];
    const ssoCookies: string[] = [];

    // Navigate to authorize
    let codeChallenge = await generateCodeChallenge(codeVerifier);
    const args = new URLSearchParams({
      response_type: 'code',
      client_id: CLIENT_ID,
      redirect_uri: REDIRECT_URI,
      state: 'https://www.auckland.ac.nz/en.html',
      scope: 'openid profile',
      code_challenge_method: 'S256',
      code_challenge: codeChallenge,
    });

    const authorizeUrl = `https://uoapool.auth.ap-southeast-2.amazoncognito.com/oauth2/authorize/?${args.toString()}`;
    const authorize = await fetch(authorizeUrl, {
      redirect: 'manual',
      method: 'GET',
      mode: 'cors',
      credentials: 'omit',
    });
    addCookies(authorize, cognitoCookies);

    // Navigate to SSO
    const ssoUrl = authorize.headers.get('location');
    if (!ssoUrl) throw new Error('No location header in authorize response');

    const sso = await fetch(ssoUrl, {
      redirect: 'manual',
      method: 'GET',
      mode: 'cors',
      credentials: 'omit',
    });
    addCookies(sso, ssoCookies);

    // Navigate to SSO S1
    const ssoS1Url = sso.headers.get('location');
    if (!ssoS1Url) throw new Error('No location header in SSO S1 response');

    const ssoS1 = await fetch(ssoS1Url, {
      headers: {
        cookie: ssoCookies.join('; '),
      },
      credentials: 'include',
    });
    addCookies(ssoS1, ssoCookies);

    // Post form data to ssoS1
    const ssoS1Form = await fetch(ssoS1Url, {
      redirect: 'manual',
      headers: {
        cookie: ssoCookies.join('; '),
      },
      body: new URLSearchParams({
        submitted: '',
        j_username: username,
        j_password: password,
        _eventId_proceed: '',
      }),
      method: 'POST',
      credentials: 'include',
    });
    addCookies(ssoS1Form, ssoCookies);

    // Navigate to SSO S2
    const ssoS2Url = ssoS1Form.headers.get('location');
    if (!ssoS2Url) throw new Error('No location header in SSO S2 response');

    const ssoS2 = await fetch(ssoS2Url, {
      headers: {
        cookie: ssoCookies.join('; '),
      },
      method: 'GET',
      credentials: 'include',
    });
    addCookies(ssoS2, ssoCookies);

    // Post form data to ssoS2
    const ssoS2Form = await fetch(ssoS2Url, {
      headers: {
        cookie: ssoCookies.join('; '),
      },
      body: new URLSearchParams({
        submitted: '',
        j_token: token,
        rememberMe: 'on',
        _eventId_proceed: '',
      }),
      method: 'POST',
      credentials: 'include',
    });
    addCookies(ssoS2Form, ssoCookies);

    // Get SAMLResponse
    if (!ssoCookies.some((c) => c.startsWith('shib_idp_session=')))
      throw new Error('Could not login');

    const idpInfo = parseSsoS2FormResponse(await ssoS2Form.text());
    if (idpInfo === undefined) throw new Error('Could not parse SSO S2 form');

    // Post form data to idpResponse
    const idpResponseFormData = new URLSearchParams({
      RelayState: idpInfo.relayState,
      SAMLResponse: idpInfo.samlResponse,
    });
    const idpResponseForm = await fetch(idpInfo.action, {
      redirect: 'manual',
      headers: {
        cookie: cognitoCookies.join('; '),
      },
      body: idpResponseFormData,
      method: 'POST',
      credentials: 'include',
    });

    // Get code
    const redirectUrl = idpResponseForm.headers.get('location');
    if (!redirectUrl) throw new Error('No location header in IDP response');
    const code = new URL(redirectUrl).searchParams.get('code');
    if (code === null) throw new Error('No code in redirect URL');

    return code;
  } catch (e) {
    return undefined;
  }
};

/**
 * Get a refresh token from a PKCE authorization code.
 * @param codeVerifier A random string.
 * @param authorizationCode A code from the Cognito login flow.
 * @returns The refresh token if successful, otherwise undefined.
 */
export const getRefreshTokenFromCode = async (
  codeVerifier: string,
  authorizationCode: string,
) => {
  try {
    const response = await fetch(TOKEN_URL, {
      method: 'POST',
      body: new URLSearchParams({
        client_id: CLIENT_ID,
        code: authorizationCode,
        redirect_uri: REDIRECT_URI,
        grant_type: 'authorization_code',
        code_verifier: codeVerifier,
      }),
    });

    if (response.status !== 200) return undefined;

    const parsed = authorizationCodeResponse.parse(await response.json());
    return parsed.refresh_token;
  } catch (e) {
    console.error(e);
  }
};

/**
 * Get tokens from a refresh token.
 * @param refreshToken A refresh token from the Cognito login flow.
 * @returns ID, access, and refresh tokens if successful, otherwise undefined.
 */
export const getTokensFromRefreshToken = async (
  refreshToken: string,
): Promise<Tokens | undefined> => {
  try {
    const response = await fetch(TOKEN_URL, {
      method: 'POST',
      body: new URLSearchParams({
        client_id: CLIENT_ID,
        grant_type: 'refresh_token',
        refresh_token: refreshToken,
      }),
    });

    if (response.status !== 200) return undefined;

    const parsed = refreshTokenResponse.parse(await response.json());
    return {
      idToken: parsed.id_token,
      accessToken: parsed.access_token,
    };
  } catch (e) {
    console.error(e);
  }
};
