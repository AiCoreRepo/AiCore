# ☸️ Kubernetes Cluster Credentials & Infrastructure Notice

> **Service Provider:** ORSCOPE TECHNOLOGIES LLP (IIM Ahmedabad Ventures)  
> **Prepared For:** Rushabh Belani (AI VESTIRE FASHIONTECH LLP)  
> **Date of Provision:** 15-06-2026  
> **Trial Period:** 15-06-2026 10:00 AM IST to 13-07-2026 10:00 AM IST (28 Days)

---

## 🖥️ Server Specifications

| Parameter | Value |
| :--- | :--- |
| **CPU** | 6 vCPU |
| **RAM** | 12 GB |
| **Storage** | 200 GB SSD |
| **Datacenter Location** | Mumbai, India |

---

## 🔑 Access Credentials

| Credential Type | Value |
| :--- | :--- |
| **IP Address** | `94.136.189.250` |
| **Username** | `developer` |
| **Password** | `f7!Kx#2mQvL$9pRn@Wt4&Ys8*Jd6BhZ` |
| **Web Console** | [https://94.136.189.250:9090](https://94.136.189.250:9090) |

> [!NOTE]
> Web Console access is available via Cockpit at port `9090` using the username and password listed above.

---

## 🔒 SSH Authentication (Private Key Only)

SSH authentication is configured to allow login **ONLY** with the private key below.

### 1. Private Key Content
Save the following block as a text file (e.g., `cluster_key.pem` or `keyfile.txt`) on your local machine:

```key
-----BEGIN OPENSSH PRIVATE KEY-----
b3BlbnNzaC1rZXktdjEAAAAABG5vbmUAAAAEbm9uZQAAAAAAAAABAAAAMwAAAAtzc2gtZW
QyNTUxOQAAACC4WnNuXTxOHwKk7dQ/PgNfMFs+lbr2wkrmoE5oGuTmrQAAAJDfp6wJ36es
CQAAAAtzc2gtZWQyNTUxOQAAACC4WnNuXTxOHwKk7dQ/PgNfMFs+lbr2wkrmoE5oGuTmrQ
AAAEArKLEc2k/GesZbUGeOC7j0/kOX3DItdzPt6ZJs4OWFwbhac25dPE4fAqTt1D8+A18w
Wz6VuvbCSuagTmga5OatAAAABm5vbmFtZQECAwQFBgc=
-----END OPENSSH PRIVATE KEY-----
```

### 2. Login Instructions

Follow these steps to connect using your terminal:

1. **Save the key** to a file named `keyfile.txt` (or another name you prefer).
2. **Restrict key permissions** (required by SSH for security):
   ```bash
   chmod 600 keyfile.txt
   ```
3. **Execute the SSH command** to connect:
   ```bash
   ssh developer@94.136.189.250 -i keyfile.txt
   ```

---

> [!WARNING]
> Orscope Technologies LLP reserves the right to discontinue this service without prior notice if the applicable Terms of Service (ToS) are breached.
