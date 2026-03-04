export function assertSafeToWrite(uri: string) {
  const nodeEnv = process.env.NODE_ENV ?? "development";

  if (nodeEnv === "production") {
    throw new Error("Refusing to run write scripts in production");
  }

  const lower = uri.toLowerCase();

  const looksLocal =
    lower.includes("localhost") ||
    lower.includes("127.0.0.1") ||
    lower.includes("mongodb://mongo");

  const looksTestOrDev =
    lower.includes("test") || lower.includes("dev") || lower.includes("local");

  if (!(looksLocal && looksTestOrDev)) {
    throw new Error(
      `Refusing to run write scripts on suspicious DB. MONGO_URI=${uri}`,
    );
  }
}
