(() => {
  const prompts = [...document.querySelectorAll("#reviewQueueItems .review-prompt")];
  prompts.forEach((prompt) => {
    prompt.addEventListener("toggle", () => {
      if (!prompt.open) return;
      prompts.forEach((other) => {
        if (other !== prompt) other.open = false;
      });
    });
  });
})();
