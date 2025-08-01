export class ValidationUtil {
  /** Checks if a value is a valid string */
  static isValidString(value: any): boolean {
    return typeof value === 'string' && value.trim().length > 0 && value.length <= 100;
  }

  /** Checks if a user ID is valid */
  static isValidUserId(userId: any): boolean {
    return this.isValidString(userId) && /^[a-zA-Z0-9_-]+$/.test(userId);
  }

  /** Sanitizes a string input */
  static sanitizeString(input: any): string {
    if (typeof input !== 'string') {
      return String(input).trim().substring(0, 100);
    }
    return input.trim().substring(0, 100).replace(/[<>{}]/g, '');
  }
}