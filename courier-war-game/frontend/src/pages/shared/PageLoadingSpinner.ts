export function pageLoadingSet(root: HTMLElement, loading: boolean, message = "Loading..."): void {
    const loadingBox = root.querySelector<HTMLElement>("[data-page-loading]");
  
    if (!loadingBox) {
      return;
    }
  
    loadingBox.textContent = loading ? message : "";
    loadingBox.hidden = !loading;
  }