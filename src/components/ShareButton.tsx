import { useState } from 'react';
import { copyToClipboard } from '@/lib/clipboard';
import { Button } from '@/components/ui/button';
import { toast } from '@/lib/toast';
import i18n from '@/i18n/es.json';

export interface ShareButtonProps {
  url: string;
  disabled: boolean;
  onCopied?: (method: 'clipboard' | 'execCommand' | 'manual') => void;
}

export function ShareButton({ url, disabled, onCopied }: ShareButtonProps) {
  const [copying, setCopying] = useState(false);

  const handleClick = async () => {
    if (disabled || copying) return;
    setCopying(true);
    try {
      const res = await copyToClipboard(url);
      if (res.method === 'manual') toast(i18n.manualCopy);
      else toast(i18n.copied);
      onCopied?.(res.method);
    } finally {
      setCopying(false);
    }
  };

  return (
    <Button
      onClick={handleClick}
      disabled={disabled}
      title={disabled ? i18n.shareDisabled : undefined}
      className="mt-3 w-full"
    >
      {i18n.copyLink}
    </Button>
  );
}
