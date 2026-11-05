import FooterStudies from "./FooterStudies";

export const metadata = {
  title: "Sixteen footer studies — Candor Management",
  robots: { index: false, follow: false },
};

export default async function FootersPage({ searchParams }) {
  const { v } = await searchParams;
  return <FooterStudies initialVariant={Number(v)} />;
}
