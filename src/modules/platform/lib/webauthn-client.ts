"use client";

export function isWebAuthnSupported(): boolean {
  return (
    typeof window !== "undefined" &&
    typeof window.PublicKeyCredential !== "undefined" &&
    typeof navigator !== "undefined" &&
    Boolean(navigator.credentials?.create) &&
    Boolean(navigator.credentials?.get)
  );
}

export function base64UrlToUint8Array(base64Url: string): Uint8Array {
  const padded = base64Url.replace(/-/g, "+").replace(/_/g, "/") +
    "=".repeat((4 - (base64Url.length % 4)) % 4);
  const raw = window.atob(padded);
  const bytes = new Uint8Array(raw.length);
  for (let i = 0; i < raw.length; i += 1) {
    bytes[i] = raw.charCodeAt(i);
  }
  return bytes;
}

export function bufferToBase64Url(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  let binary = "";
  for (let i = 0; i < bytes.byteLength; i += 1) {
    binary += String.fromCharCode(bytes[i]!);
  }
  return window
    .btoa(binary)
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/g, "");
}

function toArrayBuffer(bytes: Uint8Array): ArrayBuffer {
  return bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength) as ArrayBuffer;
}

export async function registerPlatformPasskeyClient(deviceName: string) {
  if (!isWebAuthnSupported()) {
    throw new Error("Passkeys (WebAuthn) are not supported in this browser or context.");
  }

  const chalRes = await fetch("/api/platform/auth/passkey/challenge", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ purpose: "register" }),
  });
  const chalJson = await chalRes.json();
  if (!chalRes.ok || !chalJson.success) {
    throw new Error(chalJson?.error?.message || "Failed to initiate passkey registration.");
  }

  const credential = (await navigator.credentials.create({
    publicKey: {
      challenge: toArrayBuffer(base64UrlToUint8Array(chalJson.challenge)),
      rp: chalJson.rp,
      user: {
        id: toArrayBuffer(base64UrlToUint8Array(chalJson.user.id)),
        name: chalJson.user.name,
        displayName: chalJson.user.displayName,
      },
      pubKeyCredParams: [
        { type: "public-key", alg: -7 },
        { type: "public-key", alg: -257 },
      ],
      authenticatorSelection: {
        residentKey: "preferred",
        userVerification: "required",
      },
      excludeCredentials: (chalJson.excludeCredentials || []).map(
        (c: { id: string; transports?: AuthenticatorTransport[] }) => ({
          type: "public-key" as const,
          id: toArrayBuffer(base64UrlToUint8Array(c.id)),
          transports: c.transports,
        }),
      ),
      timeout: 60000,
      attestation: "none",
    },
  })) as PublicKeyCredential | null;

  if (!credential) {
    throw new Error("Passkey registration was cancelled.");
  }

  const attResp = credential.response as AuthenticatorAttestationResponse & {
    getPublicKey?: () => ArrayBuffer | null;
    getPublicKeyAlgorithm?: () => number;
  };

  const publicKeyBuffer = attResp.getPublicKey?.();
  if (!publicKeyBuffer) {
    throw new Error(
      "This browser did not expose the WebAuthn SPKI public key. Please use Chrome, Edge, or Safari.",
    );
  }

  const regRes = await fetch("/api/platform/auth/passkey/register", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      challengeToken: chalJson.challengeToken,
      credentialId: credential.id,
      publicKeySpki: bufferToBase64Url(publicKeyBuffer),
      algorithm: attResp.getPublicKeyAlgorithm?.() ?? -7,
      deviceName: deviceName.trim() || "Company Admin Passkey",
      clientDataJSON: bufferToBase64Url(attResp.clientDataJSON),
    }),
  });
  const regJson = await regRes.json();
  if (!regRes.ok || !regJson.success) {
    throw new Error(regJson?.error?.message || "Failed to save passkey.");
  }
  return regJson;
}

export async function authenticatePlatformPasskeyClient(email?: string) {
  if (!isWebAuthnSupported()) {
    throw new Error("Passkeys (WebAuthn) are not supported in this browser.");
  }

  const chalRes = await fetch("/api/platform/auth/passkey/challenge", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      purpose: "authenticate",
      email: email?.trim() || "",
    }),
  });
  const chalJson = await chalRes.json();
  if (!chalRes.ok || !chalJson.success) {
    throw new Error(chalJson?.error?.message || "Unable to start passkey challenge.");
  }

  const credential = (await navigator.credentials.get({
    publicKey: {
      challenge: toArrayBuffer(base64UrlToUint8Array(chalJson.challenge)),
      rpId: chalJson.rpId,
      allowCredentials: (chalJson.allowCredentials || []).map(
        (c: { id: string; transports?: AuthenticatorTransport[] }) => ({
          type: "public-key" as const,
          id: toArrayBuffer(base64UrlToUint8Array(c.id)),
          transports: c.transports,
        }),
      ),
      userVerification: "required",
      timeout: 60000,
    },
  })) as PublicKeyCredential | null;

  if (!credential) {
    throw new Error("Passkey verification was cancelled.");
  }

  const assertResp = credential.response as AuthenticatorAssertionResponse;

  const verifyRes = await fetch("/api/platform/auth/passkey/verify", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      challengeToken: chalJson.challengeToken,
      credentialId: credential.id,
      clientDataJSON: bufferToBase64Url(assertResp.clientDataJSON),
      authenticatorData: bufferToBase64Url(assertResp.authenticatorData),
      signature: bufferToBase64Url(assertResp.signature),
    }),
  });
  const verifyJson = await verifyRes.json();
  if (!verifyRes.ok || !verifyJson.success) {
    throw new Error(verifyJson?.error?.message || "Passkey verification failed.");
  }
  return verifyJson;
}
