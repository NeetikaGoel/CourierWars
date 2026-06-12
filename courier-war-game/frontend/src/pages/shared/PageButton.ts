export function pageButtonDisable(button: HTMLButtonElement, disabled: boolean): void
{
    button.disabled = disabled;
    button.classList.toggle("page-button-disabled", disabled);
  }
  
  export function pageButtonTextSet(button: HTMLButtonElement, text: string): void {
    button.textContent = text;
  }