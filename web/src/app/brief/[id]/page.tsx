import { Suspense } from "react";
import InspectionBrief from "@/components/brief/InspectionBrief";

export const metadata = { title: "Inspection brief — Piper" };

async function Brief({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <InspectionBrief key={id} id={id} />;
}

export default function Page({ params }: { params: Promise<{ id: string }> }) {
  return <Suspense fallback={<p className="p-8" role="status">Loading inspection brief…</p>}><Brief params={params} /></Suspense>;
}
