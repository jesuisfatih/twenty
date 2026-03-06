const normalizeBasePath = (basePath?: string) => {
  if (!basePath || basePath === '/') {
    return '/';
  }

  const withLeadingSlash = basePath.startsWith('/')
    ? basePath
    : `/${basePath}`;

  return withLeadingSlash.endsWith('/')
    ? withLeadingSlash.slice(0, -1)
    : withLeadingSlash;
};

export const BASE_PATH = normalizeBasePath(import.meta.env.BASE_URL);

export const stripBasePath = (pathname: string) => {
  if (BASE_PATH === '/') {
    return pathname;
  }

  if (pathname === BASE_PATH) {
    return '/';
  }

  if (pathname.startsWith(`${BASE_PATH}/`)) {
    return pathname.slice(BASE_PATH.length);
  }

  return pathname;
};

export const withBasePath = (pathname: string) => {
  const normalizedPath = pathname.startsWith('/') ? pathname : `/${pathname}`;

  if (BASE_PATH === '/') {
    return normalizedPath;
  }

  if (normalizedPath === '/') {
    return `${BASE_PATH}/`;
  }

  return `${BASE_PATH}${normalizedPath}`;
};

export const getPublicAssetUrl = (assetPath: string) => withBasePath(assetPath);