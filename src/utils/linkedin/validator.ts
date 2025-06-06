const LINKEDIN_URL_PATTERN = /^(?:https?:\/\/)?(?:www\.)?linkedin\.com\/in\/([a-zA-Z0-9-]+)\/?$/i;

export function validateLinkedInUrl(url: string): boolean {
  if (!url?.trim()) return false;
  return LINKEDIN_URL_PATTERN.test(url.trim());
}

export function formatLinkedInUrl(url: string): string {
  if (!url?.trim()) return '';
  const match = url.trim().match(LINKEDIN_URL_PATTERN);
  if (!match) return '';
  return `https://www.linkedin.com/in/${match[1].toLowerCase()}`;
}