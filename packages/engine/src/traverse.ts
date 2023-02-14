import * as t from "@babel/types";

export type Visitor = (node: t.Node) => void;

export function traverse(
  node: t.Node,
  visitor: Visitor,
  visitedNodes?: Set<t.Node>
) {
  if (!visitedNodes) {
    visitedNodes = new Set<t.Node>();
  }

  if (!node || visitedNodes.has(node)) {
    return;
  }
  visitedNodes.add(node);

  visitor(node);

  const keys = t.VISITOR_KEYS[node.type];
  if (!keys) {
    return;
  }
  for (const key of keys) {
    const subNode = (node as any)[key];
    if (Array.isArray(subNode)) {
      for (const sub of subNode) {
        traverse(sub, visitor, visitedNodes);
      }
    } else {
      traverse(subNode, visitor, visitedNodes);
    }
  }
}
