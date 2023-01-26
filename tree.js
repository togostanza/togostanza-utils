import * as d3 from "d3";

export function asTree(
  data,
  {
    idKey = "id",
    parentKey = "parent",
    childrenKey = "children",
    labelKey = "label",
    valueKey = "value",
  } = {}
) {
  // NOTE: If 'children' and 'parent' in the given data are inconsistent, this function returns unexpected results.
  const parentMap = new Map();

  for (const node of data) {
    const parent = node[parentKey];
    const children = node[childrenKey];
    const id = node[idKey];
    if (parent) {
      parentMap.set(id, parent);
    }
    if (children) {
      for (const child of children) {
        parentMap.set(child, id);
      }
    }
  }

  return data.map((node) => {
    const id = node[idKey];
    const parent = parentMap.get(id);
    const children = [];
    for (const [key, value] of parentMap.entries()) {
      if (value === id) {
        children.push(key);
      }
    }

    return {
      id,
      parent,
      children,
      label: node[labelKey],
      value: node[valueKey],
    };
  });
}

export function asD3Hierarchy(
  tree,
  { rootId = undefined, pseudoRootId = "PSEUDO_ROOT" } = {}
) {
  let subTree = tree;
  if (rootId !== undefined) {
    subTree = selectSubTree(tree, rootId);
  }

  const rootCandidates = subTree.filter((node) => node.parent === undefined);
  if (rootCandidates.length > 1) {
    const pseudoRoot = {
      id: pseudoRootId,
      children: rootCandidates.map((node) => node.id),
    };
    // TODO Stop making destructive node changes.
    for (const node of rootCandidates) {
      node.parent = pseudoRootId;
    }

    subTree.push(pseudoRoot);
  }

  const data = d3
    .stratify()
    .id((node) => node.id)
    .parentId((node) => node.parent)(subTree);

  return d3.hierarchy(data);
}

function descendantIds(tree, rootId) {
  const root = tree.find((node) => node.id === rootId);
  return [
    root.id,
    ...root.children.flatMap((childId) => descendantIds(tree, childId)),
  ];
}

export function selectSubTree(tree, rootId) {
  const ids = descendantIds(tree, rootId);
  return ids.map((id) => tree.find((node) => node.id === id));
}