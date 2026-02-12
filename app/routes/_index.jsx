import { redirect } from "@remix-run/node";

export const loader = async () => {
  // Si quelqu'un arrive sur /, redirige vers /app
  return redirect("/app");
};

export default function Index() {
  return null;
}