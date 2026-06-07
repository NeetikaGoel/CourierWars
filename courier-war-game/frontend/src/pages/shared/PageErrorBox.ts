export function pageErrorShow(root: HTMLElement, message: string): void {
    const errorBox = root.querySelector<HTMLElement>("[data-page-error]");
  
    if (!errorBox) {
      return;
    }
  
    errorBox.textContent = message;
    errorBox.hidden = false;
  }
  
  export function pageErrorClear(root: HTMLElement): void {
    const errorBox = root.querySelector<HTMLElement>("[data-page-error]");
  
    if (!errorBox) {
      return;
    }
  
    errorBox.textContent = "";
    errorBox.hidden = true;
  }