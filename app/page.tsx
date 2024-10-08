import Upload from "@/components/Upload";
import Image from "next/image";
import { Toaster } from "@/components/ui/toaster"


export default function Home() {
  return (
    <main className="flex min-h-screen   ">
      <Upload />
      <Toaster />

    </main>
  );
}
