/** Light tap feedback on supported mobile browsers */
export function hapticTap(): void {
  try {
    navigator.vibrate?.(12);
  } catch {
    /* unsupported */
  }
}

export function hapticSuccess(): void {
  try {
    navigator.vibrate?.([18, 40, 22]);
  } catch {
    /* unsupported */
  }
}
