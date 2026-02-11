import type { PyodideInterface } from "pyodide";

declare global {
  interface GlobalThis {
    loadPyodide?: (options?: { indexURL?: string }) => Promise<PyodideInterface>;
  }
}

export {};
