import { forwardRef } from "react";
import { Text3D } from "@react-three/drei";

/* SectionTitle component will take the following props:
--Children: Title text
--Props: Other title properties (e.g. position of group containing SectionTitle) 
and it will return the 3D text containing the "children" (title text) against white background */
export const SectionTitle = forwardRef(({ children, ...props }, ref) => {
  return (
    <Text3D ref={ref} font={"fonts/Inter_Bold.json"} size={0.3} {...props}>
      {children}
      <meshStandardMaterial color={0xdcdcdc} />
    </Text3D>
  );
});

SectionTitle.displayName = "SectionTitle";
