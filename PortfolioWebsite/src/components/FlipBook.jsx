// THIS FILE HANDLES FLIPBOOK RENDERING

import { useRef, useState, useEffect, useMemo } from "react";
import { BoxGeometry } from "three";
import { useFrame } from "@react-three/fiber";
import { useAtom } from "jotai";
import {
  SkinnedMesh,
  Vector3,
  Bone,
  Color,
  MathUtils,
  MeshStandardMaterial,
  MeshBasicMaterial,
} from "three";
import * as THREE from "three";
import { pageAtom, pages } from "./FlipBookUI";
import { Uint16BufferAttribute, Float32BufferAttribute } from "three";
import { Skeleton } from "three";
import { useHelper } from "@react-three/drei";
import { SkeletonHelper } from "three";
import { degToRad } from "three/src/math/MathUtils.js";
import { useTexture, ContactShadows } from "@react-three/drei";
import { useCursor } from "@react-three/drei";
import { useSpring, a } from "@react-spring/three"; // To smoothly resize flipbook

// play around w these lol
const PAGE_WIDTH = 1.28;
const PAGE_HEIGHT = 1.71;
const PAGE_DEPTH = 0.003;
const PAGE_SEGMENTS = 30; // moveable width segments ("skeleton")
const SEGMENT_WIDTH = PAGE_WIDTH / PAGE_SEGMENTS;
const LERP_FACTOR = 0.05;
const INSIDE_CURVE_STRENGTH = 0.18; // controls inner curve of flipbook
const OUTSIDE_CURVE_STRENGTH = 0.03;

// Have outside to avoid re-renders since all pages will have same geometry
const pageGeometry = new BoxGeometry(
  PAGE_WIDTH,
  PAGE_HEIGHT,
  PAGE_DEPTH,
  PAGE_SEGMENTS,
  2 // height segments
);

pageGeometry.translate(PAGE_WIDTH / 2, 0, 0);

// Get all positions from geometry
const position = pageGeometry.attributes.position;
// Declare a vertex to use in loop
const vertex = new Vector3();
// Array of skin indexes (bones) and associated weights for those indexes
const skinIndexes = [];
const skinWeights = [];

// add skin weight for each bone (how much does each bone affect each vertex of skinnedmesh)
// loop through all positions (vertices)
for (let i = 0; i < position.count; i++) {
  // Copy position from attribute into vertex variable
  vertex.fromBufferAttribute(position, i);
  const x = vertex.x;
  // To find out which bone is affected by this particular position, e.g. near x=0, it will use the first bone
  const skinIndex = Math.max(0, Math.floor(x / SEGMENT_WIDTH));
  // Calculate skinWeight: intensity that this bone is impacting our vertex (0 is no impact; 1 is full impact)
  let skinWeight = (x % SEGMENT_WIDTH) / SEGMENT_WIDTH;
  // Append to arrays (using 2 bones per vertex, one that effects the most, and then 2nd most, don't use last 2)
  skinIndexes.push(skinIndex, skinIndex + 1, 0, 0);
  skinWeights.push(1 - skinWeight, skinWeight, 0, 0);
}

// attach attributes to our geometry
// 4 bones per vertex
pageGeometry.setAttribute(
  "skinIndex",
  new Uint16BufferAttribute(skinIndexes, 4)
);
// float for skin weight since it's a number between 0 and 1
pageGeometry.setAttribute(
  "skinWeight",
  new Float32BufferAttribute(skinWeights, 4)
);
// define page materials, array of 6 materials because our box geometry has 6 faces, so 1 material per face
const whiteColor = new Color("white");

const pageMaterials = [
  new MeshStandardMaterial({
    color: whiteColor,
  }),
  new MeshStandardMaterial({
    color: "#111",
  }),
  new MeshStandardMaterial({
    color: whiteColor,
  }),
  new MeshStandardMaterial({
    color: whiteColor,
  }),
];

// preload front and back of book, which is same texture for now
useTexture.preload(`/exp_images/title-pg.png`);

