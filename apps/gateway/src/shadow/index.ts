export interface ShadowRequest {
  model: string;
  messages: unknown[];
}

const queue: ShadowRequest[] = [];

export function enqueueShadowRequest(req: ShadowRequest): void {
  queue.push(req);
}

export function drainShadowQueue(): ShadowRequest[] {
  const batch = [...queue];
  queue.length = 0;
  return batch;
}

export function shadowQueueSize(): number {
  return queue.length;
}
