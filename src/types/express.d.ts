declare global {
  namespace Express {
    interface Request {
      /** Correlation id set by the request-id middleware. */
      requestId: string;
    }
  }
}

export {};
