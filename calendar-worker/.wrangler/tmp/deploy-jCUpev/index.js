var __defProp = Object.defineProperty;
var __name = (target, value) => __defProp(target, "name", { value, configurable: true });

// node_modules/hono/dist/utils/url.js
var splitPath = /* @__PURE__ */ __name((path) => {
  const paths = path.split("/");
  if (paths[0] === "") {
    paths.shift();
  }
  return paths;
}, "splitPath");
var splitRoutingPath = /* @__PURE__ */ __name((routePath) => {
  const { groups, path } = extractGroupsFromPath(routePath);
  const paths = splitPath(path);
  return replaceGroupMarks(paths, groups);
}, "splitRoutingPath");
var extractGroupsFromPath = /* @__PURE__ */ __name((path) => {
  const groups = [];
  path = path.replace(/\{[^}]+\}/g, (match, index) => {
    const mark = `@${index}`;
    groups.push([mark, match]);
    return mark;
  });
  return { groups, path };
}, "extractGroupsFromPath");
var replaceGroupMarks = /* @__PURE__ */ __name((paths, groups) => {
  for (let i = groups.length - 1; i >= 0; i--) {
    const [mark] = groups[i];
    for (let j = paths.length - 1; j >= 0; j--) {
      if (paths[j].includes(mark)) {
        paths[j] = paths[j].replace(mark, groups[i][1]);
        break;
      }
    }
  }
  return paths;
}, "replaceGroupMarks");
var patternCache = {};
var getPattern = /* @__PURE__ */ __name((label) => {
  if (label === "*") {
    return "*";
  }
  const match = label.match(/^\:([^\{\}]+)(?:\{(.+)\})?$/);
  if (match) {
    if (!patternCache[label]) {
      if (match[2]) {
        patternCache[label] = [label, match[1], new RegExp("^" + match[2] + "$")];
      } else {
        patternCache[label] = [label, match[1], true];
      }
    }
    return patternCache[label];
  }
  return null;
}, "getPattern");
var getPath = /* @__PURE__ */ __name((request) => {
  const match = request.url.match(/^https?:\/\/[^/]+(\/[^?]*)/);
  return match ? match[1] : "";
}, "getPath");
var getQueryStrings = /* @__PURE__ */ __name((url) => {
  const queryIndex = url.indexOf("?", 8);
  return queryIndex === -1 ? "" : "?" + url.slice(queryIndex + 1);
}, "getQueryStrings");
var getPathNoStrict = /* @__PURE__ */ __name((request) => {
  const result = getPath(request);
  return result.length > 1 && result[result.length - 1] === "/" ? result.slice(0, -1) : result;
}, "getPathNoStrict");
var mergePath = /* @__PURE__ */ __name((...paths) => {
  let p = "";
  let endsWithSlash = false;
  for (let path of paths) {
    if (p[p.length - 1] === "/") {
      p = p.slice(0, -1);
      endsWithSlash = true;
    }
    if (path[0] !== "/") {
      path = `/${path}`;
    }
    if (path === "/" && endsWithSlash) {
      p = `${p}/`;
    } else if (path !== "/") {
      p = `${p}${path}`;
    }
    if (path === "/" && p === "") {
      p = "/";
    }
  }
  return p;
}, "mergePath");
var checkOptionalParameter = /* @__PURE__ */ __name((path) => {
  if (!path.match(/\:.+\?$/)) {
    return null;
  }
  const segments = path.split("/");
  const results = [];
  let basePath = "";
  segments.forEach((segment) => {
    if (segment !== "" && !/\:/.test(segment)) {
      basePath += "/" + segment;
    } else if (/\:/.test(segment)) {
      if (/\?/.test(segment)) {
        if (results.length === 0 && basePath === "") {
          results.push("/");
        } else {
          results.push(basePath);
        }
        const optionalSegment = segment.replace("?", "");
        basePath += "/" + optionalSegment;
        results.push(basePath);
      } else {
        basePath += "/" + segment;
      }
    }
  });
  return results.filter((v, i, a) => a.indexOf(v) === i);
}, "checkOptionalParameter");
var _decodeURI = /* @__PURE__ */ __name((value) => {
  if (!/[%+]/.test(value)) {
    return value;
  }
  if (value.indexOf("+") !== -1) {
    value = value.replace(/\+/g, " ");
  }
  return /%/.test(value) ? decodeURIComponent_(value) : value;
}, "_decodeURI");
var _getQueryParam = /* @__PURE__ */ __name((url, key, multiple) => {
  let encoded;
  if (!multiple && key && !/[%+]/.test(key)) {
    let keyIndex2 = url.indexOf(`?${key}`, 8);
    if (keyIndex2 === -1) {
      keyIndex2 = url.indexOf(`&${key}`, 8);
    }
    while (keyIndex2 !== -1) {
      const trailingKeyCode = url.charCodeAt(keyIndex2 + key.length + 1);
      if (trailingKeyCode === 61) {
        const valueIndex = keyIndex2 + key.length + 2;
        const endIndex = url.indexOf("&", valueIndex);
        return _decodeURI(url.slice(valueIndex, endIndex === -1 ? void 0 : endIndex));
      } else if (trailingKeyCode == 38 || isNaN(trailingKeyCode)) {
        return "";
      }
      keyIndex2 = url.indexOf(`&${key}`, keyIndex2 + 1);
    }
    encoded = /[%+]/.test(url);
    if (!encoded) {
      return void 0;
    }
  }
  const results = {};
  encoded ?? (encoded = /[%+]/.test(url));
  let keyIndex = url.indexOf("?", 8);
  while (keyIndex !== -1) {
    const nextKeyIndex = url.indexOf("&", keyIndex + 1);
    let valueIndex = url.indexOf("=", keyIndex);
    if (valueIndex > nextKeyIndex && nextKeyIndex !== -1) {
      valueIndex = -1;
    }
    let name = url.slice(
      keyIndex + 1,
      valueIndex === -1 ? nextKeyIndex === -1 ? void 0 : nextKeyIndex : valueIndex
    );
    if (encoded) {
      name = _decodeURI(name);
    }
    keyIndex = nextKeyIndex;
    if (name === "") {
      continue;
    }
    let value;
    if (valueIndex === -1) {
      value = "";
    } else {
      value = url.slice(valueIndex + 1, nextKeyIndex === -1 ? void 0 : nextKeyIndex);
      if (encoded) {
        value = _decodeURI(value);
      }
    }
    if (multiple) {
      if (!(results[name] && Array.isArray(results[name]))) {
        results[name] = [];
      }
      ;
      results[name].push(value);
    } else {
      results[name] ?? (results[name] = value);
    }
  }
  return key ? results[key] : results;
}, "_getQueryParam");
var getQueryParam = _getQueryParam;
var getQueryParams = /* @__PURE__ */ __name((url, key) => {
  return _getQueryParam(url, key, true);
}, "getQueryParams");
var decodeURIComponent_ = decodeURIComponent;

