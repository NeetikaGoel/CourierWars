export function pageInputValue(root: HTMLElement, selector: string): string {
    const input = root.querySelector<HTMLInputElement | HTMLSelectElement>(selector);
  
    return input?.value.trim() ?? "";
  }
  
  export function pageRequiredText(value: string, fieldName: string): string | null {
    if (value.length === 0) {
      return `${fieldName} is required`;
    }
  
    return null;
  }
  
  export function pageLengthBetween(value: string, fieldName: string, min: number, max: number): string | null {
    if (value.length < min || value.length > max) {
      return `${fieldName} must be between ${min} and ${max} characters`;
    }
  
    return null;
  }
  
  export function pageEmailLooksValid(value: string): boolean {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
  }
  
  export function pageFirstError(errors: Array<string | null>): string | null {
    return errors.find((error) => error !== null) ?? null;
  }