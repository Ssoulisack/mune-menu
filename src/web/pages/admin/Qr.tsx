import { useEffect, useRef, useState } from "react";
import QRCode from "qrcode";
import type { PublicMenu } from "../../../shared/types";
import { useFetch } from "../../lib/useFetch";
import { Button, Card, Field, Input, PageTitle } from "../../components/ui";

export default function Qr() {
  // The public menu gives the theme that's live right now (including seasons).
  const { data: menu } = useFetch<PublicMenu>("/api/public/menu");
  const [url, setUrl] = useState(`${location.origin}/`);
  const [caption, setCaption] = useState("ສະແກນເພື່ອເບິ່ງເມນູ · Scan for menu");
  const [dataUrl, setDataUrl] = useState<string | null>(null);
  const [copied, setCopied] = useState<"ok" | "failed" | null>(null);
  const linkRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!copied) return;
    const id = setTimeout(() => setCopied(null), 2000);
    return () => clearTimeout(id);
  }, [copied]);

  async function copyLink() {
    try {
      await navigator.clipboard.writeText(url);
      setCopied("ok");
    } catch {
      // Clipboard blocked (e.g. not allowed in this browser): select the link so it can be copied by hand.
      linkRef.current?.select();
      setCopied("failed");
    }
  }

  useEffect(() => {
    QRCode.toDataURL(url || " ", { width: 1024, margin: 2, errorCorrectionLevel: "M" })
      .then(setDataUrl)
      .catch(() => setDataUrl(null));
  }, [url]);

  return (
    <>
      <div className="no-print">
        <PageTitle>QR code</PageTitle>
        <div>
          <Card className="space-y-4">
            <Field
              label="Menu link"
              hint={copied === "failed" ? "Couldn't copy automatically. The link is selected, so press Ctrl/⌘ + C." : "Share it in chats or on social media, or put it on your website."}
            >
              <div className="flex gap-2">
                <Input ref={linkRef} value={url} onChange={(e) => setUrl(e.target.value)} className="min-w-0 flex-1" />
                <Button type="button" variant="secondary" onClick={copyLink} disabled={!url.trim()} className="shrink-0">
                  {copied === "ok" ? "Copied ✓" : "Copy link"}
                </Button>
              </div>
            </Field>
            <Field label="Caption on the printed card">
              <Input value={caption} onChange={(e) => setCaption(e.target.value)} />
            </Field>
            <div className="flex flex-wrap gap-2">
              {dataUrl && (
                <a href={dataUrl} download="menu-qr.png">
                  <Button type="button">Download PNG</Button>
                </a>
              )}
              <Button type="button" variant="secondary" onClick={() => window.print()}>
                Print table card
              </Button>
            </div>
          </Card>
        </div>
      </div>

      {/* Preview on screen; the only thing printed (A6-sized card). */}
      <div className="mt-6 print:mt-0">
        <div className="mx-auto flex w-[105mm] flex-col items-center rounded-2xl bg-white p-[8mm] text-center shadow-sm ring-1 ring-stone-200 print:shadow-none print:ring-0">
          <div className="text-xl font-bold" style={{ color: menu?.theme.primary }}>
            {menu?.settings.restaurantName}
          </div>
          {dataUrl && <img src={dataUrl} alt="Menu QR code" className="my-3 w-[70mm]" />}
          <div className="text-base font-medium">{caption}</div>
        </div>
      </div>
    </>
  );
}
