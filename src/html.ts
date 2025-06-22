import {
  type Node,
  parse,
  SyntaxKind,
  walk,
} from '@maxmilton/html-parser/src/index.ts';

// https://html.spec.whatwg.org/multipage/syntax.html#void-elements
const SELF_CLOSING_TAGS = new Set([
  'area',
  'base',
  'br',
  'col',
  'embed',
  'hr',
  'img',
  'input',
  'link',
  'meta',
  'param',
  'source',
  'track',
  'wbr',
  '!doctype',
  '',
  '!',
  '!--',
]);

interface ValidationError {
  message: string;
  details?: unknown;
}

// TODO: Validate attributes.
// TODO: Validate tag names?
// TODO: Validate void elements have no children.

export function validate(html: string): {
  valid: boolean;
  errors: ValidationError[];
  ast: Node[];
} {
  try {
    const errors: ValidationError[] = [];
    const ast = parse(html);
    let hasTags = false;

    walk(ast, {
      enter(node) {
        if (node.type !== SyntaxKind.Tag) return;
        hasTags = true;

        if (node.close === null && !SELF_CLOSING_TAGS.has(node.name)) {
          errors.push({
            message: 'Unclosed tag',
            details: node.open,
          });
        }
      },
    });

    if (ast.length === 0) {
      errors.push({
        message: 'No HTML content found',
      });
      // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
    } else if (!hasTags) {
      errors.push({
        message: 'No tags found',
      });
    }

    return {
      valid: errors.length === 0,
      errors,
      ast,
    };
  } catch (error) {
    return {
      valid: false,
      errors: [{ message: 'Parse error', details: error }],
      ast: [],
    };
  }
}