// Custom Page Component
// Book is achieved using BoxGeometry 3D material
// SkinnedMesh has skeleton with bones so we can animate the vertices of the geometry
const Page = ({ number, front, back, page, opened, bookClosed, ...props }) => {
  // load picture textures for all pages in book
  const [picture_1, picture_2] = useTexture([
    `/exp_images/${front}.png`,
    `/exp_images/${back}.png`,
  ]);

  const group = useRef();
  const skinnedMeshRef = useRef();
  // Create Skinned Mesh within useMemo
  const mySkinnedMesh = useMemo(() => {
    const bones = [];
    // Create bone for all width segments (
    for (let i = 0; i <= PAGE_SEGMENTS; i++) {
      let bone = new Bone();
      bones.push(bone);

      if (i === 0) {
        bone.position.x = 0;
      } else {
        bone.position.x = SEGMENT_WIDTH;
      }
      // if it's not first bone, we attach bone to previous one (child of it)
      if (i > 0) {
        bones[i - 1].add(bone);
      }
    }
    const skeleton = new Skeleton(bones);

    // pageMaterials, plus 2 specific materials for front/back

    const isFrontCover = number === 0;
    const isBackCover = number === pages.length - 1;

    const glossyMaterial = new MeshStandardMaterial({
      map: picture_1,
      roughness: 0.1, // More glossy
      metalness: 0.15,
      emissive: new THREE.Color("white"),
      emissiveIntensity: 0.15,
      toneMapped: false,
    });

    const glossyBackMaterial = new MeshStandardMaterial({
      map: picture_2,
      roughness: 0.1, // More glossy
      metalness: 0.1,
      emissive: new THREE.Color("white"),
      emissiveIntensity: 0.1,
      toneMapped: false,
    });

    const defaultFrontMaterial = new MeshStandardMaterial({
      map: picture_1,
      roughness: 0.8,
      metalness: 0.3,
      emissive: new THREE.Color("white"),
      emissiveIntensity: 0.05,
      toneMapped: false,
    });

    const defaultBackMaterial = new MeshStandardMaterial({
      map: picture_2,
      roughness: 1,
      metalness: 0,
      emissive: new THREE.Color("white"),
      emissiveIntensity: 0.05,
      toneMapped: false,
    });

    const materials = [
      ...pageMaterials,
      isFrontCover || isBackCover ? glossyMaterial : defaultFrontMaterial,
      isFrontCover || isBackCover ? glossyBackMaterial : defaultBackMaterial,
    ];

    const mesh = new SkinnedMesh(pageGeometry, materials);
    mesh.receiveShadow = true;
    mesh.castShadow = true;
    mesh.frustumCulled = false;
    // add root bone to mesh (which contains all the rest)
    mesh.add(skeleton.bones[0]);
    mesh.bind(skeleton);
    return mesh; // return skinned mesh
  }, []);

  //useHelper(skinnedMeshRef, SkeletonHelper, "red");

  useFrame(() => {
    // ensure we have current value
    if (!skinnedMeshRef.current) {
      return;
    }

    // set target rotation for page based on if it's been opened or not (from return of FlipBook in group)
    let targetRotation = opened ? -Math.PI / 2 : Math.PI / 2;
    // increase targetrotation so that pages are all separated once you open book
    if (!bookClosed) {
      targetRotation += degToRad(number * 0.8);
    }

    const bones = skinnedMeshRef.current.skeleton.bones;
    // make the transition smooth between page turns to reach targetRot from current
    // create page flip rotation on all bones
    for (let i = 0; i < bones.length; i++) {
      const target = i === 0 ? group.current : bones[i]; // creating inside curve

      // we need to impact each bone with right amount of strength
      // for flipbook's INSIDE CURVE: (first 8 bones) --> use sin(x*0.2 + 0.25) so that first bone has a bit of rotation, then it'll peak a few bones later, and re-descend
      const insideCurveIntensity = i < 8 ? Math.sin(i * 0.2 + 0.2) : 0;
      const outsideCurveIntensity = i >= 8 ? Math.cos(i * 0.3 + 0.09) : 0; // now we need it to go down and up so use a cos

      let rotationAngle =
        INSIDE_CURVE_STRENGTH * insideCurveIntensity * targetRotation -
        OUTSIDE_CURVE_STRENGTH * outsideCurveIntensity * targetRotation;

      // don't want bent shape when book is closed, only first bone should have target rot
      if (bookClosed) {
        if (i === 0) {
          rotationAngle = targetRotation;
        } else {
          rotationAngle = 0;
        }
      }

      target.rotation.y = MathUtils.lerp(
        target.rotation.y,
        rotationAngle,
        LERP_FACTOR
      );
    }
  });

  return (
    <group {...props} ref={group}>
      <primitive
        object={mySkinnedMesh}
        ref={skinnedMeshRef}
        position-z={-number * PAGE_DEPTH + page * PAGE_DEPTH}
      />
    </group>
  );
};

