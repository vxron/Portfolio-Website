import { useEffect } from "react";
import { useFireworks } from "../hooks/useFireworks";

export const FireworksUI = () => {
  const addFirework = useFireworks((state) => state.addFirework);

  useEffect(() => {
    console.log("FireworksUI mounted – adding firework");
    addFirework({ theme: "classic" });
  }, [addFirework]);

  return null;
};
