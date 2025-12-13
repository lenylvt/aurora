import { redirect } from "next/navigation";

export default function Home() {
  // Redirect to login if not authenticated
  // For now, redirect directly to login
  redirect("/login");
}
