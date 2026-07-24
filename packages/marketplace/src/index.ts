import { createHmac, randomBytes } from "node:crypto";
import { z } from "zod";

export const marketplacePackageSchema = z.object({
  id: z.string(),
  name: z.string(),
  version: z.string(),
  type: z.enum(["adapter", "workflow", "guardrail"]),
  signature: z.string().optional(),
  payload: z.record(z.unknown()),
});

export type MarketplacePackage = z.infer<typeof marketplacePackageSchema>;

export class MarketplaceRegistry {
  private packages = new Map<string, MarketplacePackage>();
  private publicKey?: string;

  constructor(publicKey?: string) {
    this.publicKey = publicKey;
  }

  install(pkg: MarketplacePackage): void {
    marketplacePackageSchema.parse(pkg);
    if (pkg.signature && !this.verify(pkg)) {
      throw new Error("Invalid package signature");
    }
    this.packages.set(pkg.id, pkg);
  }

  list(): MarketplacePackage[] {
    return [...this.packages.values()];
  }

  get(id: string): MarketplacePackage | undefined {
    return this.packages.get(id);
  }

  verify(pkg: MarketplacePackage): boolean {
    if (!pkg.signature) return true;
    const secret = this.publicKey ?? process.env.ATOMIC_MARKETPLACE_SECRET ?? "dev-secret";
    const expected = createHmac("sha256", secret)
      .update(JSON.stringify(pkg.payload))
      .digest("hex");
    return pkg.signature === expected;
  }

  sign(pkg: Omit<MarketplacePackage, "signature">, secret = "dev-secret"): MarketplacePackage {
    const signature = createHmac("sha256", secret)
      .update(JSON.stringify(pkg.payload))
      .digest("hex");
    return { ...pkg, signature };
  }
}

export function generatePackageId(): string {
  return `pkg_${randomBytes(8).toString("hex")}`;
}
