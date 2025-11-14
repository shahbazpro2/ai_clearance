import { useEffect, useRef } from "react";

/**
 * A hook that runs an effect only on updates, not on the initial mount.
 * This is useful when you want to skip the first render and only run
 * the effect when dependencies change after the initial mount.
 *
 * @param effect - The effect function to run
 * @param deps - The dependency array
 */
export function useUpdateEffect(
  effect: React.EffectCallback,
  deps?: React.DependencyList
) {
  const isFirstRender = useRef(true);

  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }

    return effect();
  }, deps);
}
