export interface HttpTransportPlaceholder {
  status: 'reserved';
  message: string;
}

export function getHttpTransportPlaceholder(): HttpTransportPlaceholder {
  return {
    status: 'reserved',
    message: 'HTTP transport is reserved for a future iteration.',
  };
}
