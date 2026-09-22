export interface Component {
  readonly element: HTMLElement;
  destroy?(): void;
}