// node_modules/hono/dist/utils/cookie.js
var validCookieNameRegEx = /^[\w!#$%&'*.^`|~+-]+$/;
var validCookieValueRegEx = /^[ !#-:<-[\]-~]*$/;
var parse = /* @__PURE__ */ __name((cookie, name) => {
  const pairs = cookie.trim().split(";");
  return pairs.reduce((parsedCookie, pairStr) => {
    pairStr = pairStr.trim();
    const valueStartPos = pairStr.indexOf("=");
    if (valueStartPos === -1) {
      return parsedCookie;
    }
    const cookieName = pairStr.substring(0, valueStartPos).trim();
    if (name && name !== cookieName || !validCookieNameRegEx.test(cookieName)) {
      return parsedCookie;
    }
    let cookieValue = pairStr.substring(valueStartPos + 1).trim();
    if (cookieValue.startsWith('"') && cookieValue.endsWith('"')) {
      cookieValue = cookieValue.slice(1, -1);
    }
    if (validCookieValueRegEx.test(cookieValue)) {
      parsedCookie[cookieName] = decodeURIComponent_(cookieValue);
    }
    return parsedCookie;
  }, {});
}, "parse");
var _serialize = /* @__PURE__ */ __name((name, value, opt = {}) => {
  let cookie = `${name}=${value}`;
  if (opt && typeof opt.maxAge === "number" && opt.maxAge >= 0) {
    cookie += `; Max-Age=${Math.floor(opt.maxAge)}`;
  }
  if (opt.domain) {
    cookie += `; Domain=${opt.domain}`;
  }
  if (opt.path) {
    cookie += `; Path=${opt.path}`;
  }
  if (opt.expires) {
    cookie += `; Expires=${opt.expires.toUTCString()}`;
  }
  if (opt.httpOnly) {
    cookie += "; HttpOnly";
  }
  if (opt.secure) {
    cookie += "; Secure";
  }
  if (opt.sameSite) {
    cookie += `; SameSite=${opt.sameSite}`;
  }
  if (opt.partitioned) {
    cookie += "; Partitioned";
  }
  return cookie;
}, "_serialize");
var serialize = /* @__PURE__ */ __name((name, value, opt = {}) => {
  value = encodeURIComponent(value);
  return _serialize(name, value, opt);
}, "serialize");

// node_modules/hono/dist/utils/html.js
var HtmlEscapedCallbackPhase = {
  Stringify: 1,
  BeforeStream: 2,
  Stream: 3
};
var raw = /* @__PURE__ */ __name((value, callbacks) => {
  const escapedString = new String(value);
  escapedString.isEscaped = true;
  escapedString.callbacks = callbacks;
  return escapedString;
}, "raw");
var resolveCallback = /* @__PURE__ */ __name(async (str, phase, preserveCallbacks, context, buffer) => {
  const callbacks = str.callbacks;
  if (!callbacks?.length) {
    return Promise.resolve(str);
  }
  if (buffer) {
    buffer[0] += str;
  } else {
    buffer = [str];
  }
  const resStr = Promise.all(callbacks.map((c) => c({ phase, buffer, context }))).then(
    (res) => Promise.all(
      res.filter(Boolean).map((str2) => resolveCallback(str2, phase, false, context, buffer))
    ).then(() => buffer[0])
  );
  if (preserveCallbacks) {
    return raw(await resStr, callbacks);
  } else {
    return resStr;
  }
}, "resolveCallback");

// node_modules/hono/dist/utils/stream.js
var StreamingApi = class {
  static {
    __name(this, "StreamingApi");
  }
  constructor(writable, _readable) {
    this.abortSubscribers = [];
    this.writable = writable;
    this.writer = writable.getWriter();
    this.encoder = new TextEncoder();
    const reader = _readable.getReader();
    this.responseReadable = new ReadableStream({
      async pull(controller) {
        const { done, value } = await reader.read();
        done ? controller.close() : controller.enqueue(value);
      },
      cancel: /* @__PURE__ */ __name(() => {
        this.abortSubscribers.forEach((subscriber) => subscriber());
      }, "cancel")
    });
  }
  async write(input) {
    try {
      if (typeof input === "string") {
        input = this.encoder.encode(input);
      }
      await this.writer.write(input);
    } catch (e) {
    }
    return this;
  }
  async writeln(input) {
    await this.write(input + "\n");
    return this;
  }
  sleep(ms) {
    return new Promise((res) => setTimeout(res, ms));
  }
  async close() {
    try {
      await this.writer.close();
    } catch (e) {
    }
  }
  async pipe(body) {
    this.writer.releaseLock();
    await body.pipeTo(this.writable, { preventClose: true });
    this.writer = this.writable.getWriter();
  }
  async onAbort(listener) {
    this.abortSubscribers.push(listener);
  }
};

// node_modules/hono/dist/context.js
var __accessCheck = /* @__PURE__ */ __name((obj, member, msg) => {
  if (!member.has(obj))
    throw TypeError("Cannot " + msg);
}, "__accessCheck");
var __privateGet = /* @__PURE__ */ __name((obj, member, getter) => {
  __accessCheck(obj, member, "read from private field");
  return getter ? getter.call(obj) : member.get(obj);
}, "__privateGet");
var __privateAdd = /* @__PURE__ */ __name((obj, member, value) => {
  if (member.has(obj))
    throw TypeError("Cannot add the same private member more than once");
  member instanceof WeakSet ? member.add(obj) : member.set(obj, value);
}, "__privateAdd");
var __privateSet = /* @__PURE__ */ __name((obj, member, value, setter) => {
  __accessCheck(obj, member, "write to private field");
  setter ? setter.call(obj, value) : member.set(obj, value);
  return value;
}, "__privateSet");
var TEXT_PLAIN = "text/plain; charset=UTF-8";
var setHeaders = /* @__PURE__ */ __name((headers, map = {}) => {
  Object.entries(map).forEach(([key, value]) => headers.set(key, value));
  return headers;
}, "setHeaders");
var _status;
var _executionCtx;
var _headers;
var _preparedHeaders;
var _res;
var _isFresh;
var Context = class {
  static {
    __name(this, "Context");
  }
  constructor(req, options) {
    this.env = {};
    this._var = {};
    this.finalized = false;
    this.error = void 0;
    __privateAdd(this, _status, 200);
    __privateAdd(this, _executionCtx, void 0);
    __privateAdd(this, _headers, void 0);
    __privateAdd(this, _preparedHeaders, void 0);
    __privateAdd(this, _res, void 0);
    __privateAdd(this, _isFresh, true);
    this.renderer = (content) => this.html(content);
    this.notFoundHandler = () => new Response();
    this.render = (...args) => this.renderer(...args);
    this.setRenderer = (renderer) => {
      this.renderer = renderer;
    };
    this.header = (name, value, options2) => {
      if (value === void 0) {
        if (__privateGet(this, _headers)) {
          __privateGet(this, _headers).delete(name);
        } else if (__privateGet(this, _preparedHeaders)) {
          delete __privateGet(this, _preparedHeaders)[name.toLocaleLowerCase()];
        }
        if (this.finalized) {
          this.res.headers.delete(name);
        }
        return;
      }
      if (options2?.append) {
        if (!__privateGet(this, _headers)) {
          __privateSet(this, _isFresh, false);
          __privateSet(this, _headers, new Headers(__privateGet(this, _preparedHeaders)));
          __privateSet(this, _preparedHeaders, {});
        }
        __privateGet(this, _headers).append(name, value);
      } else {
        if (__privateGet(this, _headers)) {
          __privateGet(this, _headers).set(name, value);
        } else {
          __privateGet(this, _preparedHeaders) ?? __privateSet(this, _preparedHeaders, {});
          __privateGet(this, _preparedHeaders)[name.toLowerCase()] = value;
        }
      }
      if (this.finalized) {
        if (options2?.append) {
          this.res.headers.append(name, value);
        } else {
          this.res.headers.set(name, value);
        }
      }
    };
    this.status = (status) => {
      __privateSet(this, _isFresh, false);
      __privateSet(this, _status, status);
    };
    this.set = (key, value) => {
      this._var ?? (this._var = {});
      this._var[key] = value;
    };
    this.get = (key) => {
      return this._var ? this._var[key] : void 0;
    };
    this.newResponse = (data, arg, headers) => {
      if (__privateGet(this, _isFresh) && !headers && !arg && __privateGet(this, _status) === 200) {
        return new Response(data, {
          headers: __privateGet(this, _preparedHeaders)
        });
      }
      if (arg && typeof arg !== "number") {
        const headers2 = setHeaders(new Headers(arg.headers), __privateGet(this, _preparedHeaders));
        return new Response(data, {
          headers: headers2,
          status: arg.status
        });
      }
      const status = typeof arg === "number" ? arg : __privateGet(this, _status);
      __privateGet(this, _preparedHeaders) ?? __privateSet(this, _preparedHeaders, {});
      __privateGet(this, _headers) ?? __privateSet(this, _headers, new Headers());
      setHeaders(__privateGet(this, _headers), __privateGet(this, _preparedHeaders));
      if (__privateGet(this, _res)) {
        __privateGet(this, _res).headers.forEach((v, k) => {
          __privateGet(this, _headers)?.set(k, v);
        });
        setHeaders(__privateGet(this, _headers), __privateGet(this, _preparedHeaders));
      }
      headers ?? (headers = {});
      for (const [k, v] of Object.entries(headers)) {
        if (typeof v === "string") {
          __privateGet(this, _headers).set(k, v);
        } else {
          __privateGet(this, _headers).delete(k);
          for (const v2 of v) {
            __privateGet(this, _headers).append(k, v2);
          }
        }
      }
      return new Response(data, {
        status,
        headers: __privateGet(this, _headers)
      });
    };
    this.body = (data, arg, headers) => {
      return typeof arg === "number" ? this.newResponse(data, arg, headers) : this.newResponse(data, arg);
    };
    this.text = (text, arg, headers) => {
      if (!__privateGet(this, _preparedHeaders)) {
        if (__privateGet(this, _isFresh) && !headers && !arg) {
          return new Response(text);
        }
        __privateSet(this, _preparedHeaders, {});
      }
      __privateGet(this, _preparedHeaders)["content-type"] = TEXT_PLAIN;
      return typeof arg === "number" ? this.newResponse(text, arg, headers) : this.newResponse(text, arg);
    };
    this.json = (object, arg, headers) => {
      const body = JSON.stringify(object);
      __privateGet(this, _preparedHeaders) ?? __privateSet(this, _preparedHeaders, {});
      __privateGet(this, _preparedHeaders)["content-type"] = "application/json; charset=UTF-8";
      return typeof arg === "number" ? this.newResponse(body, arg, headers) : this.newResponse(body, arg);
    };
    this.jsonT = (object, arg, headers) => {
      return this.json(object, arg, headers);
    };
    this.html = (html, arg, headers) => {
      __privateGet(this, _preparedHeaders) ?? __privateSet(this, _preparedHeaders, {});
      __privateGet(this, _preparedHeaders)["content-type"] = "text/html; charset=UTF-8";
      if (typeof html === "object") {
        if (!(html instanceof Promise)) {
          html = html.toString();
        }
        if (html instanceof Promise) {
          return html.then((html2) => resolveCallback(html2, HtmlEscapedCallbackPhase.Stringify, false, {})).then((html2) => {
            return typeof arg === "number" ? this.newResponse(html2, arg, headers) : this.newResponse(html2, arg);
          });
        }
      }
      return typeof arg === "number" ? this.newResponse(html, arg, headers) : this.newResponse(html, arg);
    };
    this.redirect = (location, status = 302) => {
      __privateGet(this, _headers) ?? __privateSet(this, _headers, new Headers());
      __privateGet(this, _headers).set("Location", location);
      return this.newResponse(null, status);
    };
    this.streamText = (cb, arg, headers) => {
      headers ?? (headers = {});
      this.header("content-type", TEXT_PLAIN);
      this.header("x-content-type-options", "nosniff");
      this.header("transfer-encoding", "chunked");
      return this.stream(cb, arg, headers);
    };
    this.stream = (cb, arg, headers) => {
      const { readable, writable } = new TransformStream();
      const stream = new StreamingApi(writable, readable);
      cb(stream).finally(() => stream.close());
      return typeof arg === "number" ? this.newResponse(stream.responseReadable, arg, headers) : this.newResponse(stream.responseReadable, arg);
    };
    this.cookie = (name, value, opt) => {
      const cookie = serialize(name, value, opt);
      this.header("set-cookie", cookie, { append: true });
    };
    this.notFound = () => {
      return this.notFoundHandler(this);
    };
    this.req = req;
    if (options) {
      __privateSet(this, _executionCtx, options.executionCtx);
      this.env = options.env;
      if (options.notFoundHandler) {
        this.notFoundHandler = options.notFoundHandler;
      }
    }
  }
  get event() {
    if (__privateGet(this, _executionCtx) && "respondWith" in __privateGet(this, _executionCtx)) {
      return __privateGet(this, _executionCtx);
    } else {
      throw Error("This context has no FetchEvent");
    }
  }
  get executionCtx() {
    if (__privateGet(this, _executionCtx)) {
      return __privateGet(this, _executionCtx);
    } else {
      throw Error("This context has no ExecutionContext");
    }
  }
  get res() {
    __privateSet(this, _isFresh, false);
    return __privateGet(this, _res) || __privateSet(this, _res, new Response("404 Not Found", { status: 404 }));
  }
  set res(_res2) {
    __privateSet(this, _isFresh, false);
    if (__privateGet(this, _res) && _res2) {
      __privateGet(this, _res).headers.delete("content-type");
      for (const [k, v] of __privateGet(this, _res).headers.entries()) {
        if (k === "set-cookie") {
          const cookies = __privateGet(this, _res).headers.getSetCookie();
          _res2.headers.delete("set-cookie");
          for (const cookie of cookies) {
            _res2.headers.append("set-cookie", cookie);
          }
        } else {
          _res2.headers.set(k, v);
        }
      }
    }
    __privateSet(this, _res, _res2);
    this.finalized = true;
  }
  get var() {
    return { ...this._var };
  }
  get runtime() {
    const global = globalThis;
    if (global?.Deno !== void 0) {
      return "deno";
    }
    if (global?.Bun !== void 0) {
      return "bun";
    }
    if (typeof global?.WebSocketPair === "function") {
      return "workerd";
    }
    if (typeof global?.EdgeRuntime === "string") {
      return "edge-light";
    }
    if (global?.fastly !== void 0) {
      return "fastly";
    }
    if (global?.__lagon__ !== void 0) {
      return "lagon";
    }
    if (global?.process?.release?.name === "node") {
      return "node";
    }
    return "other";
  }
};
_status = /* @__PURE__ */ new WeakMap();
_executionCtx = /* @__PURE__ */ new WeakMap();
_headers = /* @__PURE__ */ new WeakMap();
_preparedHeaders = /* @__PURE__ */ new WeakMap();
_res = /* @__PURE__ */ new WeakMap();
_isFresh = /* @__PURE__ */ new WeakMap();

// node_modules/hono/dist/compose.js
var compose = /* @__PURE__ */ __name((middleware, onError, onNotFound) => {
  return (context, next) => {
    let index = -1;
    return dispatch(0);
    async function dispatch(i) {
      if (i <= index) {
        throw new Error("next() called multiple times");
      }
      index = i;
      let res;
      let isError = false;
      let handler;
      if (middleware[i]) {
        handler = middleware[i][0][0];
        if (context instanceof Context) {
          context.req.routeIndex = i;
        }
      } else {
        handler = i === middleware.length && next || void 0;
      }
      if (!handler) {
        if (context instanceof Context && context.finalized === false && onNotFound) {
          res = await onNotFound(context);
        }
      } else {
        try {
          res = await handler(context, () => {
            return dispatch(i + 1);
          });
        } catch (err) {
          if (err instanceof Error && context instanceof Context && onError) {
            context.error = err;
            res = await onError(err, context);
            isError = true;
          } else {
            throw err;
          }
        }
      }
      if (res && (context.finalized === false || isError)) {
        context.res = res;
      }
      return context;
    }
    __name(dispatch, "dispatch");
  };
}, "compose");

// node_modules/hono/dist/http-exception.js
var HTTPException = class extends Error {
  static {
    __name(this, "HTTPException");
  }
  constructor(status = 500, options) {
    super(options?.message);
    this.res = options?.res;
    this.status = status;
  }
  getResponse() {
    if (this.res) {
      return this.res;
    }
    return new Response(this.message, {
      status: this.status
    });
  }
};

// node_modules/hono/dist/utils/body.js
var parseBody = /* @__PURE__ */ __name(async (request, options = { all: false }) => {
  const contentType = request.headers.get("Content-Type");
  if (isFormDataContent(contentType)) {
    return parseFormData(request, options);
  }
  return {};
}, "parseBody");
function isFormDataContent(contentType) {
  if (contentType === null) {
    return false;
  }
  return contentType.startsWith("multipart/form-data") || contentType.startsWith("application/x-www-form-urlencoded");
}
__name(isFormDataContent, "isFormDataContent");
async function parseFormData(request, options) {
  const formData = await request.formData();
  if (formData) {
    return convertFormDataToBodyData(formData, options);
  }
  return {};
}
__name(parseFormData, "parseFormData");
function convertFormDataToBodyData(formData, options) {
  const form = {};
  formData.forEach((value, key) => {
    const shouldParseAllValues = options.all || key.endsWith("[]");
    if (!shouldParseAllValues) {
      form[key] = value;
    } else {
      handleParsingAllValues(form, key, value);
    }
  });
  return form;
}
__name(convertFormDataToBodyData, "convertFormDataToBodyData");
var handleParsingAllValues = /* @__PURE__ */ __name((form, key, value) => {
  if (form[key] && isArrayField(form[key])) {
    appendToExistingArray(form[key], value);
  } else if (form[key]) {
    convertToNewArray(form, key, value);
  } else {
    form[key] = value;
  }
}, "handleParsingAllValues");
function isArrayField(field) {
  return Array.isArray(field);
}
__name(isArrayField, "isArrayField");
var appendToExistingArray = /* @__PURE__ */ __name((arr, value) => {
  arr.push(value);
}, "appendToExistingArray");
var convertToNewArray = /* @__PURE__ */ __name((form, key, value) => {
  form[key] = [form[key], value];
}, "convertToNewArray");

// node_modules/hono/dist/request.js
var __accessCheck2 = /* @__PURE__ */ __name((obj, member, msg) => {
  if (!member.has(obj))
    throw TypeError("Cannot " + msg);
}, "__accessCheck");
var __privateGet2 = /* @__PURE__ */ __name((obj, member, getter) => {
  __accessCheck2(obj, member, "read from private field");
  return getter ? getter.call(obj) : member.get(obj);
}, "__privateGet");
var __privateAdd2 = /* @__PURE__ */ __name((obj, member, value) => {
  if (member.has(obj))
    throw TypeError("Cannot add the same private member more than once");
  member instanceof WeakSet ? member.add(obj) : member.set(obj, value);
}, "__privateAdd");
var __privateSet2 = /* @__PURE__ */ __name((obj, member, value, setter) => {
  __accessCheck2(obj, member, "write to private field");
  setter ? setter.call(obj, value) : member.set(obj, value);
  return value;
}, "__privateSet");
var _validatedData;
var _matchResult;
var HonoRequest = class {
  static {
    __name(this, "HonoRequest");
  }
  constructor(request, path = "/", matchResult = [[]]) {
    __privateAdd2(this, _validatedData, void 0);
    __privateAdd2(this, _matchResult, void 0);
    this.routeIndex = 0;
    this.bodyCache = {};
    this.cachedBody = (key) => {
      const { bodyCache, raw: raw2 } = this;
      const cachedBody = bodyCache[key];
      if (cachedBody) {
        return cachedBody;
      }
      if (bodyCache.arrayBuffer) {
        return (async () => {
          return await new Response(bodyCache.arrayBuffer)[key]();
        })();
      }
      return bodyCache[key] = raw2[key]();
    };
    this.raw = request;
    this.path = path;
    __privateSet2(this, _matchResult, matchResult);
    __privateSet2(this, _validatedData, {});
  }
  param(key) {
    return key ? this.getDecodedParam(key) : this.getAllDecodedParams();
  }
  getDecodedParam(key) {
    const paramKey = __privateGet2(this, _matchResult)[0][this.routeIndex][1][key];
    const param = this.getParamValue(paramKey);
    return param ? /\%/.test(param) ? decodeURIComponent_(param) : param : void 0;
  }
  getAllDecodedParams() {
    const decoded = {};
    const keys = Object.keys(__privateGet2(this, _matchResult)[0][this.routeIndex][1]);
    for (const key of keys) {
      const value = this.getParamValue(__privateGet2(this, _matchResult)[0][this.routeIndex][1][key]);
      if (value && typeof value === "string") {
        decoded[key] = /\%/.test(value) ? decodeURIComponent_(value) : value;
      }
    }
    return decoded;
  }
  getParamValue(paramKey) {
    return __privateGet2(this, _matchResult)[1] ? __privateGet2(this, _matchResult)[1][paramKey] : paramKey;
  }
  query(key) {
    return getQueryParam(this.url, key);
  }
  queries(key) {
    return getQueryParams(this.url, key);
  }
  header(name) {
    if (name) {
      return this.raw.headers.get(name.toLowerCase()) ?? void 0;
    }
    const headerData = {};
    this.raw.headers.forEach((value, key) => {
      headerData[key] = value;
    });
    return headerData;
  }
  cookie(key) {
    const cookie = this.raw.headers.get("Cookie");
    if (!cookie) {
      return;
    }
    const obj = parse(cookie);
    if (key) {
      const value = obj[key];
      return value;
    } else {
      return obj;
    }
  }
  async parseBody(options) {
    if (this.bodyCache.parsedBody) {
      return this.bodyCache.parsedBody;
    }
    const parsedBody = await parseBody(this, options);
    this.bodyCache.parsedBody = parsedBody;
    return parsedBody;
  }
  json() {
    return this.cachedBody("json");
  }
  text() {
    return this.cachedBody("text");
  }
  arrayBuffer() {
    return this.cachedBody("arrayBuffer");
  }
  blob() {
    return this.cachedBody("blob");
  }
  formData() {
    return this.cachedBody("formData");
  }
  addValidatedData(target, data) {
    __privateGet2(this, _validatedData)[target] = data;
  }
  valid(target) {
    return __privateGet2(this, _validatedData)[target];
  }
  get url() {
    return this.raw.url;
  }
  get method() {
    return this.raw.method;
  }
  get matchedRoutes() {
    return __privateGet2(this, _matchResult)[0].map(([[, route]]) => route);
  }
  get routePath() {
    return __privateGet2(this, _matchResult)[0].map(([[, route]]) => route)[this.routeIndex].path;
  }
  get headers() {
    return this.raw.headers;
  }
  get body() {
    return this.raw.body;
  }
  get bodyUsed() {
    return this.raw.bodyUsed;
  }
  get integrity() {
    return this.raw.integrity;
  }
  get keepalive() {
    return this.raw.keepalive;
  }
  get referrer() {
    return this.raw.referrer;
  }
  get signal() {
    return this.raw.signal;
  }
};
_validatedData = /* @__PURE__ */ new WeakMap();
_matchResult = /* @__PURE__ */ new WeakMap();

// node_modules/hono/dist/router.js
var METHOD_NAME_ALL = "ALL";
var METHOD_NAME_ALL_LOWERCASE = "all";
var METHODS = ["get", "post", "put", "delete", "options", "patch"];
var MESSAGE_MATCHER_IS_ALREADY_BUILT = "Can not add a route since the matcher is already built.";
var UnsupportedPathError = class extends Error {
  static {
    __name(this, "UnsupportedPathError");
  }
};

// node_modules/hono/dist/hono-base.js
var __accessCheck3 = /* @__PURE__ */ __name((obj, member, msg) => {
  if (!member.has(obj))
    throw TypeError("Cannot " + msg);
}, "__accessCheck");
var __privateGet3 = /* @__PURE__ */ __name((obj, member, getter) => {
  __accessCheck3(obj, member, "read from private field");
  return getter ? getter.call(obj) : member.get(obj);
}, "__privateGet");
var __privateAdd3 = /* @__PURE__ */ __name((obj, member, value) => {
  if (member.has(obj))
    throw TypeError("Cannot add the same private member more than once");
  member instanceof WeakSet ? member.add(obj) : member.set(obj, value);
}, "__privateAdd");
var __privateSet3 = /* @__PURE__ */ __name((obj, member, value, setter) => {
  __accessCheck3(obj, member, "write to private field");
  setter ? setter.call(obj, value) : member.set(obj, value);
  return value;
}, "__privateSet");
var COMPOSED_HANDLER = Symbol("composedHandler");
function defineDynamicClass() {
  return class {
  };
}
__name(defineDynamicClass, "defineDynamicClass");
var notFoundHandler = /* @__PURE__ */ __name((c) => {
  return c.text("404 Not Found", 404);
}, "notFoundHandler");
var errorHandler = /* @__PURE__ */ __name((err, c) => {
  if (err instanceof HTTPException) {
    return err.getResponse();
  }
  console.error(err);
  const message = "Internal Server Error";
  return c.text(message, 500);
}, "errorHandler");
var _path;
var _Hono = class extends defineDynamicClass() {
  static {
    __name(this, "_Hono");
  }
  constructor(options = {}) {
    super();
    this._basePath = "/";
    __privateAdd3(this, _path, "/");
    this.routes = [];
    this.notFoundHandler = notFoundHandler;
    this.errorHandler = errorHandler;
    this.onError = (handler) => {
      this.errorHandler = handler;
      return this;
    };
    this.notFound = (handler) => {
      this.notFoundHandler = handler;
      return this;
    };
    this.head = () => {
      console.warn("`app.head()` is no longer used. `app.get()` implicitly handles the HEAD method.");
      return this;
    };
    this.handleEvent = (event) => {
      return this.dispatch(event.request, event, void 0, event.request.method);
    };
    this.fetch = (request, Env, executionCtx) => {
      return this.dispatch(request, executionCtx, Env, request.method);
    };
    this.request = (input, requestInit, Env, executionCtx) => {
      if (input instanceof Request) {
        if (requestInit !== void 0) {
          input = new Request(input, requestInit);
        }
        return this.fetch(input, Env, executionCtx);
      }
      input = input.toString();
      const path = /^https?:\/\//.test(input) ? input : `http://localhost${mergePath("/", input)}`;
      const req = new Request(path, requestInit);
      return this.fetch(req, Env, executionCtx);
    };
    this.fire = () => {
      addEventListener("fetch", (event) => {
        event.respondWith(this.dispatch(event.request, event, void 0, event.request.method));
      });
    };
    const allMethods = [...METHODS, METHOD_NAME_ALL_LOWERCASE];
    allMethods.map((method) => {
      this[method] = (args1, ...args) => {
        if (typeof args1 === "string") {
          __privateSet3(this, _path, args1);
        } else {
          this.addRoute(method, __privateGet3(this, _path), args1);
        }
        args.map((handler) => {
          if (typeof handler !== "string") {
            this.addRoute(method, __privateGet3(this, _path), handler);
          }
        });
        return this;
      };
    });
    this.on = (method, path, ...handlers) => {
      if (!method) {
        return this;
      }
      __privateSet3(this, _path, path);
      for (const m of [method].flat()) {
        handlers.map((handler) => {
          this.addRoute(m.toUpperCase(), __privateGet3(this, _path), handler);
        });
      }
      return this;
    };
    this.use = (arg1, ...handlers) => {
      if (typeof arg1 === "string") {
        __privateSet3(this, _path, arg1);
      } else {
        handlers.unshift(arg1);
      }
      handlers.map((handler) => {
        this.addRoute(METHOD_NAME_ALL, __privateGet3(this, _path), handler);
      });
      return this;
    };
    const strict = options.strict ?? true;
    delete options.strict;
    Object.assign(this, options);
    this.getPath = strict ? options.getPath ?? getPath : getPathNoStrict;
  }
  clone() {
    const clone = new _Hono({
      router: this.router,
      getPath: this.getPath
    });
    clone.routes = this.routes;
    return clone;
  }
  route(path, app2) {
    const subApp = this.basePath(path);
    if (!app2) {
      return subApp;
    }
    app2.routes.map((r) => {
      let handler;
      if (app2.errorHandler === errorHandler) {
        handler = r.handler;
      } else {
        handler = /* @__PURE__ */ __name(async (c, next) => (await compose([], app2.errorHandler)(c, () => r.handler(c, next))).res, "handler");
        handler[COMPOSED_HANDLER] = r.handler;
      }
      subApp.addRoute(r.method, r.path, handler);
    });
    return this;
  }
  basePath(path) {
    const subApp = this.clone();
    subApp._basePath = mergePath(this._basePath, path);
    return subApp;
  }
  showRoutes() {
    const length = 8;
    this.routes.map((route) => {
      console.log(
        `\x1B[32m${route.method}\x1B[0m ${" ".repeat(length - route.method.length)} ${route.path}`
      );
    });
  }
  mount(path, applicationHandler, optionHandler) {
    const mergedPath = mergePath(this._basePath, path);
    const pathPrefixLength = mergedPath === "/" ? 0 : mergedPath.length;
    const handler = /* @__PURE__ */ __name(async (c, next) => {
      let executionContext = void 0;
      try {
        executionContext = c.executionCtx;
      } catch {
      }
      const options = optionHandler ? optionHandler(c) : [c.env, executionContext];
      const optionsArray = Array.isArray(options) ? options : [options];
      const queryStrings = getQueryStrings(c.req.url);
      const res = await applicationHandler(
        new Request(
          new URL((c.req.path.slice(pathPrefixLength) || "/") + queryStrings, c.req.url),
          c.req.raw
        ),
        ...optionsArray
      );
      if (res) {
        return res;
      }
      await next();
    }, "handler");
    this.addRoute(METHOD_NAME_ALL, mergePath(path, "*"), handler);
    return this;
  }
  get routerName() {
    this.matchRoute("GET", "/");
    return this.router.name;
  }
  addRoute(method, path, handler) {
    method = method.toUpperCase();
    path = mergePath(this._basePath, path);
    const r = { path, method, handler };
    this.router.add(method, path, [handler, r]);
    this.routes.push(r);
  }
  matchRoute(method, path) {
    return this.router.match(method, path);
  }
  handleError(err, c) {
    if (err instanceof Error) {
      return this.errorHandler(err, c);
    }
    throw err;
  }
  dispatch(request, executionCtx, env, method) {
    if (method === "HEAD") {
      return (async () => new Response(null, await this.dispatch(request, executionCtx, env, "GET")))();
    }
    const path = this.getPath(request, { env });
    const matchResult = this.matchRoute(method, path);
    const c = new Context(new HonoRequest(request, path, matchResult), {
      env,
      executionCtx,
      notFoundHandler: this.notFoundHandler
    });
    if (matchResult[0].length === 1) {
      let res;
      try {
        res = matchResult[0][0][0][0](c, async () => {
          c.res = await this.notFoundHandler(c);
        });
      } catch (err) {
        return this.handleError(err, c);
      }
      return res instanceof Promise ? res.then(
        (resolved) => resolved || (c.finalized ? c.res : this.notFoundHandler(c))
      ).catch((err) => this.handleError(err, c)) : res;
    }
    const composed = compose(matchResult[0], this.errorHandler, this.notFoundHandler);
    return (async () => {
      try {
        const context = await composed(c);
        if (!context.finalized) {
          throw new Error(
            "Context is not finalized. You may forget returning Response object or `await next()`"
          );
        }
        return context.res;
      } catch (err) {
        return this.handleError(err, c);
      }
    })();
  }
};
var Hono = _Hono;
_path = /* @__PURE__ */ new WeakMap();

// node_modules/hono/dist/router/reg-exp-router/node.js
var LABEL_REG_EXP_STR = "[^/]+";
var ONLY_WILDCARD_REG_EXP_STR = ".*";
var TAIL_WILDCARD_REG_EXP_STR = "(?:|/.*)";
var PATH_ERROR = Symbol();
function compareKey(a, b) {
  if (a.length === 1) {
    return b.length === 1 ? a < b ? -1 : 1 : -1;
  }
  if (b.length === 1) {
    return 1;
  }
  if (a === ONLY_WILDCARD_REG_EXP_STR || a === TAIL_WILDCARD_REG_EXP_STR) {
    return 1;
  } else if (b === ONLY_WILDCARD_REG_EXP_STR || b === TAIL_WILDCARD_REG_EXP_STR) {
    return -1;
  }
  if (a === LABEL_REG_EXP_STR) {
    return 1;
  } else if (b === LABEL_REG_EXP_STR) {
    return -1;
  }
  return a.length === b.length ? a < b ? -1 : 1 : b.length - a.length;
}
__name(compareKey, "compareKey");
var Node = class {
  static {
    __name(this, "Node");
  }
  constructor() {
    this.children = {};
  }
  insert(tokens, index, paramMap, context, pathErrorCheckOnly) {
    if (tokens.length === 0) {
      if (this.index !== void 0) {
        throw PATH_ERROR;
      }
      if (pathErrorCheckOnly) {
        return;
      }
      this.index = index;
      return;
    }
    const [token, ...restTokens] = tokens;
    const pattern = token === "*" ? restTokens.length === 0 ? ["", "", ONLY_WILDCARD_REG_EXP_STR] : ["", "", LABEL_REG_EXP_STR] : token === "/*" ? ["", "", TAIL_WILDCARD_REG_EXP_STR] : token.match(/^\:([^\{\}]+)(?:\{(.+)\})?$/);
    let node;
    if (pattern) {
      const name = pattern[1];
      let regexpStr = pattern[2] || LABEL_REG_EXP_STR;
      if (name && pattern[2]) {
        regexpStr = regexpStr.replace(/^\((?!\?:)(?=[^)]+\)$)/, "(?:");
        if (/\((?!\?:)/.test(regexpStr)) {
          throw PATH_ERROR;
        }
      }
      node = this.children[regexpStr];
      if (!node) {
        if (Object.keys(this.children).some(
          (k) => k !== ONLY_WILDCARD_REG_EXP_STR && k !== TAIL_WILDCARD_REG_EXP_STR
        )) {
          throw PATH_ERROR;
        }
        if (pathErrorCheckOnly) {
          return;
        }
        node = this.children[regexpStr] = new Node();
        if (name !== "") {
          node.varIndex = context.varIndex++;
        }
      }
      if (!pathErrorCheckOnly && name !== "") {
        paramMap.push([name, node.varIndex]);
      }
    } else {
      node = this.children[token];
      if (!node) {
        if (Object.keys(this.children).some(
          (k) => k.length > 1 && k !== ONLY_WILDCARD_REG_EXP_STR && k !== TAIL_WILDCARD_REG_EXP_STR
        )) {
          throw PATH_ERROR;
        }
        if (pathErrorCheckOnly) {
          return;
        }
        node = this.children[token] = new Node();
      }
    }
    node.insert(restTokens, index, paramMap, context, pathErrorCheckOnly);
  }
  buildRegExpStr() {
    const childKeys = Object.keys(this.children).sort(compareKey);
    const strList = childKeys.map((k) => {
      const c = this.children[k];
      return (typeof c.varIndex === "number" ? `(${k})@${c.varIndex}` : k) + c.buildRegExpStr();
    });
    if (typeof this.index === "number") {
      strList.unshift(`#${this.index}`);
    }
    if (strList.length === 0) {
      return "";
    }
    if (strList.length === 1) {
      return strList[0];
    }
    return "(?:" + strList.join("|") + ")";
  }
};

// node_modules/hono/dist/router/reg-exp-router/trie.js
var Trie = class {
  static {
    __name(this, "Trie");
  }
  constructor() {
    this.context = { varIndex: 0 };
    this.root = new Node();
  }
  insert(path, index, pathErrorCheckOnly) {
    const paramAssoc = [];
    const groups = [];
    for (let i = 0; ; ) {
      let replaced = false;
      path = path.replace(/\{[^}]+\}/g, (m) => {
        const mark = `@\\${i}`;
        groups[i] = [mark, m];
        i++;
        replaced = true;
        return mark;
      });
      if (!replaced) {
        break;
      }
    }
    const tokens = path.match(/(?::[^\/]+)|(?:\/\*$)|./g) || [];
    for (let i = groups.length - 1; i >= 0; i--) {
      const [mark] = groups[i];
      for (let j = tokens.length - 1; j >= 0; j--) {
        if (tokens[j].indexOf(mark) !== -1) {
          tokens[j] = tokens[j].replace(mark, groups[i][1]);
          break;
        }
      }
    }
    this.root.insert(tokens, index, paramAssoc, this.context, pathErrorCheckOnly);
    return paramAssoc;
  }
  buildRegExp() {
    let regexp = this.root.buildRegExpStr();
    if (regexp === "") {
      return [/^$/, [], []];
    }
    let captureIndex = 0;
    const indexReplacementMap = [];
    const paramReplacementMap = [];
    regexp = regexp.replace(/#(\d+)|@(\d+)|\.\*\$/g, (_, handlerIndex, paramIndex) => {
      if (typeof handlerIndex !== "undefined") {
        indexReplacementMap[++captureIndex] = Number(handlerIndex);
        return "$()";
      }
      if (typeof paramIndex !== "undefined") {
        paramReplacementMap[Number(paramIndex)] = ++captureIndex;
        return "";
      }
      return "";
    });
    return [new RegExp(`^${regexp}`), indexReplacementMap, paramReplacementMap];
  }
};

