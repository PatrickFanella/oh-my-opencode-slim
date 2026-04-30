declare module '@opentui/solid' {
  export namespace JSX {
    type Element = unknown;
  }

  export function createElement(tag: string): unknown;
  export function insert(node: unknown, child: unknown): void;
  export function setProp(node: unknown, key: string, value: unknown): void;
}
