export interface ApiSurfacePlaceholder {
  status: 'reserved';
  message: string;
}

export function getApiSurfacePlaceholder(): ApiSurfacePlaceholder {
  return {
    status: 'reserved',
    message: 'HTTP/UI API surface will be introduced in a future iteration.',
  };
}
