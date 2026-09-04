import { getSystemSettings } from "@/lib/config";
import { resolveServerNiche } from "@/lib/server-niche";
import NavbarClient from "./NavbarClient";

export default async function Navbar() {
  const settings = await getSystemSettings();
  const { nicheConfig, activeBrand } = await resolveServerNiche();

  const brandName = activeBrand?.trim() || nicheConfig.brandName || settings.appName;
  const slogan = nicheConfig.slogan || settings.appSlogan;

  return (
    <NavbarClient
      brandName={brandName}
      slogan={slogan}
    />
  );
}
