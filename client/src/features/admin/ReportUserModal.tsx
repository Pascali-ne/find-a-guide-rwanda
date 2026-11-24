import { Flag } from "lucide-react";
import { useState, type FormEvent } from "react";
import { Alert, Field, Modal, btnDanger, btnSecondary, inputClass } from "../../components/ui";
import { api, errorMessage } from "../../lib/api";

/** FR 13 - tourists and guides can report unsafe or abusive users. */
export default function ReportUserModal({ userId, userName, onClose }: { userId: string; userName: string; onClose: () => void }) {
  const [reason, setReason] = useState("");
  const [error, setError] = useState("");
  const [done, setDone] = useState(false);
  const [busy, setBusy] = useState(false);

  async function submit(e: FormEvent) {
    e.preventDefault();
    if (reason.trim().length < 10) return setError("Please describe the problem in at least 10 characters.");
    setBusy(true);
    setError("");
    try {
      await api.post("/api/reports", { reportedUserId: userId, reason });
      setDone(true);
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setBusy(false);
    }
  }

  return (
    <Modal title={`Report ${userName}`} onClose={onClose}>
      {done ? (
        <div className="space-y-4">
          <Alert kind="success">Thank you. Our administrators will review your report. If you are in danger, call 112 immediately.</Alert>
          <button className={btnSecondary} onClick={onClose}>Close</button>
        </div>
      ) : (
        <form onSubmit={submit} className="space-y-4">
          <p className="text-sm text-stone-600">Tell us what happened. Reports are reviewed by an administrator and are not shared with the person you report.</p>
          {error && <Alert>{error}</Alert>}
          <Field label="What happened?"><textarea rows={5} className={inputClass} value={reason} onChange={(e) => setReason(e.target.value)} placeholder="Describe unsafe, abusive or fraudulent behaviour." /></Field>
          <div className="flex gap-2"><button className={btnDanger} disabled={busy}><Flag className="size-4" /> Submit report</button><button type="button" className={btnSecondary} onClick={onClose}>Cancel</button></div>
        </form>
      )}
    </Modal>
  );
}
