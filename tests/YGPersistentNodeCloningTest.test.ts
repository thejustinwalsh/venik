import { afterEach, beforeEach, describe, expect, test } from "vitest";
import { Config, Direction, Display, Node, PositionType } from "../src/index.ts";

type OnClone = (oldNode: Node, owner: Node, childIndex: number) => void;

describe("YGPersistentNodeCloningTest", () => {
  // C++ frees the node in ~NodeWrapper when the last shared_ptr goes away.
  // There are no destructors here, so every wrapper is recorded and its node is
  // freed when the test is torn down.
  let wrappers: NodeWrapper[] = [];

  class NodeWrapper {
    node: Node;
    children: NodeWrapper[];

    private constructor(node: Node, children: NodeWrapper[]) {
      this.node = node;
      this.children = children;
      this.node.context = this;
      wrappers.push(this);
    }

    // NodeWrapper(YGConfigRef config, std::vector<std::shared_ptr<NodeWrapper>> children = {})
    static create(config: Config, children: NodeWrapper[] = []): NodeWrapper {
      const wrapper = new NodeWrapper(new Node(config), children);

      const privateNode = wrapper.node;
      for (const child of wrapper.children) {
        const privateChild = child.node;
        // Claim first ownership of not yet owned nodes, to avoid immediately
        // cloning them
        if (child.node.owner === null) {
          privateChild.owner = privateNode;
        }
        // yoga::Node::insertChild: does not touch the owner of the child
        privateNode.insertChildRaw(privateChild, privateNode.getChildCount());
      }
      return wrapper;
    }

    // Clone, with current children, for mutation
    // NodeWrapper(const NodeWrapper& other)
    static clone(other: NodeWrapper): NodeWrapper {
      const wrapper = new NodeWrapper(other.node.clone(), [...other.children]);

      const privateNode = wrapper.node;
      privateNode.owner = null;
      return wrapper;
    }

    // Clone, with new children
    // NodeWrapper(const NodeWrapper& other, std::vector<std::shared_ptr<NodeWrapper>> children)
    static cloneWithChildren(other: NodeWrapper, children: NodeWrapper[]): NodeWrapper {
      const wrapper = new NodeWrapper(other.node.clone(), children);

      const privateNode = wrapper.node;
      privateNode.owner = null;
      privateNode.setChildrenRaw([]);
      privateNode.setDirty(true);

      for (const child of wrapper.children) {
        const privateChild = child.node;
        // Claim first ownership of not yet owned nodes, to avoid immediately
        // cloning them
        if (child.node.owner === null) {
          privateChild.owner = privateNode;
        }
        // yoga::Node::insertChild: does not touch the owner of the child
        privateNode.insertChildRaw(privateChild, privateNode.getChildCount());
      }
      return wrapper;
    }
  }

  // ConfigWrapper
  function newConfigWithCloneNodeFunc(): Config {
    const config = new Config();
    config.setCloneNodeFunc((oldNode, owner, childIndex) => {
      onClone(oldNode, owner, childIndex);
      const wrapper = owner.context as NodeWrapper;
      const old = oldNode.context as NodeWrapper;

      const clone = NodeWrapper.clone(old);
      wrapper.children[childIndex] = clone;
      return clone.node;
    });
    return config;
  }

  let config: Config;
  let onClone: OnClone;

  beforeEach(() => {
    wrappers = [];
    config = newConfigWithCloneNodeFunc();
    onClone = () => {};
  });

  afterEach(() => {
    for (const wrapper of wrappers) {
      wrapper.node.free();
    }
    config.free();
  });

  test("changing_sibling_height_does_not_clone_neighbors", () => {
    // <ScrollView>
    //   <View id="Sibling" style={{ height: 1 }} />
    //   <View id="A" style={{ height: 1 }}>
    //     <View id="B">
    //       <View id="C">
    //         <View id="D"/>
    //       </View>
    //     </View>
    //   </View>
    // </ScrollView>

    const sibling = NodeWrapper.create(config);
    sibling.node.setHeight(1);

    const d = NodeWrapper.create(config);
    const c = NodeWrapper.create(config, [d]);
    const b = NodeWrapper.create(config, [c]);
    const a = NodeWrapper.create(config, [b]);
    a.node.setHeight(1);

    const scrollContentView = NodeWrapper.create(config, [sibling, a]);
    scrollContentView.node.setPositionType(PositionType.Absolute);

    const scrollView = NodeWrapper.create(config, [scrollContentView]);
    scrollView.node.setWidth(100);
    scrollView.node.setHeight(100);

    // We don't expect any cloning during the first layout
    onClone = () => {
      expect.unreachable("unexpected clone during the first layout");
    };

    scrollView.node.calculateLayout(undefined, undefined, Direction.LTR);

    const siblingPrime = NodeWrapper.create(config);
    siblingPrime.node.setHeight(2);

    const scrollContentViewPrime = NodeWrapper.cloneWithChildren(scrollContentView, [
      siblingPrime,
      a,
    ]);
    const scrollViewPrime = NodeWrapper.cloneWithChildren(scrollView, [scrollContentViewPrime]);

    const nodesCloned: NodeWrapper[] = [];
    // We should only need to clone "A"
    onClone = (oldNode, _owner, _childIndex) => {
      nodesCloned.push(oldNode.context as NodeWrapper);
    };

    scrollViewPrime.node.calculateLayout(undefined, undefined, Direction.LTR);

    expect(nodesCloned.length).toBe(1);
    expect(nodesCloned[0]).toBe(a);
  });

  test("clone_leaf_display_contents_node", () => {
    // <View id="A">
    //   <View id="B" style={{ display: 'contents' }} />
    // </View>

    const b = NodeWrapper.create(config);
    const a = NodeWrapper.create(config, [b]);
    b.node.setDisplay(Display.Contents);

    // We don't expect any cloning during the first layout
    onClone = () => {
      expect.unreachable("unexpected clone during the first layout");
    };

    a.node.calculateLayout(undefined, undefined, Direction.LTR);

    const aPrime = NodeWrapper.create(config, [b]);

    const nodesCloned: NodeWrapper[] = [];
    // We should clone "C"
    onClone = (oldNode, _owner, _childIndex) => {
      nodesCloned.push(oldNode.context as NodeWrapper);
    };

    aPrime.node.calculateLayout(100, 100, Direction.LTR);

    expect(nodesCloned.length).toBe(1);
    expect(nodesCloned[0]).toBe(b);
  });
});
