import { serviceState } from "@/lib/analysis-server";
export const dynamic = "force-dynamic";
export async function GET() {
  return Response.json(await serviceState(), {
    headers: { "Cache-Control": "no-store" },
  });
}