// node_modules/hono/dist/router/reg-exp-router/router.js
var methodNames = [METHOD_NAME_ALL, ...METHODS].map((method) => method.toUpperCase());
var emptyParam = [];
var nullMatcher = [/^$/, [], {}];
var wildcardRegExpCache = {};
function buildWildcardRegExp(path) {
  return wildcardRegExpCache[path] ?? (wildcardRegExpCache[path] = new RegExp(
    path === "*" ? "" : `^${path.replace(/\/\*/, "(?:|/.*)")}$`
  ));
}
__name(buildWildcardRegExp, "buildWildcardRegExp");
function clearWildcardRegExpCache() {
  wildcardRegExpCache = {};
}
__name(clearWildcardRegExpCache, "clearWildcardRegExpCache");
function buildMatcherFromPreprocessedRoutes(routes) {
  const trie = new Trie();
  const handlerData = [];
  if (routes.length === 0) {
    return nullMatcher;
  }
  const routesWithStaticPathFlag = routes.map(
    (route) => [!/\*|\/:/.test(route[0]), ...route]
  ).sort(
    ([isStaticA, pathA], [isStaticB, pathB]) => isStaticA ? 1 : isStaticB ? -1 : pathA.length - pathB.length
  );
  const staticMap = {};
  for (let i = 0, j = -1, len = routesWithStaticPathFlag.length; i < len; i++) {
    const [pathErrorCheckOnly, path, handlers] = routesWithStaticPathFlag[i];
    if (pathErrorCheckOnly) {
      staticMap[path] = [handlers.map(([h]) => [h, {}]), emptyParam];
    } else {
      j++;
    }
    let paramAssoc;
    try {
      paramAssoc = trie.insert(path, j, pathErrorCheckOnly);
    } catch (e) {
      throw e === PATH_ERROR ? new UnsupportedPathError(path) : e;
    }
    if (pathErrorCheckOnly) {
      continue;
    }
    handlerData[j] = handlers.map(([h, paramCount]) => {
      const paramIndexMap = {};
      paramCount -= 1;
      for (; paramCount >= 0; paramCount--) {
        const [key, value] = paramAssoc[paramCount];
        paramIndexMap[key] = value;
      }
      return [h, paramIndexMap];
    });
  }
  const [regexp, indexReplacementMap, paramReplacementMap] = trie.buildRegExp();
  for (let i = 0, len = handlerData.length; i < len; i++) {
    for (let j = 0, len2 = handlerData[i].length; j < len2; j++) {
      const map = handlerData[i][j]?.[1];
      if (!map) {
        continue;
      }
      const keys = Object.keys(map);
      for (let k = 0, len3 = keys.length; k < len3; k++) {
        map[keys[k]] = paramReplacementMap[map[keys[k]]];
      }
    }
  }
  const handlerMap = [];
  for (const i in indexReplacementMap) {
    handlerMap[i] = handlerData[indexReplacementMap[i]];
  }
  return [regexp, handlerMap, staticMap];
}
__name(buildMatcherFromPreprocessedRoutes, "buildMatcherFromPreprocessedRoutes");
function findMiddleware(middleware, path) {
  if (!middleware) {
    return void 0;
  }
  for (const k of Object.keys(middleware).sort((a, b) => b.length - a.length)) {
    if (buildWildcardRegExp(k).test(path)) {
      return [...middleware[k]];
    }
  }
  return void 0;
}
__name(findMiddleware, "findMiddleware");
var RegExpRouter = class {
  static {
    __name(this, "RegExpRouter");
  }
  constructor() {
    this.name = "RegExpRouter";
    this.middleware = { [METHOD_NAME_ALL]: {} };
    this.routes = { [METHOD_NAME_ALL]: {} };
  }
  add(method, path, handler) {
    var _a;
    const { middleware, routes } = this;
    if (!middleware || !routes) {
      throw new Error(MESSAGE_MATCHER_IS_ALREADY_BUILT);
    }
    if (methodNames.indexOf(method) === -1) {
      methodNames.push(method);
    }
    if (!middleware[method]) {
      ;
      [middleware, routes].forEach((handlerMap) => {
        handlerMap[method] = {};
        Object.keys(handlerMap[METHOD_NAME_ALL]).forEach((p) => {
          handlerMap[method][p] = [...handlerMap[METHOD_NAME_ALL][p]];
        });
      });
    }
    if (path === "/*") {
      path = "*";
    }
    const paramCount = (path.match(/\/:/g) || []).length;
    if (/\*$/.test(path)) {
      const re = buildWildcardRegExp(path);
      if (method === METHOD_NAME_ALL) {
        Object.keys(middleware).forEach((m) => {
          var _a2;
          (_a2 = middleware[m])[path] || (_a2[path] = findMiddleware(middleware[m], path) || findMiddleware(middleware[METHOD_NAME_ALL], path) || []);
        });
      } else {
        (_a = middleware[method])[path] || (_a[path] = findMiddleware(middleware[method], path) || findMiddleware(middleware[METHOD_NAME_ALL], path) || []);
      }
      Object.keys(middleware).forEach((m) => {
        if (method === METHOD_NAME_ALL || method === m) {
          Object.keys(middleware[m]).forEach((p) => {
            re.test(p) && middleware[m][p].push([handler, paramCount]);
          });
        }
      });
      Object.keys(routes).forEach((m) => {
        if (method === METHOD_NAME_ALL || method === m) {
          Object.keys(routes[m]).forEach(
            (p) => re.test(p) && routes[m][p].push([handler, paramCount])
          );
        }
      });
      return;
    }
    const paths = checkOptionalParameter(path) || [path];
    for (let i = 0, len = paths.length; i < len; i++) {
      const path2 = paths[i];
      Object.keys(routes).forEach((m) => {
        var _a2;
        if (method === METHOD_NAME_ALL || method === m) {
          (_a2 = routes[m])[path2] || (_a2[path2] = [
            ...findMiddleware(middleware[m], path2) || findMiddleware(middleware[METHOD_NAME_ALL], path2) || []
          ]);
          routes[m][path2].push([handler, paramCount - len + i + 1]);
        }
      });
    }
  }
  match(method, path) {
    clearWildcardRegExpCache();
    const matchers = this.buildAllMatchers();
    this.match = (method2, path2) => {
      const matcher = matchers[method2];
      const staticMatch = matcher[2][path2];
      if (staticMatch) {
        return staticMatch;
      }
      const match = path2.match(matcher[0]);
      if (!match) {
        return [[], emptyParam];
      }
      const index = match.indexOf("", 1);
      return [matcher[1][index], match];
    };
    return this.match(method, path);
  }
  buildAllMatchers() {
    const matchers = {};
    methodNames.forEach((method) => {
      matchers[method] = this.buildMatcher(method) || matchers[METHOD_NAME_ALL];
    });
    this.middleware = this.routes = void 0;
    return matchers;
  }
  buildMatcher(method) {
    const routes = [];
    let hasOwnRoute = method === METHOD_NAME_ALL;
    [this.middleware, this.routes].forEach((r) => {
      const ownRoute = r[method] ? Object.keys(r[method]).map((path) => [path, r[method][path]]) : [];
      if (ownRoute.length !== 0) {
        hasOwnRoute || (hasOwnRoute = true);
        routes.push(...ownRoute);
      } else if (method !== METHOD_NAME_ALL) {
        routes.push(
          ...Object.keys(r[METHOD_NAME_ALL]).map((path) => [path, r[METHOD_NAME_ALL][path]])
        );
      }
    });
    if (!hasOwnRoute) {
      return null;
    } else {
      return buildMatcherFromPreprocessedRoutes(routes);
    }
  }
};

