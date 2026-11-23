export async function copyText(text: string): Promise<void> {
  try {
    await navigator.clipboard.writeText(text);
  } catch {
    const input = document.createElement("textarea");
    input.value = text;
    input.setAttribute("readonly", "");
    input.style.position = "fixed";
    input.style.left = "-9999px";
    const focused = document.activeElement;
    const container = focused?.closest("dialog[open]") ?? document.body;
    container.appendChild(input);
    try {
      input.select();
      if (!document.execCommand("copy")) throw new Error("Clipboard copy failed.");
    } finally {
      input.remove();
      if (focused instanceof HTMLElement) focused.focus();
    }
  }
}
