const normalizeBasePath = (basePath?: string) => {
  if (!basePath || basePath === '/') {
    return '/';
  }

  const withLeadingSlash = basePath.startsWith('/')
    ? basePath
    : `/${basePath}`;

  const withoutTrailingSlash = withLeadingSlash.endsWith('/')
    ? withLeadingSlash.slice(0, -1)
    : withLeadingSlash;

  return withoutTrailingSlash || '/';
};

export const BASE_PATH = normalizeBasePath(import.meta.env.BASE_URL);

export const withBasePath = (path: string) => {
  if (BASE_PATH === '/') {
    return path;
  }

  if (!path || path === '/') {
    return BASE_PATH;
  }

  return `${BASE_PATH}${path.startsWith('/') ? path : `/${path}`}`;
};

export const stripBasePath = (pathname: string) => {
  if (BASE_PATH === '/' || !pathname.startsWith(BASE_PATH)) {
    return pathname;
  }

  const strippedPath = pathname.slice(BASE_PATH.length);

  return strippedPath.startsWith('/') ? strippedPath : `/${strippedPath}`;
};

export const getPublicAssetUrl = (assetPath: string) =>
  withBasePath(assetPath.startsWith('/') ? assetPath : `/${assetPath}`);