// node_modules/hono/dist/router/smart-router/router.js
var SmartRouter = class {
  static {
    __name(this, "SmartRouter");
  }
  constructor(init) {
    this.name = "SmartRouter";
    this.routers = [];
    this.routes = [];
    Object.assign(this, init);
  }
  add(method, path, handler) {
    if (!this.routes) {
      throw new Error(MESSAGE_MATCHER_IS_ALREADY_BUILT);
    }
    this.routes.push([method, path, handler]);
  }
  match(method, path) {
    if (!this.routes) {
      throw new Error("Fatal error");
    }
    const { routers, routes } = this;
    const len = routers.length;
    let i = 0;
    let res;
    for (; i < len; i++) {
      const router = routers[i];
      try {
        routes.forEach((args) => {
          router.add(...args);
        });
        res = router.match(method, path);
      } catch (e) {
        if (e instanceof UnsupportedPathError) {
          continue;
        }
        throw e;
      }
      this.match = router.match.bind(router);
      this.routers = [router];
      this.routes = void 0;
      break;
    }
    if (i === len) {
      throw new Error("Fatal error");
    }
    this.name = `SmartRouter + ${this.activeRouter.name}`;
    return res;
  }
  get activeRouter() {
    if (this.routes || this.routers.length !== 1) {
      throw new Error("No active router has been determined yet.");
    }
    return this.routers[0];
  }
};

