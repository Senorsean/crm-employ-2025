export class LinkedInError extends Error {
  constructor(
    public code: string,
    message: string
  ) {
    super(message);
    this.name = 'LinkedInError';
    Object.setPrototypeOf(this, LinkedInError.prototype);
  }
}