import type { Metadata } from "next";

import IntroPreview from "./IntroPreview";

export const metadata: Metadata = {
  title: "Предпросмотр Intro — English Platform",
  description: "Пять вариантов первого экрана интерактивного урока.",
};

export default function IntroPreviewPage() {
  return <IntroPreview />;
}
