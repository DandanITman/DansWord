type PromptRequest = {
  message: string;
  defaultValue: string;
  resolve: (value: string | null) => void;
};

type AlertRequest = {
  message: string;
  resolve: () => void;
};

type ConfirmRequest = {
  message: string;
  resolve: (value: boolean) => void;
};

type PromptHost = {
  prompt: (request: PromptRequest) => void;
  alert: (request: AlertRequest) => void;
  confirm: (request: ConfirmRequest) => void;
};

let host: PromptHost | null = null;

export function registerUiPromptHost(next: PromptHost | null) {
  host = next;
}

function useNativeDialogs() {
  return (
    typeof document !== 'undefined' &&
    document.documentElement.getAttribute('data-test-mode') === 'true'
  );
}

export function uiPrompt(message: string, defaultValue = ''): Promise<string | null> {
  if (useNativeDialogs()) {
    return Promise.resolve(window.prompt(message, defaultValue));
  }
  if (!host) {
    return Promise.resolve(window.prompt(message, defaultValue));
  }
  return new Promise((resolve) => {
    host!.prompt({ message, defaultValue, resolve });
  });
}

export function uiAlert(message: string): Promise<void> {
  if (useNativeDialogs()) {
    window.alert(message);
    return Promise.resolve();
  }
  if (!host) {
    window.alert(message);
    return Promise.resolve();
  }
  return new Promise((resolve) => {
    host!.alert({ message, resolve });
  });
}

export function uiConfirm(message: string): Promise<boolean> {
  if (useNativeDialogs()) {
    return Promise.resolve(window.confirm(message));
  }
  if (!host) {
    return Promise.resolve(window.confirm(message));
  }
  return new Promise((resolve) => {
    host!.confirm({ message, resolve });
  });
}

export type { PromptRequest, AlertRequest, ConfirmRequest };
