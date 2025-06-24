// lib/api/entries.ts
export async function createTransactionEntry(data: {
  type: "ausgabe" | "einnahme"
  amount: number
  description?: string
  categoryId?: number
  currency?: string
  startDate?: string
}) {
  const response = await fetch("/entries/create", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    credentials: "include", // for JWT cookie auth
    body: JSON.stringify(data),
  })

  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.message || "Fehler beim Speichern der Transaktion.")
  }

  return await response.json()
}