// for each page, render "Page" component
// need to keep track of which page we're currently on with useAtom
export const FlipBook = ({ setBookOpen, ...props }) => {
  const [page, setPage] = useAtom(pageAtom); // Get global page state
  const [hovered, setHovered] = useState(false); // State for hovering on flipbook
  const [isBookOpen, setIsBookOpen] = useState(false);
  const backgroundRef = useRef();
  useCursor(hovered);

  // Open/Close Animation Constants
  const { position, scale } = useSpring({
    position: isBookOpen ? [0, 0, 0] : [-1.8, 0, 0], // Move to center when open, otherwise to the left
    scale: isBookOpen ? [1.3, 1.3, 1.3] : [1, 1, 1], // Enlarge when open
    config: { tension: 200, friction: 20 },
  });

  // Function to handle events when user clicks on book
  const handleBookClick = (page, setPage) => {
    console.log("CLICK");

    if (!isBookOpen) {
      setIsBookOpen(true);
      setBookOpen(true); // Hide avatar and title
      //setPage(0);
      console.log("isBookOpen:", isBookOpen);
      console.log("page:", page);
      return;
    }
    if (page < pages.length) {
      setPage(page + 1); // Turn to next page
    } else {
      setPage(0); // Reset to cover if at last page
      setIsBookOpen(false);
      setBookOpen(false); // Show avatar and title again
    }
  };

  // Function to handle events when user clicks outside of book
  const handleBackgroundClick = (e) => {
    e.stopPropagation(); // necessary since group w handleBookClick is a child of group w handleBackgroundClick, but click on flipbook should NOT propagate to parent
    console.log("background click");
    console.log("isBookOpen:", isBookOpen);
    console.log("page:", page);
    const clicked = e.object?.name;
    if (clicked === "flipbook") return;
    setPage(0);
    setIsBookOpen(false);
    setBookOpen(false);
  };

  return (
    <group {...props}>
      {/* Background click catcher (ghost plane) */}
      <mesh
        ref={backgroundRef}
        onPointerDown={handleBackgroundClick}
        castShadow={false}
        receiveShadow={false}
        position={[0, 0, -1]} // make sure it's behind the book
        raycast={(...args) => {
          // Make sure mesh exists first
          if (backgroundRef.current) {
            THREE.Mesh.prototype.raycast.call(backgroundRef.current, ...args);
          }
        }}
      >
        <planeGeometry args={[100, 100]} />
        <meshBasicMaterial
          visible={false}
          transparent={true}
          opacity={0}
          depthWrite={false}
        />
      </mesh>
      <a.group
        name="flipbook"
        position={position}
        scale={scale}
        rotation-y={-Math.PI / 2}
        onPointerDown={(e) => {
          e.stopPropagation(); // avoid propagation !!
          handleBookClick(page, setPage);
        }}
        onPointerEnter={() => setHovered(true)}
        onPointerLeave={() => setHovered(false)}
      >
        {[...pages].map((pageData, page_num) => (
          <Page
            key={page_num}
            page={page}
            number={page_num}
            opened={page > page_num}
            bookClosed={page === 0 || page === pages.length}
            {...pageData}
          />
        ))}
        <ContactShadows
          position={[0, -1.1, 1]} // slightly under the book base
          opacity={0.18}
          scale={[32, 16, 32]}
          blur={3.5}
          far={10}
          resolution={1024}
          frames={1}
        />
      </a.group>
    </group>
  );
};
