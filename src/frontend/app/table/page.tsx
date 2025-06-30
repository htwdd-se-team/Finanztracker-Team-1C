import EditTransactionButtonDemo from '@/components/edit-transaction-button-demo'

export default function tablePage() {
  return (
    <>
      <h1 className="text-xl font-bold">📋 Tabellen</h1>
      <p>Hier kommt die Tabelle hin</p>
      <div className="mt-4">
        <EditTransactionButtonDemo />
      </div>
    </>
  )
}