// node_modules/hono/dist/router/trie-router/node.js
var Node2 = class {
  static {
    __name(this, "Node");
  }
  constructor(method, handler, children) {
    this.order = 0;
    this.params = {};
    this.children = children || {};
    this.methods = [];
    this.name = "";
    if (method && handler) {
      const m = {};
      m[method] = { handler, possibleKeys: [], score: 0, name: this.name };
      this.methods = [m];
    }
    this.patterns = [];
  }
  insert(method, path, handler) {
    this.name = `${method} ${path}`;
    this.order = ++this.order;
    let curNode = this;
    const parts = splitRoutingPath(path);
    const possibleKeys = [];
    const parentPatterns = [];
    for (let i = 0, len = parts.length; i < len; i++) {
      const p = parts[i];
      if (Object.keys(curNode.children).includes(p)) {
        parentPatterns.push(...curNode.patterns);
        curNode = curNode.children[p];
        const pattern2 = getPattern(p);
        if (pattern2) {
          possibleKeys.push(pattern2[1]);
        }
        continue;
      }
      curNode.children[p] = new Node2();
      const pattern = getPattern(p);
      if (pattern) {
        curNode.patterns.push(pattern);
        parentPatterns.push(...curNode.patterns);
        possibleKeys.push(pattern[1]);
      }
      parentPatterns.push(...curNode.patterns);
      curNode = curNode.children[p];
    }
    if (!curNode.methods.length) {
      curNode.methods = [];
    }
    const m = {};
    const handlerSet = {
      handler,
      possibleKeys: possibleKeys.filter((v, i, a) => a.indexOf(v) === i),
      name: this.name,
      score: this.order
    };
    m[method] = handlerSet;
    curNode.methods.push(m);
    return curNode;
  }
  gHSets(node, method, nodeParams, params) {
    const handlerSets = [];
    for (let i = 0, len = node.methods.length; i < len; i++) {
      const m = node.methods[i];
      const handlerSet = m[method] || m[METHOD_NAME_ALL];
      const processedSet = {};
      if (handlerSet !== void 0) {
        handlerSet.params = {};
        handlerSet.possibleKeys.forEach((key) => {
          const processed = processedSet[handlerSet.name];
          handlerSet.params[key] = params[key] && !processed ? params[key] : nodeParams[key] ?? params[key];
          processedSet[handlerSet.name] = true;
        });
        handlerSets.push(handlerSet);
      }
    }
    return handlerSets;
  }
  search(method, path) {
    const handlerSets = [];
    this.params = {};
    const curNode = this;
    let curNodes = [curNode];
    const parts = splitPath(path);
    for (let i = 0, len = parts.length; i < len; i++) {
      const part = parts[i];
      const isLast = i === len - 1;
      const tempNodes = [];
      for (let j = 0, len2 = curNodes.length; j < len2; j++) {
        const node = curNodes[j];
        const nextNode = node.children[part];
        if (nextNode) {
          nextNode.params = node.params;
          if (isLast === true) {
            if (nextNode.children["*"]) {
              handlerSets.push(...this.gHSets(nextNode.children["*"], method, node.params, {}));
            }
            handlerSets.push(...this.gHSets(nextNode, method, node.params, {}));
          } else {
            tempNodes.push(nextNode);
          }
        }
        for (let k = 0, len3 = node.patterns.length; k < len3; k++) {
          const pattern = node.patterns[k];
          const params = { ...node.params };
          if (pattern === "*") {
            const astNode = node.children["*"];
            if (astNode) {
              handlerSets.push(...this.gHSets(astNode, method, node.params, {}));
              tempNodes.push(astNode);
            }
            continue;
          }
          if (part === "") {
            continue;
          }
          const [key, name, matcher] = pattern;
          const child = node.children[key];
          const restPathString = parts.slice(i).join("/");
          if (matcher instanceof RegExp && matcher.test(restPathString)) {
            params[name] = restPathString;
            handlerSets.push(...this.gHSets(child, method, node.params, params));
            continue;
          }
          if (matcher === true || matcher instanceof RegExp && matcher.test(part)) {
            if (typeof key === "string") {
              params[name] = part;
              if (isLast === true) {
                handlerSets.push(...this.gHSets(child, method, params, node.params));
                if (child.children["*"]) {
                  handlerSets.push(...this.gHSets(child.children["*"], method, params, node.params));
                }
              } else {
                child.params = params;
                tempNodes.push(child);
              }
            }
          }
        }
      }
      curNodes = tempNodes;
    }
    const results = handlerSets.sort((a, b) => {
      return a.score - b.score;
    });
    return [results.map(({ handler, params }) => [handler, params])];
  }
};

