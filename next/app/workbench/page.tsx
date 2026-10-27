import type { Metadata } from "next";
import { Navigation } from "@/components/navigation";
import { AnalysisWorkbench } from "@/components/analysis-workbench";
import "./workbench.css";
export const metadata: Metadata = {
  title: "Analysis workbench | Lucent",
  description:
    "Compare ResNet50 and DenseNet121 chest X-ray finding scores and inspect Grad-CAM model attention.",
};
export default function WorkbenchPage() {
  return (
    <>
      <a className="skip-link" href="#main">
        Skip to content
      </a>
      <Navigation />
      <main id="main">
        <AnalysisWorkbench />
      </main>
    </>
  );
}
