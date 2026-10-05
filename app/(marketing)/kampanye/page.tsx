import type { Metadata } from "next";
import { PublicCampaignCard } from "@/components/marketing/campaign-card";
import { ContactCta } from "@/components/marketing/contact-cta";
import { Container, Section } from "@/components/marketing/section";
import { SignupCta } from "@/components/marketing/signup-cta";
import { sortCatalog } from "@/lib/campaigns/open";
import { listPublicCampaigns } from "@/lib/marketing/campaigns";

/**
 * FR-M15-09: re-read the list at most every five minutes. The page stays a
 * cached, indexable document, and a new or exhausted campaign still shows up
 * soon enough for someone deciding whether to sign up.
 */
export const revalidate = 300;

const DESCRIPTION =
  "Kampanye klip yang lagi buka di Kalimantan: tarif per 1.000 views, batas honor, platform, dan sisa anggarannya. Daftar gratis untuk baca brief lengkap dan mulai gabung.";

export const metadata: Metadata = {
  title: "Kampanye yang Lagi Buka",
  description: DESCRIPTION,
  alternates: { canonical: "/kampanye" },
  openGraph: {
    title: "Kampanye yang Lagi Buka",
    description: DESCRIPTION,
    url: "/kampanye",
    type: "website",
    locale: "id_ID",
  },
};

export default async function PublicCatalogPage() {
  const campaigns = await listPublicCampaigns();
  // Campaigns that can still pay come first: an exhausted one is shown so
  // the list stays honest, but it is not what a visitor is looking for.
  const sorted = campaigns
    ? [
        ...sortCatalog(
          campaigns.filter((campaign) => !campaign.budget_exhausted),
          "terbaru",
        ),
        ...sortCatalog(
          campaigns.filter((campaign) => campaign.budget_exhausted),
          "terbaru",
        ),
      ]
    : null;

  return (
    <>
      <section className="border-b bg-brand-panel text-brand-panel-foreground">
        <Container className="py-12 lg:py-16">
          <p className="text-sm font-medium text-brand-panel-muted">Katalog kampanye</p>
          <h1 className="mt-3 text-3xl leading-tight font-semibold tracking-tight text-balance sm:text-4xl">
            Kampanye yang lagi buka
          </h1>
          <p className="mt-4 max-w-[60ch] text-base text-pretty text-brand-panel-muted">
            {DESCRIPTION}
          </p>
          <div className="mt-7">
            <SignupCta tone="brand" />
          </div>
        </Container>
      </section>

      <Section>
        {sorted === null ? (
          <p className="rounded-xl border bg-card p-5 text-sm text-muted-foreground">
            Daftar kampanye lagi nggak bisa dimuat. Coba buka lagi beberapa menit lagi.
          </p>
        ) : sorted.length ? (
          <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {sorted.map((campaign) => (
              <li key={campaign.id} className="flex">
                <PublicCampaignCard campaign={campaign} />
              </li>
            ))}
          </ul>
        ) : (
          <div className="rounded-xl border bg-card p-5 text-sm">
            <p className="font-medium">Belum ada kampanye yang buka saat ini.</p>
            <p className="mt-1 text-muted-foreground">
              Daftar dulu aja, biar kamu siap gabung begitu kampanye baru muncul.
            </p>
          </div>
        )}

        <p className="mt-8 max-w-[65ch] text-sm text-pretty text-muted-foreground">
          Brief lengkap, hal yang wajib dan dilarang, serta materi video bisa kamu lihat setelah
          daftar dan masuk ke portal kliper. Honor dihitung dari views yang lolos cek tim, sampai
          anggaran kampanye habis.
        </p>
      </Section>

      <Section
        tone="muted"
        eyebrow="Untuk pemilik kampanye"
        title="Mau kampanye Anda tampil di sini?"
        description="Brand bisnis, UMKM, instansi, maupun personal bisa pasang kampanye. Hubungi tim untuk menyepakati materi, anggaran, dan tarif per 1.000 views."
        action={<ContactCta intent="client" whatsappLabel="Pasang kampanye" />}
      />
    </>
  );
}
