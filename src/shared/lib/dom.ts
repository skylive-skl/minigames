interface ElementOptions {
  readonly className?: string;
  readonly text?: string;
  readonly attributes?: Readonly<Record<string, string>>;
  readonly children?: readonly Node[];
  readonly onClick?: (event: MouseEvent) => void;
}

export function createElement<K extends keyof HTMLElementTagNameMap>(
  tag: K,
  options?: ElementOptions,
): HTMLElementTagNameMap[K] {
  const element = document.createElement(tag);

  if (options?.className !== undefined) {
    element.className = options.className;
  }

  if (options?.text !== undefined) {
    element.textContent = options.text;
  }

  if (options?.attributes !== undefined) {
    for (const [name, value] of Object.entries(options.attributes)) {
      element.setAttribute(name, value);
    }
  }

  if (options?.children !== undefined) {
    element.append(...options.children);
  }

  if (options?.onClick !== undefined) {
    const onClick = options.onClick;
    element.addEventListener('click', (event) => {
      onClick(event as MouseEvent);
    });
  }

  return element;
}

const SVG_NAMESPACE = 'http://www.w3.org/2000/svg';

export function createSvgElement(
  tag: string,
  attributes?: Readonly<Record<string, string>>,
): SVGElement {
  const element = document.createElementNS(SVG_NAMESPACE, tag);

  if (attributes !== undefined) {
    for (const [name, value] of Object.entries(attributes)) {
      element.setAttribute(name, value);
    }
  }

  return element;
}
