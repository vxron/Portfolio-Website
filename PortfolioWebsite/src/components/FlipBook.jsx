// loll make them all like pink and stuff like this super girly and cute make it a girly booklet lol like a princess book
// maybe ur avatar driving a pink tesla, ur avatar as an astronaut in a rocket ship, ur avatar with pink wires for nokia, etc etc
import { pages } from "./FlipBookUI";
import { useRef } from "react";
import { BoxGeometry } from "three";
import { SkinnedMesh } from "three";

const PAGE_WIDTH = 1.28;
const PAGE_HEIGHT = 1.71; // 4:3 aspect ratio
const PAGE_DEPTH = 0.003;
const PAGE_SEGMENTS = 30; // moveable width segments ("skeleton")
const SEGMENT_WIDTH = PAGE_WIDTH / PAGE_SEGMENTS;

// avoid re-renders since all pages will have same geometry
const pageGeometry = new BoxGeometry(
  PAGE_WIDTH,
  PAGE_HEIGHT,
  PAGE_DEPTH,
  PAGE_SEGMENTS,
  2
);

pageGeometry.translate(PAGE_WIDTH / 2, 0, 0);
const position = pageGeometry.attributes.position;
const vertex = new Vector3();
const skinIndexes = [];
const skinWeights = [];

// loop through all vertices
for (let i = 0; i < position.count; i++) {
  vertex.fromBufferAttribute(position, i); // get the vertex
  const x = vertex.x; // get the x pos of the vertex
  const skinIndex = Math.max(0, Math.floor(x / SEGMENT_WIDTH));
  let skinWeight = (x % SEGMENT_WIDTH) / SEGMENT_WIDTH;
  skinIndexes.push(skinIndex, skinIndex + 1, 0, 0);
  skinWeights.push(1 - skinWeight, skinWeight, 0, 0);
}

// add skin weight for each bone (how much does each bone affect each vertex of skinnedmesh)

// Custom Page Component
// Book is achieved using BoxGeometry 3D material
// SkinnedMesh has skeleton with bones so we can animate the vertices of the geometry
const Page = ({ number, front, back, ...props }) => {
  const group = useRef();
  return (
    <group {...props} ref={group}>
      <SkinnedMesh scale={0.1}>
        <primitive object={pageGeometry} attach={"geometry"} />
        <meshBasicMaterial color="red"></meshBasicMaterial>
      </SkinnedMesh>
    </group>
  );
};

// for each page, render "Page" component
export const FlipBook = ({ ...props }) => {
  return (
    <group {...props}>
      {[...pages].map((pageData, page_num) =>
        page_num === 0 ? (
          <Page key={page_num} number={page_num} {...pageData} />
        ) : null
      )}
    </group>
  );
};
