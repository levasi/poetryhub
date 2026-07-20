/** Visibility of Citește reel side actions (like / share / open). */
export function useReelChrome() {
  const sideActionsVisible = useState('reel-side-actions-visible', () => false)

  function toggleSideActions() {
    sideActionsVisible.value = !sideActionsVisible.value
  }

  return { sideActionsVisible, toggleSideActions }
}
