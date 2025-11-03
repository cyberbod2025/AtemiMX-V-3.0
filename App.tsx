import AnimatedBackgroundWrapper from "@/components/Layout/AnimatedBackgroundWrapper";
import AppBackground from "@/components/Layout/AppBackground";
import { AppShell } from "./ui/AppShell";

export default function App() {
  return (
    <>
      <AppBackground />
      <AnimatedBackgroundWrapper />
      <AppShell />
    </>
  );
}
