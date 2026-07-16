type UnauthorizedHandler = () => void;

let handler: UnauthorizedHandler | null = null;
let isHandlingUnauthorized = false;
let suppressUnauthorizedHandling = false;

export function registerUnauthorizedHandler(
  nextHandler: UnauthorizedHandler | null,
): void {
  handler = nextHandler;
}

export function suppressUnauthorizedNotifications(suppressed: boolean): void {
  suppressUnauthorizedHandling = suppressed;
}

export function notifyUnauthorized(): void {
  if (
    suppressUnauthorizedHandling ||
    isHandlingUnauthorized ||
    handler === null
  ) {
    return;
  }

  isHandlingUnauthorized = true;
  handler();
}

export function resetUnauthorizedHandling(): void {
  isHandlingUnauthorized = false;
}
