// src/services/resultService.ts
export function saveResultLocally(result: any) {
  localStorage.setItem('lastResult', JSON.stringify(result));
}
