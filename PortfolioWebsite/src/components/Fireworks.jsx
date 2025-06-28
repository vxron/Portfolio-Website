import { useFireworks } from "../hooks/useFireworks";

export const Fireworks = () => {
  const fireworks = useFireworks((state) => state.fireworks);

  console.log(fireworks);
};
