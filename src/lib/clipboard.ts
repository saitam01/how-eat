export interface CopyResult {
  ok: boolean;
  method: 'clipboard' | 'execCommand' | 'manual';
}

function fallbackExecCommand(text: string): boolean {
  const ta = document.createElement('textarea');
  ta.value = text;
  ta.setAttribute('readonly', '');
  ta.style.position = 'absolute';
  ta.style.left = '-9999px';
  document.body.appendChild(ta);
  ta.select();
  ta.setSelectionRange(0, text.length);
  let ok = false;
  try {
    ok = document.execCommand('copy');
  } catch {
    ok = false;
  }
  document.body.removeChild(ta);
  return ok;
}

export async function copyToClipboard(text: string): Promise<CopyResult> {
  const secure =
    typeof window !== 'undefined' && window.isSecureContext === true && !!navigator.clipboard?.writeText;
  if (secure) {
    try {
      await navigator.clipboard.writeText(text);
      return { ok: true, method: 'clipboard' };
    } catch {
      /* fall through */
    }
  }
  if (fallbackExecCommand(text)) return { ok: true, method: 'execCommand' };
  return { ok: false, method: 'manual' };
}
