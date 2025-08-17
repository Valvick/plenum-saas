// app/api/passport/qr/route.ts
import QRCode from "qrcode";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const slug = searchParams.get("slug");
  if (!slug) return new Response("Missing slug", { status: 400 });

  const base = process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000";
  const target = `${base}/p/${encodeURIComponent(slug)}`;

  const png = await QRCode.toBuffer(target, {
    errorCorrectionLevel: "M",
    width: 512,
    margin: 1,
  });

  return new Response(png, {
    headers: {
      "Content-Type": "image/png",
      "Cache-Control": "public, max-age=3600",
    },
  });
}
