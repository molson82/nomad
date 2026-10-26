import type { Metadata } from "next";
import { TuningPage } from "@/components/tuning/tuning-page";

export const metadata: Metadata = { title: "Tuning" };

export default function Tuning() {
  return <TuningPage />;
}