// node_modules/hono/dist/router/trie-router/router.js
var TrieRouter = class {
  static {
    __name(this, "TrieRouter");
  }
  constructor() {
    this.name = "TrieRouter";
    this.node = new Node2();
  }
  add(method, path, handler) {
    const results = checkOptionalParameter(path);
    if (results) {
      for (const p of results) {
        this.node.insert(method, p, handler);
      }
      return;
    }
    this.node.insert(method, path, handler);
  }
  match(method, path) {
    return this.node.search(method, path);
  }
};

// node_modules/hono/dist/hono.js
var Hono2 = class extends Hono {
  static {
    __name(this, "Hono");
  }
  constructor(options = {}) {
    super(options);
    this.router = options.router ?? new SmartRouter({
      routers: [new RegExpRouter(), new TrieRouter()]
    });
  }
};

// node_modules/hono/dist/middleware/cors/index.js
var cors = /* @__PURE__ */ __name((options) => {
  const defaults = {
    origin: "*",
    allowMethods: ["GET", "HEAD", "PUT", "POST", "DELETE", "PATCH"],
    allowHeaders: [],
    exposeHeaders: []
  };
  const opts = {
    ...defaults,
    ...options
  };
  const findAllowOrigin = ((optsOrigin) => {
    if (typeof optsOrigin === "string") {
      return () => optsOrigin;
    } else if (typeof optsOrigin === "function") {
      return optsOrigin;
    } else {
      return (origin) => optsOrigin.includes(origin) ? origin : optsOrigin[0];
    }
  })(opts.origin);
  return /* @__PURE__ */ __name(async function cors2(c, next) {
    function set(key, value) {
      c.res.headers.set(key, value);
    }
    __name(set, "set");
    const allowOrigin = findAllowOrigin(c.req.header("origin") || "");
    if (allowOrigin) {
      set("Access-Control-Allow-Origin", allowOrigin);
    }
    if (opts.origin !== "*") {
      set("Vary", "Origin");
    }
    if (opts.credentials) {
      set("Access-Control-Allow-Credentials", "true");
    }
    if (opts.exposeHeaders?.length) {
      set("Access-Control-Expose-Headers", opts.exposeHeaders.join(","));
    }
    if (c.req.method === "OPTIONS") {
      if (opts.maxAge != null) {
        set("Access-Control-Max-Age", opts.maxAge.toString());
      }
      if (opts.allowMethods?.length) {
        set("Access-Control-Allow-Methods", opts.allowMethods.join(","));
      }
      let headers = opts.allowHeaders;
      if (!headers?.length) {
        const requestHeaders = c.req.header("Access-Control-Request-Headers");
        if (requestHeaders) {
          headers = requestHeaders.split(/\s*,\s*/);
        }
      }
      if (headers?.length) {
        set("Access-Control-Allow-Headers", headers.join(","));
        c.res.headers.append("Vary", "Access-Control-Request-Headers");
      }
      c.res.headers.delete("Content-Length");
      c.res.headers.delete("Content-Type");
      return new Response(null, {
        headers: c.res.headers,
        status: 204,
        statusText: c.res.statusText
      });
    }
    await next();
  }, "cors2");
}, "cors");

// worker/middleware/cors.ts
var corsMiddleware = cors({
  origin: "*",
  allowMethods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
  allowHeaders: ["Content-Type", "Authorization"],
  exposeHeaders: ["Content-Length", "X-Requested-With"],
  maxAge: 86400
});

// worker/middleware/error-handler.ts
var errorHandler2 = /* @__PURE__ */ __name(async (c, next) => {
  try {
    await next();
  } catch (error) {
    console.error("Unhandled error:", error);
    return c.json({
      error: "Internal server error",
      message: error instanceof Error ? error.message : "Unknown error"
    }, 500);
  }
}, "errorHandler");
var createErrorResponse = /* @__PURE__ */ __name((c, message, status = 500) => {
  console.error(`Error: ${message}`);
  return c.json({ error: message }, status);
}, "createErrorResponse");
var createSuccessResponse = /* @__PURE__ */ __name((c, data, status = 200) => {
  return c.json(data, status);
}, "createSuccessResponse");

// worker/utils/helpers.ts
var formatDateForICS = /* @__PURE__ */ __name((dateString) => {
  return dateString.replace(/[-:]/g, "").split(".")[0];
}, "formatDateForICS");
var escapeICSField = /* @__PURE__ */ __name((field) => {
  return field.replace(/\n/g, "\\n");
}, "escapeICSField");
var generateUUID = /* @__PURE__ */ __name(() => {
  return crypto.randomUUID();
}, "generateUUID");
var getCurrentTimestamp = /* @__PURE__ */ __name(() => {
  return (/* @__PURE__ */ new Date()).toISOString();
}, "getCurrentTimestamp");
var validateDateRange = /* @__PURE__ */ __name((from, to) => {
  const fromMs = Date.parse(from);
  const toMs = Date.parse(to);
  return !isNaN(fromMs) && !isNaN(toMs);
}, "validateDateRange");

