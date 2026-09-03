import { getSystemSettings } from "@/lib/config";
import NavbarClient from "./NavbarClient";

export default async function Navbar() {
  const settings = await getSystemSettings();

  return (
    <NavbarClient
      brandName={settings.appName}
      slogan={settings.appSlogan}
    />
  );
}
