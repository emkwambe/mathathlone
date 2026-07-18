# Secret Generation Reference

> **Environment:** All commands are written for **Windows PowerShell**.

---

## Generating a Cryptographically Secure Secret

Use this command any time you need to generate a secure random secret — for example, when setting `HEAT_ROOM_SECRET`, API signing keys, or any other shared secret between services.

```powershell
[System.Convert]::ToBase64String([System.Security.Cryptography.RandomNumberGenerator]::GetBytes(32))
```

### How it works

| Component | Description |
|---|---|
| `[System.Security.Cryptography.RandomNumberGenerator]::GetBytes(32)` | Generates 32 cryptographically random bytes using the OS-level secure random number generator. This is equivalent to `openssl rand -bytes 32` on Linux/macOS. |
| `[System.Convert]::ToBase64String(...)` | Encodes the 32 random bytes as a Base64 string, producing a 44-character alphanumeric secret safe to use in environment variables and HTTP headers. |

**Example output:**
```
xK9mP2qLrT8nVwJhYdF3oQeZbCuA1sGi4RlMpXvNtHk=
```

### When to use this

| Secret | Where it is used |
|---|---|
| `HEAT_ROOM_SECRET` | Shared between the Next.js app and the Cloudflare Worker to authenticate heat provisioning requests |
| Any future API signing key | Same command — just change the byte count if you need a longer key (e.g. `GetBytes(64)` for a 512-bit key) |

### How to set it in Cloudflare (PowerShell)

```powershell
# Step 1: Generate the secret and copy the output
[System.Convert]::ToBase64String([System.Security.Cryptography.RandomNumberGenerator]::GetBytes(32))

# Step 2: Set it as a Cloudflare Worker secret
cd C:\Users\HP\Documents\mathathlone-app\workers\heat-room
npx wrangler secret put HEAT_ROOM_SECRET
# Paste the generated string when prompted, then press Enter
```

### How to set it in Vercel

1. Go to **vercel.com** → your project → **Settings** → **Environment Variables**
2. Add `HEAT_ROOM_SECRET` with the **exact same value** used in the Cloudflare secret above
3. Select **All Environments** and click **Save**
4. Redeploy the app to pick up the new variable

> **Important:** The value in Cloudflare and the value in Vercel **must be identical**. If they differ, the Next.js API route will receive a 401 Unauthorized error when trying to provision a HeatRoom.

---

## Other Useful Secret Generation Variants

```powershell
# 64-byte (512-bit) secret — for higher-security use cases
[System.Convert]::ToBase64String([System.Security.Cryptography.RandomNumberGenerator]::GetBytes(64))

# Hex-encoded 32-byte secret (no padding characters)
[System.BitConverter]::ToString(
  [System.Security.Cryptography.RandomNumberGenerator]::GetBytes(32)
).Replace("-", "").ToLower()
```
