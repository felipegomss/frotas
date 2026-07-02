import { redirect } from "next/navigation";

// The app entry: send users to the fleet (which bounces to /login if no session).
export default function Home() {
  redirect("/veiculos");
}