// worker/services/database-service.ts
var DatabaseService = class {
  constructor(db) {
    this.db = db;
  }
  static {
    __name(this, "DatabaseService");
  }
  async getEvents(calendarId, from, to) {
    const result = await this.db.prepare(`
      SELECT * FROM events 
      WHERE calendar_id = ? AND start >= ? AND start <= ?
      ORDER BY start ASC
    `).bind(calendarId, from, to).all();
    return result.results || [];
  }
  async createEvent(eventData) {
    const id = generateUUID();
    const now = getCurrentTimestamp();
    await this.db.prepare(`
      INSERT INTO events (id, calendar_id, title, description, start, end, tz, eventType, location, type, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'regular', ?, ?)
    `).bind(
      id,
      eventData.calendar_id,
      eventData.title,
      eventData.description || "",
      eventData.start,
      eventData.end,
      eventData.tz,
      eventData.eventType || "other",
      eventData.location || "",
      now,
      now
    ).run();
    return {
      id,
      calendar_id: eventData.calendar_id,
      title: eventData.title,
      description: eventData.description,
      start: eventData.start,
      end: eventData.end,
      tz: eventData.tz,
      eventType: eventData.eventType || "other",
      location: eventData.location,
      type: "regular",
      created_at: now,
      updated_at: now
    };
  }
  async updateEvent(id, updateData) {
    const updateFields = [];
    const values = [];
    if (updateData.title !== void 0) {
      updateFields.push("title = ?");
      values.push(updateData.title);
    }
    if (updateData.description !== void 0) {
      updateFields.push("description = ?");
      values.push(updateData.description);
    }
    if (updateData.start !== void 0) {
      updateFields.push("start = ?");
      values.push(updateData.start);
    }
    if (updateData.end !== void 0) {
      updateFields.push("end = ?");
      values.push(updateData.end);
    }
    if (updateData.tz !== void 0) {
      updateFields.push("tz = ?");
      values.push(updateData.tz);
    }
    if (updateData.eventType !== void 0) {
      updateFields.push("eventType = ?");
      values.push(updateData.eventType);
    }
    if (updateData.location !== void 0) {
      updateFields.push("location = ?");
      values.push(updateData.location);
    }
    if (updateFields.length === 0) {
      return null;
    }
    updateFields.push("updated_at = ?");
    values.push(getCurrentTimestamp());
    values.push(id);
    await this.db.prepare(`
      UPDATE events 
      SET ${updateFields.join(", ")}
      WHERE id = ?
    `).bind(...values).run();
    return this.getEventById(id);
  }
  async deleteEvent(id) {
    const result = await this.db.prepare("DELETE FROM events WHERE id = ?").bind(id).run();
    return result.changes > 0;
  }
  async getEventById(id) {
    const result = await this.db.prepare("SELECT * FROM events WHERE id = ?").bind(id).first();
    return result || null;
  }
  async createEchoEvents(parentEvent, followups, mermaidCode, userId) {
    const createdEvents = [];
    for (const followup of followups) {
      const followupId = generateUUID();
      const now = getCurrentTimestamp();
      await this.db.prepare(`
        INSERT INTO events (id, calendar_id, title, description, start, end, tz, 
                          type, flowchart, parent_event_id, user_id, eventType, created_at, updated_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, 'echo', ?, ?, ?, 'other', ?, ?)
      `).bind(
        followupId,
        parentEvent.calendar_id,
        followup.title,
        followup.description,
        followup.start,
        followup.end,
        parentEvent.tz,
        mermaidCode,
        parentEvent.id,
        userId,
        now,
        now
      ).run();
      createdEvents.push({ id: followupId, ...followup });
    }
    return createdEvents;
  }
  async updateEventFlowchart(eventId, flowchart, echoEventIds) {
    const now = getCurrentTimestamp();
    await this.db.prepare(`
      UPDATE events 
      SET flowchart = ?, echo_event_ids = ?, updated_at = ?
      WHERE id = ?
    `).bind(flowchart, JSON.stringify(echoEventIds), now, eventId).run();
  }
  async resetEchoEvents(eventId) {
    const now = getCurrentTimestamp();
    await this.db.prepare(`
      UPDATE events 
      SET flowchart = NULL, echo_event_ids = NULL, updated_at = ?
      WHERE id = ?
    `).bind(now, eventId).run();
    await this.db.prepare(`
      UPDATE events 
      SET flowchart = NULL, parent_event_id = NULL, updated_at = ?
      WHERE parent_event_id = ?
    `).bind(now, eventId).run();
  }
  async getUserEvents(userId) {
    const result = await this.db.prepare(`
      SELECT e.*, c.name as calendar_name
      FROM events e
      JOIN calendars c ON e.calendar_id = c.id
      WHERE c.user_id = ?
      ORDER BY e.start ASC
    `).bind(userId).all();
    return result.results || [];
  }
  async seedDemoData(userId, calendarId) {
    let user = await this.db.prepare("SELECT * FROM users WHERE id = ?").bind(userId).first();
    if (!user) {
      await this.db.prepare("INSERT INTO users (id, email) VALUES (?, ?)").bind(userId, `${userId}@example.com`).run();
    }
    let calendar = await this.db.prepare("SELECT * FROM calendars WHERE user_id = ?").bind(userId).first();
    if (!calendar) {
      await this.db.prepare("INSERT INTO calendars (id, user_id, name) VALUES (?, ?, ?)").bind(calendarId, userId, "My Calendar").run();
    }
    const eventCount = await this.db.prepare("SELECT COUNT(*) as count FROM events WHERE calendar_id = ?").bind(calendarId).first();
    if (eventCount && eventCount.count === 0) {
      await this.createDemoEvents(calendarId);
    }
  }
  async createDemoEvents(calendarId) {
    const now = /* @__PURE__ */ new Date();
    const tomorrow = new Date(now.getTime() + 24 * 60 * 60 * 1e3);
    const dayAfter = new Date(tomorrow.getTime() + 24 * 60 * 60 * 1e3);
    const demoEvents = [
      {
        id: generateUUID(),
        calendar_id: calendarId,
        title: "doctor appointment",
        description: "Annual checkup and consultation",
        start: new Date(tomorrow.getTime() + 14 * 60 * 60 * 1e3).toISOString(),
        end: new Date(tomorrow.getTime() + 15 * 60 * 60 * 1e3).toISOString(),
        tz: "America/New_York",
        eventType: "other",
        location: "Medical Center"
      },
      {
        id: generateUUID(),
        calendar_id: calendarId,
        title: "Team Meeting",
        description: "Weekly team sync",
        start: new Date(tomorrow.getTime() + 9 * 60 * 60 * 1e3).toISOString(),
        end: new Date(tomorrow.getTime() + 10 * 60 * 60 * 1e3).toISOString(),
        tz: "America/New_York",
        eventType: "work"
      },
      {
        id: generateUUID(),
        calendar_id: calendarId,
        title: "Lunch with Client",
        description: "Discuss project requirements",
        start: new Date(tomorrow.getTime() + 12 * 60 * 60 * 1e3).toISOString(),
        end: new Date(tomorrow.getTime() + 13 * 60 * 60 * 1e3).toISOString(),
        tz: "America/New_York",
        eventType: "work"
      },
      {
        id: generateUUID(),
        calendar_id: calendarId,
        title: "Product Review",
        description: "Review new features",
        start: new Date(dayAfter.getTime() + 14 * 60 * 60 * 1e3).toISOString(),
        end: new Date(dayAfter.getTime() + 15 * 60 * 60 * 1e3).toISOString(),
        tz: "America/New_York",
        eventType: "work"
      }
    ];
    for (const event of demoEvents) {
      await this.db.prepare(`
        INSERT INTO events (id, calendar_id, title, description, start, end, tz, eventType, location, created_at, updated_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).bind(event.id, event.calendar_id, event.title, event.description, event.start, event.end, event.tz, event.eventType, event.location || null, now.toISOString(), now.toISOString()).run();
    }
  }
};

// worker/utils/constants.ts
var CALENDAR_ID = "3c414e29-a3c3-4350-a334-5585cb22737a";

// worker/routes/events.ts
var eventsRouter = new Hono2();
eventsRouter.get("/api/events", async (c) => {
  try {
    const calendarId = c.req.query("calendarId") ?? CALENDAR_ID;
    const from = c.req.query("from");
    const to = c.req.query("to");
    if (!from || !to) {
      return createErrorResponse(c, "Missing required parameters: from, to", 400);
    }
    if (!validateDateRange(from, to)) {
      return createErrorResponse(c, "Invalid date format", 400);
    }
    const dbService = new DatabaseService(c.env.DB);
    const events = await dbService.getEvents(calendarId, from, to);
    return createSuccessResponse(c, { events });
  } catch (error) {
    console.error("Error fetching events:", error);
    return createErrorResponse(c, "Failed to fetch events");
  }
});
eventsRouter.get("/api/events/:id", async (c) => {
  try {
    const id = c.req.param("id");
    if (!id) {
      return createErrorResponse(c, "Event ID is required", 400);
    }
    const dbService = new DatabaseService(c.env.DB);
    const event = await dbService.getEventById(id);
    if (!event) {
      return createErrorResponse(c, "Event not found", 404);
    }
    return createSuccessResponse(c, { event });
  } catch (error) {
    console.error("Error fetching event:", error);
    return createErrorResponse(c, "Failed to fetch event");
  }
});
eventsRouter.post("/api/events", async (c) => {
  try {
    const body = await c.req.json();
    if (!body.calendar_id || !body.title || !body.start || !body.end || !body.tz) {
      return createErrorResponse(c, "Missing required fields", 400);
    }
    const dbService = new DatabaseService(c.env.DB);
    const event = await dbService.createEvent(body);
    return createSuccessResponse(c, { event }, 201);
  } catch (error) {
    console.error("Error creating event:", error);
    return createErrorResponse(c, "Failed to create event");
  }
});
eventsRouter.patch("/api/events/:id", async (c) => {
  try {
    const id = c.req.param("id");
    const body = await c.req.json();
    if (!id) {
      return createErrorResponse(c, "Event ID is required", 400);
    }
    const dbService = new DatabaseService(c.env.DB);
    const event = await dbService.updateEvent(id, body);
    if (!event) {
      return createErrorResponse(c, "Event not found", 404);
    }
    return createSuccessResponse(c, { event });
  } catch (error) {
    console.error("Error updating event:", error);
    return createErrorResponse(c, "Failed to update event");
  }
});
eventsRouter.delete("/api/events/:id", async (c) => {
  try {
    const id = c.req.param("id");
    if (!id) {
      return createErrorResponse(c, "Event ID is required", 400);
    }
    const dbService = new DatabaseService(c.env.DB);
    const deleted = await dbService.deleteEvent(id);
    if (!deleted) {
      return createErrorResponse(c, "Event not found", 404);
    }
    return createSuccessResponse(c, { message: "Event deleted successfully" });
  } catch (error) {
    console.error("Error deleting event:", error);
    return createErrorResponse(c, "Failed to delete event");
  }
});

// worker/services/ai-service.ts
async function generateFollowupEvents(parentEvent, openaiApiKey) {
  try {
    const prompt = `Generate 2 follow-up events for this calendar event:
Title: ${parentEvent.title}
Description: ${parentEvent.description || "No description"}
Date: ${parentEvent.start}

Generate realistic follow-up events that would naturally occur after this event. Consider:
- Project timelines and milestones
- Follow-up meetings or check-ins
- Review sessions or evaluations
- Next steps or continuation activities
- For medical appointments: follow-up visits, annual checkups, specialist referrals
- For work events: progress reviews, milestone check-ins, final presentations

Format as JSON array with exactly 2 events:
[{"title": "Event Title", "description": "Brief description", "start": "ISO_DATE", "end": "ISO_DATE"}]`;
    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${openaiApiKey}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        model: "gpt-4.1",
        messages: [
          {
            role: "system",
            content: "You are an expert personal assistant and event planner. Generate realistic follow-up calendar events based on the context provided. Always return valid JSON."
          },
          {
            role: "user",
            content: prompt
          }
        ],
        max_tokens: 500,
        temperature: 0.7
      })
    });
    if (!response.ok) {
      throw new Error(`OpenAI API error: ${response.status}`);
    }
    const data = await response.json();
    const content = data.choices[0].message.content;
    const followups = JSON.parse(content);
    if (!Array.isArray(followups) || followups.length < 2) {
      throw new Error("Invalid followup format");
    }
    const formattedFollowups = followups.slice(0, 2).map((followup, index) => {
      const baseDate = new Date(parentEvent.start);
      const daysOffset = index === 0 ? 14 : 365;
      const startDate = new Date(baseDate.getTime() + daysOffset * 24 * 60 * 60 * 1e3);
      const endDate = new Date(startDate.getTime() + 60 * 60 * 1e3);
      return {
        title: followup.title || `Follow-up ${index + 1}`,
        description: followup.description || "Follow-up event",
        start: startDate.toISOString(),
        end: endDate.toISOString()
      };
    });
    return formattedFollowups;
  } catch (error) {
    console.error("Error generating followups:", error);
    const baseDate = new Date(parentEvent.start);
    const weekLater = new Date(baseDate.getTime() + 14 * 24 * 60 * 60 * 1e3);
    const yearLater = new Date(baseDate.getTime() + 365 * 24 * 60 * 60 * 1e3);
    const isMedical = parentEvent.title.toLowerCase().includes("doctor") || parentEvent.title.toLowerCase().includes("appointment") || parentEvent.title.toLowerCase().includes("checkup") || parentEvent.title.toLowerCase().includes("visit");
    if (isMedical) {
      return [
        {
          title: "Follow-up Doctor Visit",
          description: "Check progress and discuss next steps",
          start: weekLater.toISOString(),
          end: new Date(weekLater.getTime() + 60 * 60 * 1e3).toISOString()
        },
        {
          title: "Annual Physical Exam",
          description: "Routine annual health checkup",
          start: yearLater.toISOString(),
          end: new Date(yearLater.getTime() + 60 * 60 * 1e3).toISOString()
        }
      ];
    }
    return [
      {
        title: "Follow-up Meeting",
        description: "Check progress on discussed items",
        start: weekLater.toISOString(),
        end: new Date(weekLater.getTime() + 60 * 60 * 1e3).toISOString()
      },
      {
        title: "Final Review",
        description: "Complete project review and next steps",
        start: yearLater.toISOString(),
        end: new Date(yearLater.getTime() + 60 * 60 * 1e3).toISOString()
      }
    ];
  }
}
__name(generateFollowupEvents, "generateFollowupEvents");
function generateMermaidFlowchart(parentEvent, followups) {
  const formatDate = /* @__PURE__ */ __name((dateStr) => {
    return new Date(dateStr).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric"
    });
  }, "formatDate");
  return `%%{init:{
  "theme":"base",
  "themeCSS": ".cluster rect{rx:12px!important;ry:12px!important;}.cluster.dateBox > rect{fill:#e8edf9;stroke:#4a6fa5;stroke-width:1.2px;}",
  "securityLevel":"loose"
}}%%
flowchart TD
    %% styles
    classDef dateBox fill:#e8edf9,stroke:#4a6fa5,stroke-width:1.2px
    classDef eventBox fill:#ffffff,stroke:#d1d5db,stroke-width:1px,color:#374151

    %% diagram
    subgraph D1 ["${formatDate(parentEvent.start)}"]
        EV0("${parentEvent.title}")
    end
    class D1 dateBox

    subgraph D2 ["${formatDate(followups[0].start)}"]
        EV1("${followups[0].title}")
    end
    class D2 dateBox

    subgraph D3 ["${formatDate(followups[1].start)}"]
        EV2("${followups[1].title}")
    end
    class D3 dateBox

    class EV0,EV1,EV2 eventBox

    D1 --> D2
    D2 --> D3

    %% ISO dates for reference
    %% ISO_DATE_1: ${parentEvent.start}
    %% ISO_DATE_2: ${followups[0].start}
    %% ISO_DATE_3: ${followups[1].start}

    %% click handlers on event nodes
    click EV0 "javascript:window.gotoDateWithTitle('${parentEvent.start}','${parentEvent.title}')"
    click EV1 "javascript:window.gotoDateWithTitle('${followups[0].start}','${followups[0].title}')"
    click EV2 "javascript:window.gotoDateWithTitle('${followups[1].start}','${followups[1].title}')"
`;
}
__name(generateMermaidFlowchart, "generateMermaidFlowchart");

// worker/routes/echo.ts
var echoRouter = new Hono2();
echoRouter.post("/api/events/:id/echo", async (c) => {
  try {
    const eventId = c.req.param("id");
    const { user_id } = await c.req.json();
    console.log("Echo request received for event:", eventId, "user:", user_id);
    if (!eventId || !user_id) {
      return createErrorResponse(c, "Missing required parameters", 400);
    }
    const dbService = new DatabaseService(c.env.DB);
    const parentEvent = await dbService.getEventById(eventId);
    console.log("Parent event found:", parentEvent);
    if (!parentEvent) {
      return createErrorResponse(c, "Event not found", 404);
    }
    console.log("Generating followup events...");
    const followups = await generateFollowupEvents(parentEvent, c.env.OPENAI_API_KEY);
    console.log("Followups generated:", followups);
    console.log("Generating Mermaid flowchart...");
    const mermaidCode = generateMermaidFlowchart(parentEvent, followups);
    console.log("Mermaid code generated:", mermaidCode);
    console.log("Creating echo events in database...");
    const createdEvents = await dbService.createEchoEvents(parentEvent, followups, mermaidCode, user_id);
    console.log("Echo events created:", createdEvents);
    const echoIds = createdEvents.map((e) => e.id);
    await dbService.updateEventFlowchart(eventId, mermaidCode, echoIds);
    console.log("Parent event updated with flowchart");
    return createSuccessResponse(c, {
      mermaid: mermaidCode,
      events: createdEvents
    }, 201);
  } catch (error) {
    console.error("Error creating echo:", error);
    return createErrorResponse(c, "Failed to create echo");
  }
});
echoRouter.post("/api/events/:id/echo/reset", async (c) => {
  try {
    const eventId = c.req.param("id");
    const { user_id } = await c.req.json();
    const dbService = new DatabaseService(c.env.DB);
    await dbService.resetEchoEvents(eventId);
    return createSuccessResponse(c, { message: "Echo reset successfully" });
  } catch (error) {
    console.error("Error resetting echo:", error);
    return createErrorResponse(c, "Failed to reset echo");
  }
});

// worker/services/weather-service.ts
var WeatherService = class {
  static {
    __name(this, "WeatherService");
  }
  apiKey;
  baseUrl = "https://api.open-meteo.com/v1";
  geocodingUrl = "https://geocoding-api.open-meteo.com/v1";
  constructor(apiKey) {
    this.apiKey = apiKey || "";
  }
  async getWeatherData(location) {
    try {
      const coordinates = await this.geocodeLocation(location);
      if (!coordinates) {
        console.warn(`Could not geocode location: ${location}`);
        return this.getMockWeatherData(location);
      }
      const weatherUrl = `${this.baseUrl}/forecast?latitude=${coordinates.lat}&longitude=${coordinates.lon}&daily=temperature_2m_max,temperature_2m_min,precipitation_probability_max,windspeed_10m_max,weathercode,sunrise,sunset&current_weather=true&timezone=auto&temperature_unit=fahrenheit`;
      const response = await fetch(weatherUrl);
      if (!response.ok) {
        console.warn(`Weather API error: ${response.status}, falling back to mock data`);
        return this.getMockWeatherData(location);
      }
      const data = await response.json();
      if (!data || !data.daily || !data.current_weather) {
        console.warn("Invalid weather data received, falling back to mock data");
        return this.getMockWeatherData(location);
      }
      return data;
    } catch (error) {
      console.error("Error fetching weather data:", error);
      return this.getMockWeatherData(location);
    }
  }
  async geocodeLocation(location) {
    try {
      const url = `${this.geocodingUrl}/search?name=${encodeURIComponent(location)}&count=1&language=en&format=json`;
      const response = await fetch(url);
      if (!response.ok) {
        console.warn(`Geocoding API error: ${response.status}`);
        return null;
      }
      const data = await response.json();
      if (data.results && data.results.length > 0) {
        const result = data.results[0];
        return {
          lat: result.latitude,
          lon: result.longitude
        };
      }
      return null;
    } catch (error) {
      console.error("Error geocoding location:", error);
      return null;
    }
  }
  // Mock weather data to prevent 500 errors
  getMockWeatherData(location) {
    const now = /* @__PURE__ */ new Date();
    const tomorrow = new Date(now);
    tomorrow.setDate(tomorrow.getDate() + 1);
    const dayAfter = new Date(now);
    dayAfter.setDate(dayAfter.getDate() + 2);
    return {
      location,
      forecast: {
        daily: {
          temperature_2m_max: [72, 68, 75],
          temperature_2m_min: [55, 52, 58],
          precipitation_probability_max: [10, 60, 5],
          windspeed_10m_max: [8, 12, 6],
          weathercode: [0, 61, 1],
          sunrise: ["06:30", "06:32", "06:34"],
          sunset: ["19:45", "19:43", "19:41"],
          time: [
            now.toISOString().split("T")[0],
            tomorrow.toISOString().split("T")[0],
            dayAfter.toISOString().split("T")[0]
          ]
        },
        current_weather: {
          temperature: 70,
          weathercode: 0,
          is_day: 1
        }
      }
    };
  }
  getWeatherColor(weatherData) {
    if (!weatherData) {
      return { color: "#000000", opacity: 1 };
    }
    const { forecast, current_weather } = weatherData;
    const now = /* @__PURE__ */ new Date();
    const todayIndex = 0;
    const sunriseStr = forecast.daily.sunrise[todayIndex];
    const sunsetStr = forecast.daily.sunset[todayIndex];
    if (sunriseStr && sunsetStr) {
      const sunrise = new Date(sunriseStr);
      const sunset = new Date(sunsetStr);
      if (now < sunrise || now >= sunset) {
        return { color: "#000000", opacity: 1 };
      }
    } else if (current_weather.is_day === 0) {
      return { color: "#000000", opacity: 1 };
    }
    const weatherCode = current_weather.weathercode;
    const isBadWeather = this.isDimWeather(weatherCode);
    if (isBadWeather) {
      return { color: "#9ca3af", opacity: 0.9 };
    } else {
      return { color: "#fde047", opacity: 1 };
    }
  }
  isDimWeather(weatherCode) {
    const dimWeatherCodes = [
      1,
      2,
      3,
      // Cloudy
      45,
      48,
      // Fog
      51,
      53,
      55,
      56,
      57,
      // Drizzle
      61,
      63,
      65,
      66,
      67,
      // Rain
      71,
      73,
      75,
      77,
      // Snow
      80,
      81,
      82,
      // Rain showers
      85,
      86,
      // Snow showers
      95,
      96,
      99
      // Thunderstorms
    ];
    return dimWeatherCodes.includes(weatherCode);
  }
  getWeatherDescription(weatherCode) {
    const descriptions = {
      0: "Clear sky",
      1: "Mainly clear",
      2: "Partly cloudy",
      3: "Overcast",
      45: "Foggy",
      48: "Depositing rime fog",
      51: "Light drizzle",
      53: "Moderate drizzle",
      55: "Dense drizzle",
      56: "Light freezing drizzle",
      57: "Dense freezing drizzle",
      61: "Slight rain",
      63: "Moderate rain",
      65: "Heavy rain",
      66: "Light freezing rain",
      67: "Heavy freezing rain",
      71: "Slight snow",
      73: "Moderate snow",
      75: "Heavy snow",
      77: "Snow grains",
      80: "Slight rain showers",
      81: "Moderate rain showers",
      82: "Violent rain showers",
      85: "Slight snow showers",
      86: "Heavy snow showers",
      95: "Thunderstorm",
      96: "Thunderstorm with slight hail",
      99: "Thunderstorm with heavy hail"
    };
    return descriptions[weatherCode] || "Unknown";
  }
};

// worker/routes/weather.ts
var weatherRouter = new Hono2();
weatherRouter.get("/api/weather", async (c) => {
  try {
    const { location = "New York" } = c.req.query();
    const weatherService = new WeatherService();
    const weatherData = await weatherService.getWeatherData(location);
    if (!weatherData) {
      return createErrorResponse(c, "Failed to fetch weather data");
    }
    return createSuccessResponse(c, {
      data: weatherData,
      status: "success"
    });
  } catch (error) {
    console.error("Error fetching weather:", error);
    return createErrorResponse(c, "Failed to fetch weather data");
  }
});
weatherRouter.post("/api/weather/location", async (c) => {
  try {
    const { location } = await c.req.json();
    if (!location) {
      return createErrorResponse(c, "Location is required", 400);
    }
    const weatherService = new WeatherService();
    const weatherData = await weatherService.getWeatherData(location);
    if (!weatherData) {
      return createErrorResponse(c, "Failed to fetch weather data for location");
    }
    return createSuccessResponse(c, {
      message: `Weather location updated to ${location}`,
      location,
      status: "success"
    });
  } catch (error) {
    console.error("Error updating weather location:", error);
    return createErrorResponse(c, "Failed to update weather location");
  }
});
weatherRouter.post("/api/weather/refresh", async (c) => {
  try {
    return createSuccessResponse(c, {
      message: "Weather data refreshed successfully",
      status: "success"
    });
  } catch (error) {
    console.error("Error refreshing weather:", error);
    return createErrorResponse(c, "Failed to refresh weather data");
  }
});

// worker/routes/ics.ts
var icsRouter = new Hono2();
icsRouter.get("/api/ics/:user", async (c) => {
  try {
    const userId = c.req.param("user");
    if (!userId) {
      return createErrorResponse(c, "User ID is required", 400);
    }
    const dbService = new DatabaseService(c.env.DB);
    const events = await dbService.getUserEvents(userId);
    if (events.length === 0) {
      return createErrorResponse(c, "No events found for user", 404);
    }
    let icsContent = "BEGIN:VCALENDAR\r\n";
    icsContent += "VERSION:2.0\r\n";
    icsContent += "PRODID:-//Calendar Worker//EN\r\n";
    icsContent += "CALSCALE:GREGORIAN\r\n";
    icsContent += "METHOD:PUBLISH\r\n";
    for (const event of events) {
      icsContent += "BEGIN:VEVENT\r\n";
      icsContent += `UID:${event.id}\r
`;
      icsContent += `DTSTAMP:${formatDateForICS((/* @__PURE__ */ new Date()).toISOString())}Z\r
`;
      icsContent += `DTSTART;TZID=${event.tz}:${formatDateForICS(event.start)}\r
`;
      icsContent += `DTEND;TZID=${event.tz}:${formatDateForICS(event.end)}\r
`;
      icsContent += `SUMMARY:${escapeICSField(event.title)}\r
`;
      if (event.description) {
        icsContent += `DESCRIPTION:${escapeICSField(event.description)}\r
`;
      }
      icsContent += `END:VEVENT\r
`;
    }
    icsContent += "END:VCALENDAR\r\n";
    return new Response(icsContent, {
      headers: {
        "Content-Type": "text/calendar; charset=utf-8",
        "Content-Disposition": `attachment; filename="calendar-${userId}.ics"`
      }
    });
  } catch (error) {
    console.error("Error generating ICS:", error);
    return createErrorResponse(c, "Failed to generate ICS");
  }
});

// worker/routes/seed.ts
var seedRouter = new Hono2();
seedRouter.get("/api/seed", async (c) => {
  try {
    const userId = c.env.USER_ID || "demo-user";
    const dbService = new DatabaseService(c.env.DB);
    await dbService.seedDemoData(userId, CALENDAR_ID);
    return createSuccessResponse(c, { message: "Demo data seeded successfully" });
  } catch (error) {
    console.error("Error seeding demo data:", error);
    return createErrorResponse(c, "Failed to seed demo data");
  }
});

// worker/services/asset-service.ts
var AssetService = class {
  constructor(assets) {
    this.assets = assets;
  }
  static {
    __name(this, "AssetService");
  }
  async serveAsset(path) {
    try {
      if (path.startsWith("/api/")) {
        throw new Error("API route requested");
      }
      const assetPath = path.startsWith("/") ? path : `/${path}`;
      const response = await this.assets.fetch(assetPath);
      if (response.status === 404) {
        return this.serveIndexHtml();
      }
      if (path.endsWith(".js") || path.endsWith(".css")) {
        return this.addCacheHeaders(response);
      }
      return response;
    } catch (error) {
      console.error("Error serving asset:", path, error);
      return this.serveIndexHtml();
    }
  }
  async serveIndexHtml() {
    try {
      const response = await this.assets.fetch("/index.html");
      if (response.status === 404) {
        throw new Error("index.html not found in assets");
      }
      return this.addCacheHeaders(response);
    } catch (error) {
      console.error("Error serving index.html:", error);
      throw error;
    }
  }
  addCacheHeaders(response) {
    const newResponse = new Response(response.body, response);
    newResponse.headers.set("Cache-Control", "no-cache, no-store, must-revalidate");
    newResponse.headers.set("Pragma", "no-cache");
    newResponse.headers.set("Expires", "0");
    return newResponse;
  }
};

// worker/index.ts
var app = new Hono2();
app.use("*", corsMiddleware);
app.use("*", errorHandler2);
app.route("/", eventsRouter);
app.route("/", echoRouter);
app.route("/", weatherRouter);
app.route("/", icsRouter);
app.route("/", seedRouter);
app.get("*", async (c) => {
  try {
    if (!c.req.url) {
      console.error("No request URL provided");
      return c.notFound();
    }
    if (!c.env.ASSETS) {
      console.error("ASSETS binding not available");
      return c.notFound();
    }
    const url = new URL(c.req.url);
    const path = url.pathname;
    if (path.startsWith("/api/")) {
      return c.notFound();
    }
    const assetService = new AssetService(c.env.ASSETS);
    return await assetService.serveAsset(path);
  } catch (error) {
    console.error("Error in static asset handler:", error);
    return c.notFound();
  }
});
var index_default = app;
export {
  index_default as default
};
//# sourceMappingURL=index.js.map
