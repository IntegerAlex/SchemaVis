/**
 * Industry-standard username validation
 * Rules:
 * - 3-30 characters long
 * - Only alphanumeric characters, underscores, and hyphens
 * - Must start with a letter or number (not underscore or hyphen)
 * - Cannot end with underscore or hyphen
 * - No consecutive underscores or hyphens
 * - Case-insensitive (will be normalized to lowercase)
 */

export interface UsernameValidationResult {
  valid: boolean;
  error?: string;
}

/**
 * Validate username according to industry standards
 * @param username Username to validate (without @ prefix)
 * @returns Validation result with error message if invalid
 */
export function validateUsername(username: string): UsernameValidationResult {
  if (!username || typeof username !== 'string') {
    return { valid: false, error: 'Username is required' };
  }

  const trimmed = username.trim();

  // Length check
  if (trimmed.length < 3) {
    return { valid: false, error: 'Username must be at least 3 characters long' };
  }

  if (trimmed.length > 30) {
    return { valid: false, error: 'Username must be at most 30 characters long' };
  }

  // Must start with alphanumeric (not underscore or hyphen)
  if (!/^[a-zA-Z0-9]/.test(trimmed)) {
    return { valid: false, error: 'Username must start with a letter or number' };
  }

  // Must end with alphanumeric (not underscore or hyphen)
  if (!/[a-zA-Z0-9]$/.test(trimmed)) {
    return { valid: false, error: 'Username must end with a letter or number' };
  }

  // Only alphanumeric, underscores, and hyphens allowed
  if (!/^[a-zA-Z0-9_-]+$/.test(trimmed)) {
    return { valid: false, error: 'Username can only contain letters, numbers, underscores, and hyphens' };
  }

  // No consecutive underscores or hyphens
  if (/_{2,}/.test(trimmed) || /-{2,}/.test(trimmed)) {
    return { valid: false, error: 'Username cannot contain consecutive underscores or hyphens' };
  }

  // Reserved usernames (common system names)
  const reservedUsernames = [
    'admin',
    'administrator',
    'root',
    'system',
    'api',
    'www',
    'mail',
    'ftp',
    'localhost',
    'null',
    'undefined',
    'test',
    'demo',
  ];

  if (reservedUsernames.includes(trimmed.toLowerCase())) {
    return { valid: false, error: 'This username is reserved' };
  }

  return { valid: true };
}

/**
 * Normalize username (lowercase, trim)
 * @param username Username to normalize
 * @returns Normalized username
 */
export function normalizeUsername(username: string): string {
  return username.trim().toLowerCase();
}

/**
 * Format username for display (add @ prefix)
 * @param username Username to format
 * @returns Formatted username with @ prefix
 */
export function formatUsername(username: string): string {
  if (!username) return '';
  return username.startsWith('@') ? username : `@${username}`;
}

