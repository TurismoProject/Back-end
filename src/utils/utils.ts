export function removeProperty<T, K extends keyof T>(
  arr: T[],
  property: K
): void {
  arr.forEach((obj) => {
    delete obj[property];
  });
}
